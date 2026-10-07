'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { canCreateProjectRole } from '@/types/project';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { createProject } from '@/services/projects/create-project';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import { analyzeSmartImportWorkbook } from '@/services/smart-import/analyze-workbook';
import { buildWbsFromBoq } from '@/lib/smart-import/build-wbs-from-boq';
import { planBoqResourceLinks } from '@/lib/smart-import/link-boq-resources';
import { buildImportReconciliationReport } from '@/lib/smart-import/reconciliation';
import {
  buildValidationReport,
  matchImportResources,
} from '@/lib/smart-import/validate-and-match';
import { getEstimateSummary } from '@/services/estimate/get-estimate-summary';
import { generateTenderSubmission } from '@/services/tender/generate-tender-submission';
import { DEFAULT_ENABLED_TENDER_SECTIONS } from '@/types/tender';
import { MCC_PROFILE_KEY } from '@/types/smart-import';
import type { ImportReconciliationReport } from '@/types/master-template';
import type { Json } from '@/types/database';
import type { RateLibraryCategory } from '@/types/database';

export interface SmartImportResult {
  success: boolean;
  error?: string;
  projectId?: string;
  jobId?: string;
  wbsCount?: number;
  boqCount?: number;
  resourceCount?: number;
  linkedBoqCount?: number;
  validationErrors?: number;
  tenderVersion?: number;
  profileKey?: string | null;
  reconciliation?: ImportReconciliationReport;
}

function asCategory(value: string | null | undefined): RateLibraryCategory {
  const allowed: RateLibraryCategory[] = [
    'material',
    'labor',
    'equipment',
    'subcontract',
    'service',
    'productivity',
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as RateLibraryCategory;
  }
  return 'material';
}

function mapBuildingType(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes('resid')) return 'residential';
  if (v.includes('commerc') || v.includes('office') || v.includes('retail')) {
    return 'commercial';
  }
  if (v.includes('indust') || v.includes('warehouse')) return 'industrial';
  if (v.includes('infra') || v.includes('road') || v.includes('bridge')) {
    return 'infrastructure';
  }
  if (v.includes('civil')) return 'civil';
  if (v.includes('renov')) return 'renovation';
  return 'other';
}

function mapContractType(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes('lump')) return 'lump_sum';
  if (v.includes('unit')) return 'unit_price';
  if (v.includes('cost')) return 'cost_plus';
  if (v.includes('design')) return 'design_build';
  if (v.includes('manage')) return 'management';
  return 'other';
}

export async function runSmartExcelImport(
  formData: FormData
): Promise<SmartImportResult> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  if (!canCreateProjectRole(profile.role)) {
    return { success: false, error: 'You do not have permission to import projects.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'No Excel file uploaded.' };
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.xlsx')) {
    return { success: false, error: 'Only .xlsx workbooks are supported.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = await createClient();

  let analysis;
  try {
    analysis = await analyzeSmartImportWorkbook(buffer);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze workbook.',
    };
  }

  const { data: job, error: jobError } = await supabase
    .from('smart_import_jobs')
    .insert({
      status: 'analyzing',
      original_filename: file.name,
      mime_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      file_size_bytes: buffer.byteLength,
      content_base64: buffer.toString('base64'),
      analysis: analysis as unknown as Json,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (jobError || !job) {
    if (
      jobError?.message?.includes('does not exist') ||
      jobError?.message?.includes('schema cache') ||
      jobError?.code === '42P01'
    ) {
      return {
        success: false,
        error:
          'Smart Import tables are not applied yet. Run supabase/fixes/smart-excel-import-engine.sql',
      };
    }
    return {
      success: false,
      error: jobError?.message ?? 'Failed to store import job.',
    };
  }

  const createResult = await createProject({
    project_name: analysis.project_info.project_name,
    client_name: analysis.project_info.client_name,
    location: analysis.project_info.location ?? undefined,
    description: `Smart-imported from ${file.name}`,
  });

  if (!createResult.success || !createResult.projectId) {
    await supabase
      .from('smart_import_jobs')
      .update({
        status: 'failed',
        error_message: createResult.error ?? 'Project create failed',
      })
      .eq('id', job.id);
    return {
      success: false,
      error: createResult.error ?? 'Failed to create project.',
      jobId: job.id,
    };
  }

  const projectId = createResult.projectId;

  await supabase
    .from('smart_import_jobs')
    .update({ project_id: projectId, status: 'importing' })
    .eq('id', job.id);

  const mappedType = mapBuildingType(analysis.project_info.building_type);
  const mappedContract = mapContractType(analysis.project_info.contract_type);

  // Enrich project details from extracted info (optional columns soft-fail).
  await supabase
    .from('project_details')
    .update({
      project_type: mappedType,
      contract_type: mappedContract,
      currency: analysis.project_info.currency ?? 'PHP',
      assumptions: analysis.assumptions,
      exclusions: analysis.exclusions,
      commercial_notes: analysis.notes || null,
      prepared_by_name: analysis.project_info.prepared_by,
      building_type: analysis.project_info.building_type,
      project_category: analysis.project_info.project_category,
      cfa_sqm: analysis.project_info.cfa_sqm,
      number_of_buildings: analysis.project_info.number_of_buildings,
      number_of_units: analysis.project_info.number_of_units,
      estimate_revision: analysis.project_info.revision,
      smart_import_job_id: job.id,
      import_profile_key: analysis.profile_key ?? MCC_PROFILE_KEY,
      updated_by: profile.id,
    })
    .eq('project_id', projectId);

  const { wbs, boq } = buildWbsFromBoq(analysis.boq_rows);
  const tempToId = new Map<string, string>();

  // Insert WBS by level.
  const sortedWbs = [...wbs].sort((a, b) => a.level - b.level || a.sort_order - b.sort_order);
  for (const node of sortedWbs) {
    const { data: created, error } = await supabase
      .from('wbs')
      .insert({
        project_id: projectId,
        parent_id: node.parent_temp_id
          ? (tempToId.get(node.parent_temp_id) ?? null)
          : null,
        level: node.level,
        wbs_code: node.wbs_code,
        description: node.description,
        sort_order: node.sort_order,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (error || !created) {
      await supabase
        .from('smart_import_jobs')
        .update({ status: 'failed', error_message: error?.message ?? 'WBS import failed' })
        .eq('id', job.id);
      return { success: false, error: error?.message ?? 'WBS import failed', projectId, jobId: job.id };
    }
    tempToId.set(node.temp_id, created.id);
  }

  const { data: companyLibrary } = await supabase
    .from('rate_library_items')
    .select('id, code, description, category, unit_cost')
    .is('deleted_at', null)
    .eq('is_active', true)
    .limit(2000);

  const linkPlan = planBoqResourceLinks({
    boqRows: analysis.boq_rows,
    resourceRows: analysis.resource_rows,
    companyLibrary: (companyLibrary ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category,
      unit_cost: Number(row.unit_cost),
    })),
  });

  const resourceCodeToId = new Map<string, string>();
  for (const item of linkPlan.resources) {
    const { data: created, error: resourceError } = await supabase
      .from('project_rate_library_items')
      .insert({
        project_id: projectId,
        code: item.code.slice(0, 50),
        description: item.description.slice(0, 500),
        unit: item.unit || 'item',
        unit_cost: Number(item.unit_cost ?? 0),
        category: asCategory(item.category),
        source_company_item_id: item.source_company_item_id,
        source_unit_cost: item.source_company_item_id
          ? Number(item.unit_cost ?? 0)
          : null,
        is_active: true,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id, code')
      .single();
    if (resourceError || !created) {
      // Unique conflict: fetch existing
      const { data: existing } = await supabase
        .from('project_rate_library_items')
        .select('id, code')
        .eq('project_id', projectId)
        .eq('code', item.code.slice(0, 50))
        .is('deleted_at', null)
        .maybeSingle();
      if (existing) {
        resourceCodeToId.set(existing.code, existing.id);
      }
      continue;
    }
    resourceCodeToId.set(created.code, created.id);
  }

  const { data: projectLibrary } = await supabase
    .from('project_rate_library_items')
    .select('id, code, description, category, unit_cost')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const resourceMatches = matchImportResources({
    boqRows: analysis.boq_rows,
    resourceRows: analysis.resource_rows,
    companyLibrary: (companyLibrary ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category,
      unit_cost: Number(row.unit_cost),
    })),
    projectLibrary: (projectLibrary ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category,
      unit_cost: Number(row.unit_cost),
    })),
  });

  // Insert BOQ lines and link each to a project resource via rate analysis.
  const boqItemNumberToId = new Map<string, string>();
  let linkedBoqCount = 0;

  for (const row of boq) {
    const wbsId = tempToId.get(row.wbs_temp_id);
    if (!wbsId) continue;
    const unitRate = row.unit_rate || (row.quantity > 0 ? row.amount / row.quantity : 0);
    const amount = row.amount || row.quantity * unitRate;
    const { data: createdBoq, error } = await supabase
      .from('boq_items')
      .insert({
        project_id: projectId,
        wbs_id: wbsId,
        item_code: row.item_number.slice(0, 50),
        description: row.description.slice(0, 1000),
        unit: row.unit || 'item',
        quantity: row.quantity,
        material_rate: unitRate,
        labor_rate: 0,
        equipment_rate: 0,
        subcontract_rate: 0,
        other_cost_rate: 0,
        total_rate: unitRate,
        total_amount: amount,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id, item_code')
      .single();
    if (error || !createdBoq) {
      await supabase
        .from('smart_import_jobs')
        .update({ status: 'failed', error_message: error?.message ?? 'BOQ import failed' })
        .eq('id', job.id);
      return {
        success: false,
        error: error?.message ?? 'BOQ import failed',
        projectId,
        jobId: job.id,
      };
    }
    boqItemNumberToId.set(row.item_number, createdBoq.id);

    const link = linkPlan.links.find(
      (entry) => entry.boq_item_number === row.item_number
    );
    const projectLibraryItemId = link
      ? resourceCodeToId.get(link.resource_code) ?? null
      : null;

    if (projectLibraryItemId && link) {
      const { error: analysisError } = await supabase
        .from('boq_rate_analysis_lines')
        .insert({
          boq_item_id: createdBoq.id,
          project_library_item_id: projectLibraryItemId,
          category: link.category,
          resource_name: row.description.slice(0, 200),
          unit: row.unit || 'item',
          consumption: link.consumption,
          unit_cost: link.unit_cost,
          waste_percent: 0,
          productivity: link.productivity,
          amount: link.amount,
          sort_order: 0,
        });
      if (!analysisError) {
        linkedBoqCount += 1;
      }
    }
  }

  await refreshProjectEstimate(projectId, profile.id);

  const summary = await getEstimateSummary(projectId, {
    sync: true,
    profileId: profile.id,
  });

  const excelBoqTotal = analysis.boq_rows
    .filter((row) => !row.is_group_header)
    .reduce((sum, row) => sum + (row.amount || row.quantity * row.unit_rate), 0);

  const reconciliation = buildImportReconciliationReport({
    excelBoqTotal,
    excelBidPrice: analysis.bid_summary.bid_price ?? null,
    excelDirectCost: analysis.bid_summary.direct_cost ?? null,
    quantixDirectCost: summary?.breakdown.direct_cost ?? 0,
    quantixGrandTotal: summary?.breakdown.grand_total ?? 0,
  });

  const validation = buildValidationReport({
    boqRows: analysis.boq_rows,
    wbsCount: wbs.length,
    resourceMatches,
  });
  if (!reconciliation.overall_pass) {
    validation.issues.push({
      severity: 'warning',
      code: 'RECONCILIATION_VARIANCE',
      message: `Import reconciliation variance exceeds tolerance (±${reconciliation.tolerance_percent}%).`,
    });
    validation.warning_count += 1;
  }

  // Tender package (non-blocking if tables missing)
  let tenderVersion: number | undefined;
  const tender = await generateTenderSubmission({
    projectId,
    enabledSections: DEFAULT_ENABLED_TENDER_SECTIONS.filter((id) =>
      [
        'cover_page',
        'executive_summary',
        'estimate_summary',
        'boq',
        'detailed_resource_analysis',
        'cost_breakdown',
        'assumptions',
        'exclusions',
        'ai_insights',
      ].includes(id)
    ),
    exportTypes: ['pdf', 'excel', 'zip'],
    preparedBy: analysis.project_info.prepared_by ?? profile.full_name,
    assumptions: analysis.assumptions,
    exclusions: analysis.exclusions,
    commercialNotes: analysis.notes,
  });
  if (tender.success) {
    tenderVersion = tender.version;
  }

  const status =
    validation.error_count > 0 || validation.needs_review_count > 0
      ? 'needs_review'
      : 'completed';

  await supabase
    .from('smart_import_jobs')
    .update({
      status,
      validation_report: validation as unknown as Json,
      resource_matches: resourceMatches as unknown as Json,
      ai_findings: [
        ...analysis.ai_findings,
        `Linked ${linkedBoqCount} BOQ items to project resources via rate analysis.`,
        reconciliation.overall_pass
          ? 'Import reconciliation PASS.'
          : 'Import reconciliation needs review.',
      ] as unknown as Json,
      reconciliation_report: reconciliation as unknown as Json,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  // Learning engine: increment profile success count
  if (analysis.profile_key) {
    const { data: existingProfile } = await supabase
      .from('smart_import_profiles')
      .select('id, success_count')
      .eq('profile_key', analysis.profile_key)
      .maybeSingle();
    if (existingProfile) {
      await supabase
        .from('smart_import_profiles')
        .update({
          success_count: Number(existingProfile.success_count ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
    }
  }

  await logAuditEvent({
    projectId,
    entityType: 'smart_import_job',
    entityId: job.id,
    action: 'smart_import.completed',
    actorId: profile.id,
    module: 'admin',
    remarks: `Smart import from ${file.name}`,
    payload: {
      profile_key: analysis.profile_key,
      wbs_count: wbs.length,
      boq_count: boq.length,
      resource_count: linkPlan.resources.length,
      linked_boq_count: linkedBoqCount,
      validation_errors: validation.error_count,
      reconciliation_pass: reconciliation.overall_pass,
    },
  });

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projectWbs(projectId));
  revalidatePath(ROUTES.projectBoq(projectId));
  revalidatePath(ROUTES.projectRates(projectId));
  revalidatePath(ROUTES.projectSummary(projectId));
  revalidatePath(ROUTES.projectTender(projectId));
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.historical);

  return {
    success: true,
    projectId,
    jobId: job.id,
    wbsCount: wbs.length,
    boqCount: boq.length,
    resourceCount: linkPlan.resources.length,
    linkedBoqCount,
    validationErrors: validation.error_count,
    tenderVersion,
    profileKey: analysis.profile_key,
    reconciliation,
  };
}
