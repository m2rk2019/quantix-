'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { getHistoricalProjectById } from '@/services/historical-projects/get-historical-project';
import type { ActionResult } from '@/services/projects/create-project';
import type { CloneHistoricalProjectInput } from '@/types/historical-project';
import { canCreateProjectRole } from '@/types/project';
import type { RateLibraryCategory } from '@/types/database';

interface WbsSnap {
  id: string;
  parent_id: string | null;
  level: number;
  wbs_code: string;
  description: string;
  sort_order: number;
}

interface BoqSnap {
  id: string;
  wbs_id: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  material_rate_override: boolean;
  labor_rate_override: boolean;
  equipment_rate_override: boolean;
  subcontract_rate_override: boolean;
  other_cost_rate_override: boolean;
  ocm_percent: number | null;
  contingency_percent: number | null;
  profit_percent: number | null;
  vat_percent: number | null;
  rate_buildup_direct_cost: number | null;
  total_rate: number;
  total_amount: number;
}

interface RateSnap {
  id: string;
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active: boolean;
  supplier_id: string | null;
  unit_id: string | null;
  resource_category_id: string | null;
  source_company_item_id: string | null;
  source_unit_cost: number | null;
  source_updated_at: string | null;
  ignore_company_updates: boolean;
}

interface AnalysisSnap {
  boq_item_id: string;
  library_item_id: string | null;
  project_library_item_id: string | null;
  category: RateLibraryCategory;
  resource_name: string;
  unit: string;
  consumption: number;
  unit_cost: number;
  waste_percent: number;
  productivity: number | null;
  amount: number;
  sort_order: number;
}

function payloadSection(
  snapshots: Array<{ section: string; payload: Record<string, unknown> }>,
  section: string
): Record<string, unknown> {
  return snapshots.find((row) => row.section === section)?.payload ?? {};
}

export async function cloneHistoricalProject(
  input: CloneHistoricalProjectInput
): Promise<ActionResult> {
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
    return {
      success: false,
      error: 'You do not have permission to create projects.',
    };
  }

  const historical = await getHistoricalProjectById(input.historicalProjectId);
  if (!historical) {
    return { success: false, error: 'Historical project not found.' };
  }

  const supabase = await createClient();
  const company = await getCompanySettings();

  const { data: projectCode, error: codeError } = await supabase.rpc(
    'generate_project_code'
  );
  if (codeError || !projectCode) {
    return { success: false, error: 'Failed to generate project code.' };
  }

  const projectName =
    input.project_name?.trim() ||
    `${historical.project_name} (Clone)`;
  const clientName =
    input.client_name?.trim() || historical.client_name;
  const location =
    input.location === undefined
      ? historical.location
      : input.location?.trim() || null;

  const info = payloadSection(historical.snapshots, 'project_information');
  const detailsSnap = (info.details ?? {}) as Record<string, unknown>;
  const wbsSnap = payloadSection(historical.snapshots, 'wbs');
  const boqSnap = payloadSection(historical.snapshots, 'boq');
  const ratesSnap = payloadSection(
    historical.snapshots,
    'project_resource_library'
  );
  const summarySnap = payloadSection(historical.snapshots, 'estimate_summary');

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      project_code: projectCode,
      project_name: projectName,
      client_name: clientName,
      location,
      status: 'draft',
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select('id')
    .single();

  if (projectError || !project) {
    return {
      success: false,
      error: projectError?.message ?? 'Failed to create project.',
    };
  }

  const { error: detailsError } = await supabase.from('project_details').insert({
    project_id: project.id,
    description:
      typeof detailsSnap.description === 'string'
        ? detailsSnap.description
        : `Cloned from historical ${historical.project_code}`,
    owner:
      typeof detailsSnap.owner === 'string' ? detailsSnap.owner : null,
    consultant:
      typeof detailsSnap.consultant === 'string'
        ? detailsSnap.consultant
        : null,
    contractor:
      typeof detailsSnap.contractor === 'string'
        ? detailsSnap.contractor
        : null,
    project_type:
      typeof detailsSnap.project_type === 'string'
        ? detailsSnap.project_type
        : historical.project_type,
    contract_type:
      typeof detailsSnap.contract_type === 'string'
        ? detailsSnap.contract_type
        : historical.contract_type,
    currency:
      typeof detailsSnap.currency === 'string'
        ? detailsSnap.currency
        : historical.currency || company.default_currency,
    vat_percent:
      typeof detailsSnap.vat_percent === 'number'
        ? detailsSnap.vat_percent
        : company.default_vat_percent,
    markup_percent:
      typeof detailsSnap.markup_percent === 'number'
        ? detailsSnap.markup_percent
        : company.default_profit_percent,
    contingency_percent:
      typeof detailsSnap.contingency_percent === 'number'
        ? detailsSnap.contingency_percent
        : company.default_contingency_percent,
    indirect_cost_percent:
      typeof detailsSnap.indirect_cost_percent === 'number'
        ? detailsSnap.indirect_cost_percent
        : company.default_ocm_percent,
    rounding_rule:
      typeof detailsSnap.rounding_rule === 'string'
        ? (detailsSnap.rounding_rule as 'half_up')
        : 'half_up',
    measurement_system:
      typeof detailsSnap.measurement_system === 'string'
        ? (detailsSnap.measurement_system as 'metric')
        : 'metric',
    default_unit_system:
      typeof detailsSnap.default_unit_system === 'string'
        ? detailsSnap.default_unit_system
        : 'metric_si',
    cloned_from_historical_id: historical.id,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (detailsError) {
    // Backward compatible if migration not applied yet.
    if (
      detailsError.message.includes('cloned_from_historical_id') ||
      detailsError.message.includes('schema cache')
    ) {
      const { error: fallbackDetailsError } = await supabase
        .from('project_details')
        .insert({
          project_id: project.id,
          description:
            typeof detailsSnap.description === 'string'
              ? detailsSnap.description
              : `Cloned from historical ${historical.project_code}`,
          owner:
            typeof detailsSnap.owner === 'string' ? detailsSnap.owner : null,
          consultant:
            typeof detailsSnap.consultant === 'string'
              ? detailsSnap.consultant
              : null,
          contractor:
            typeof detailsSnap.contractor === 'string'
              ? detailsSnap.contractor
              : null,
          project_type:
            typeof detailsSnap.project_type === 'string'
              ? detailsSnap.project_type
              : historical.project_type,
          contract_type:
            typeof detailsSnap.contract_type === 'string'
              ? detailsSnap.contract_type
              : historical.contract_type,
          currency:
            typeof detailsSnap.currency === 'string'
              ? detailsSnap.currency
              : historical.currency || company.default_currency,
          vat_percent:
            typeof detailsSnap.vat_percent === 'number'
              ? detailsSnap.vat_percent
              : company.default_vat_percent,
          markup_percent:
            typeof detailsSnap.markup_percent === 'number'
              ? detailsSnap.markup_percent
              : company.default_profit_percent,
          contingency_percent:
            typeof detailsSnap.contingency_percent === 'number'
              ? detailsSnap.contingency_percent
              : company.default_contingency_percent,
          indirect_cost_percent:
            typeof detailsSnap.indirect_cost_percent === 'number'
              ? detailsSnap.indirect_cost_percent
              : company.default_ocm_percent,
          rounding_rule:
            typeof detailsSnap.rounding_rule === 'string'
              ? (detailsSnap.rounding_rule as 'half_up')
              : 'half_up',
          measurement_system:
            typeof detailsSnap.measurement_system === 'string'
              ? (detailsSnap.measurement_system as 'metric')
              : 'metric',
          default_unit_system:
            typeof detailsSnap.default_unit_system === 'string'
              ? detailsSnap.default_unit_system
              : 'metric_si',
          created_by: profile.id,
          updated_by: profile.id,
        });
      if (fallbackDetailsError) {
        return { success: false, error: fallbackDetailsError.message };
      }
    } else {
      return { success: false, error: detailsError.message };
    }
  }

  const summary = (summarySnap.summary ?? {}) as Record<string, number>;
  const { error: summaryError } = await supabase.from('estimate_summary').insert({
    project_id: project.id,
    direct_cost: Number(summary.direct_cost ?? 0),
    indirect_cost: Number(summary.indirect_cost ?? 0),
    contingency: Number(summary.contingency ?? 0),
    markup: Number(summary.markup ?? 0),
    vat: Number(summary.vat ?? 0),
    grand_total: Number(summary.grand_total ?? 0),
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (summaryError) {
    return { success: false, error: summaryError.message };
  }

  const wbsNodes = (Array.isArray(wbsSnap.nodes) ? wbsSnap.nodes : []) as WbsSnap[];
  const wbsIdMap = new Map<string, string>();

  // Insert by level so parents exist first
  const sortedWbs = [...wbsNodes].sort(
    (a, b) => a.level - b.level || a.sort_order - b.sort_order
  );
  for (const node of sortedWbs) {
    const { data: created, error: wbsError } = await supabase
      .from('wbs')
      .insert({
        project_id: project.id,
        parent_id: node.parent_id ? (wbsIdMap.get(node.parent_id) ?? null) : null,
        level: node.level,
        wbs_code: node.wbs_code,
        description: node.description,
        sort_order: node.sort_order,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (wbsError || !created) {
      return {
        success: false,
        error: wbsError?.message ?? 'Failed to clone WBS.',
      };
    }
    wbsIdMap.set(node.id, created.id);
  }

  const rateItems = (
    Array.isArray(ratesSnap.items) ? ratesSnap.items : []
  ) as RateSnap[];
  const rateIdMap = new Map<string, string>();
  for (const item of rateItems) {
    const { data: created, error: rateError } = await supabase
      .from('project_rate_library_items')
      .insert({
        project_id: project.id,
        code: item.code,
        description: item.description,
        unit: item.unit || 'item',
        unit_cost: Number(item.unit_cost ?? 0),
        category: item.category,
        is_active: item.is_active !== false,
        supplier_id: item.supplier_id,
        unit_id: item.unit_id,
        resource_category_id: item.resource_category_id,
        source_company_item_id: item.source_company_item_id,
        source_unit_cost: item.source_unit_cost,
        source_updated_at: item.source_updated_at,
        ignore_company_updates: Boolean(item.ignore_company_updates),
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (rateError || !created) {
      // Soft-continue if project rate library missing
      if (
        rateError?.message?.includes('does not exist') ||
        rateError?.message?.includes('schema cache')
      ) {
        break;
      }
      return {
        success: false,
        error: rateError?.message ?? 'Failed to clone project rates.',
      };
    }
    rateIdMap.set(item.id, created.id);
  }

  const boqItems = (
    Array.isArray(boqSnap.items) ? boqSnap.items : []
  ) as BoqSnap[];
  const boqIdMap = new Map<string, string>();
  for (const item of boqItems) {
    const newWbsId = wbsIdMap.get(item.wbs_id);
    if (!newWbsId) continue;
    const { data: created, error: boqError } = await supabase
      .from('boq_items')
      .insert({
        project_id: project.id,
        wbs_id: newWbsId,
        item_code: item.item_code,
        description: item.description,
        unit: item.unit || 'item',
        quantity: Number(item.quantity ?? 0),
        material_rate: Number(item.material_rate ?? 0),
        labor_rate: Number(item.labor_rate ?? 0),
        equipment_rate: Number(item.equipment_rate ?? 0),
        subcontract_rate: Number(item.subcontract_rate ?? 0),
        other_cost_rate: Number(item.other_cost_rate ?? 0),
        material_rate_override: Boolean(item.material_rate_override),
        labor_rate_override: Boolean(item.labor_rate_override),
        equipment_rate_override: Boolean(item.equipment_rate_override),
        subcontract_rate_override: Boolean(item.subcontract_rate_override),
        other_cost_rate_override: Boolean(item.other_cost_rate_override),
        ocm_percent: item.ocm_percent,
        contingency_percent: item.contingency_percent,
        profit_percent: item.profit_percent,
        vat_percent: item.vat_percent,
        rate_buildup_direct_cost: item.rate_buildup_direct_cost,
        total_rate: Number(item.total_rate ?? 0),
        total_amount: Number(item.total_amount ?? 0),
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (boqError || !created) {
      return {
        success: false,
        error: boqError?.message ?? 'Failed to clone BOQ.',
      };
    }
    boqIdMap.set(item.id, created.id);
  }

  const analysisLines = (
    Array.isArray(boqSnap.rate_analysis_lines)
      ? boqSnap.rate_analysis_lines
      : []
  ) as AnalysisSnap[];
  if (analysisLines.length > 0) {
    const rows = analysisLines
      .map((line) => {
        const newBoqId = boqIdMap.get(line.boq_item_id);
        if (!newBoqId) return null;
        return {
          boq_item_id: newBoqId,
          library_item_id: line.library_item_id,
          project_library_item_id: line.project_library_item_id
            ? (rateIdMap.get(line.project_library_item_id) ?? null)
            : null,
          category: line.category,
          resource_name: line.resource_name,
          unit: line.unit || 'item',
          consumption: Number(line.consumption ?? 0),
          unit_cost: Number(line.unit_cost ?? 0),
          waste_percent: Number(line.waste_percent ?? 0),
          productivity: line.productivity,
          amount: Number(line.amount ?? 0),
          sort_order: Number(line.sort_order ?? 0),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length > 0) {
      const { error: analysisError } = await supabase
        .from('boq_rate_analysis_lines')
        .insert(rows);
      if (analysisError) {
        return { success: false, error: analysisError.message };
      }
    }
  }

  await logAuditEvent({
    projectId: project.id,
    entityType: 'project',
    entityId: project.id,
    action: 'historical.cloned',
    actorId: profile.id,
    module: 'historical',
    oldValue: historical.id,
    newValue: project.id,
    remarks: `Cloned from historical ${historical.project_code}`,
    payload: {
      historical_project_id: historical.id,
      source_project_code: historical.project_code,
      new_project_code: projectCode,
    },
  });

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.historical);
  revalidatePath(ROUTES.dashboard);

  return { success: true, projectId: project.id };
}
