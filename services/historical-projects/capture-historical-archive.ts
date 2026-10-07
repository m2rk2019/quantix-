import type { Json } from '@/types/database';
import type { HistoricalSnapshotSection } from '@/types/historical-project';
import { createClient } from '@/lib/supabase/server';
import { getLatestTenderSubmissionForProject } from '@/services/tender/generate-tender-submission';

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface CaptureHistoricalArchiveResult {
  success: boolean;
  historicalProjectId?: string;
  error?: string;
  skipped?: boolean;
}

function uniqueTags(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function asJson(value: unknown): Json {
  return value as Json;
}

async function replaceChildren(
  supabase: SupabaseServer,
  historicalProjectId: string
): Promise<void> {
  await supabase
    .from('historical_boq_lines')
    .delete()
    .eq('historical_project_id', historicalProjectId);
  await supabase
    .from('historical_resource_rates')
    .delete()
    .eq('historical_project_id', historicalProjectId);
  await supabase
    .from('historical_project_snapshots')
    .delete()
    .eq('historical_project_id', historicalProjectId);
}

/**
 * Capture (or refresh) an immutable historical archive for a completed estimate.
 * Safe to call on approve and archive. Soft-skips if tables are not migrated yet.
 */
export async function captureHistoricalArchive(
  projectId: string,
  actorId: string,
  options?: { trigger?: 'approved' | 'archived' | 'manual' }
): Promise<CaptureHistoricalArchiveResult> {
  const supabase = await createClient();
  const trigger = options?.trigger ?? 'manual';

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        `
        id,
        project_code,
        project_name,
        client_name,
        location,
        status,
        approved_at,
        archived_at,
        created_at,
        project_details (
          description,
          owner,
          consultant,
          contractor,
          project_type,
          contract_type,
          currency,
          vat_percent,
          markup_percent,
          contingency_percent,
          indirect_cost_percent,
          rounding_rule,
          measurement_system,
          default_unit_system,
          is_benchmark
        ),
        estimate_summary (
          direct_cost,
          indirect_cost,
          contingency,
          markup,
          vat,
          grand_total
        )
      `
      )
      .eq('id', projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (projectError || !project) {
      return {
        success: false,
        error: projectError?.message ?? 'Project not found.',
      };
    }

    // Only completed estimates become company knowledge.
    if (project.status !== 'approved' && project.status !== 'archived') {
      return {
        success: true,
        skipped: true,
        error: 'Project is not approved or archived.',
      };
    }

    const detailsRaw = Array.isArray(project.project_details)
      ? project.project_details[0]
      : project.project_details;
    const summaryRaw = Array.isArray(project.estimate_summary)
      ? project.estimate_summary[0]
      : project.estimate_summary;

    const { data: wbsRows } = await supabase
      .from('wbs')
      .select(
        'id, project_id, parent_id, level, wbs_code, description, sort_order, created_by, updated_by, created_at, updated_at, deleted_at'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true });

    const { data: boqRows } = await supabase
      .from('boq_items')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('item_code', { ascending: true });

    const boqIds = (boqRows ?? []).map((row) => row.id);
    let rateLines: Array<Record<string, unknown>> = [];
    if (boqIds.length > 0) {
      const { data: lines } = await supabase
        .from('boq_rate_analysis_lines')
        .select('*')
        .in('boq_item_id', boqIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      rateLines = (lines ?? []) as Array<Record<string, unknown>>;
    }

    const { data: rateRows, error: rateError } = await supabase
      .from('project_rate_library_items')
      .select(
        'id, project_id, code, description, unit, unit_cost, category, is_active, supplier_id, unit_id, resource_category_id, source_company_item_id, source_unit_cost, source_updated_at, ignore_company_updates, created_by, updated_by, created_at, updated_at, deleted_at'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('code', { ascending: true });

    // Soft-skip project rates if table missing; still archive core estimate.
    const projectRates = rateError ? [] : (rateRows ?? []);

    const supplierIds = Array.from(
      new Set(
        projectRates
          .map((row) => row.supplier_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    const supplierNameById = new Map<string, string>();
    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabase
        .from('company_suppliers')
        .select('id, name')
        .in('id', supplierIds);
      for (const supplier of suppliers ?? []) {
        supplierNameById.set(supplier.id, supplier.name);
      }
    }

    const { data: aiEvents } = await supabase
      .from('audit_log')
      .select('id, action, actor_id, payload, created_at, entity_type, entity_id')
      .eq('project_id', projectId)
      .or('action.ilike.ai_estimate.%,action.ilike.ai.%')
      .order('created_at', { ascending: false })
      .limit(100);

    const wbsById = new Map((wbsRows ?? []).map((row) => [row.id, row]));
    const disciplineTags = uniqueTags(
      (wbsRows ?? [])
        .filter((row) => row.level <= 1)
        .map((row) => row.description)
    );
    const resourceTags = uniqueTags(
      projectRates.map((row) => row.description || row.code)
    );
    const supplierTags = uniqueTags(
      projectRates.map((row) =>
        row.supplier_id ? supplierNameById.get(row.supplier_id) : null
      )
    );

    const buildingType = detailsRaw?.project_type ?? null;
    const estimateDate =
      project.archived_at ?? project.approved_at ?? project.created_at;

    const { data: existing } = await supabase
      .from('historical_projects')
      .select('id, archive_version')
      .eq('source_project_id', projectId)
      .eq('is_knowledge_active', true)
      .maybeSingle();

    const nextVersion = (existing?.archive_version ?? 0) + 1;
    const registryPayload = {
      source_project_id: projectId,
      project_code: project.project_code,
      project_name: project.project_name,
      client_name: project.client_name,
      location: project.location,
      building_type: buildingType,
      project_type: detailsRaw?.project_type ?? null,
      contract_type: detailsRaw?.contract_type ?? null,
      currency: detailsRaw?.currency ?? 'PHP',
      discipline_tags: disciplineTags,
      resource_tags: resourceTags,
      supplier_tags: supplierTags,
      estimate_date: estimateDate,
      source_status: project.status,
      archive_version: existing ? nextVersion : 1,
      is_knowledge_active: true,
      is_benchmark_eligible: true,
      cost_intelligence_ready: true,
      grand_total: Number(summaryRaw?.grand_total ?? 0),
      direct_cost: Number(summaryRaw?.direct_cost ?? 0),
      indirect_cost: Number(summaryRaw?.indirect_cost ?? 0),
      contingency: Number(summaryRaw?.contingency ?? 0),
      markup: Number(summaryRaw?.markup ?? 0),
      vat: Number(summaryRaw?.vat ?? 0),
      boq_item_count: (boqRows ?? []).length,
      wbs_node_count: (wbsRows ?? []).length,
      resource_count: projectRates.length,
      archived_at: new Date().toISOString(),
      archived_by: actorId,
    };

    let historicalProjectId = existing?.id;

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('historical_projects')
        .update(registryPayload)
        .eq('id', existing.id);
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      await replaceChildren(supabase, existing.id);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('historical_projects')
        .insert(registryPayload)
        .select('id')
        .single();
      if (insertError || !inserted) {
        // Table may be missing on unmigrated environments — soft skip.
        if (
          insertError?.message?.includes('does not exist') ||
          insertError?.code === '42P01' ||
          insertError?.message?.includes('schema cache')
        ) {
          return {
            success: true,
            skipped: true,
            error: 'Historical Projects tables not applied yet.',
          };
        }
        return {
          success: false,
          error: insertError?.message ?? 'Failed to create historical project.',
        };
      }
      historicalProjectId = inserted.id;
    }

    if (!historicalProjectId) {
      return { success: false, error: 'Missing historical project id.' };
    }

    const latestTender = await getLatestTenderSubmissionForProject(projectId);

    const { data: importJobRaw, error: importJobError } = await supabase
      .from('smart_import_jobs')
      .select(
        'id, original_filename, file_size_bytes, content_base64, validation_report, ai_findings, analysis, profile_id, status'
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const importJob = importJobError ? null : importJobRaw;

    const snapshots: Array<{
      historical_project_id: string;
      section: HistoricalSnapshotSection;
      payload: Json;
    }> = [
      {
        historical_project_id: historicalProjectId,
        section: 'project_information',
        payload: asJson({
          project: {
            id: project.id,
            project_code: project.project_code,
            project_name: project.project_name,
            client_name: project.client_name,
            location: project.location,
            status: project.status,
            approved_at: project.approved_at,
            archived_at: project.archived_at,
          },
          details: detailsRaw ?? null,
        }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'wbs',
        payload: asJson({ nodes: wbsRows ?? [] }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'boq',
        payload: asJson({
          items: boqRows ?? [],
          rate_analysis_lines: rateLines,
        }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'project_resource_library',
        payload: asJson({
          items: projectRates.map((row) => ({
            ...row,
            supplier_name: row.supplier_id
              ? (supplierNameById.get(row.supplier_id) ?? null)
              : null,
          })),
        }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'estimate_summary',
        payload: asJson({ summary: summaryRaw ?? null }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'ai_outputs',
        payload: asJson({ events: aiEvents ?? [] }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'executive_reports',
        payload: asJson({
          captured_at: new Date().toISOString(),
          trigger,
          kpis: {
            direct_cost: Number(summaryRaw?.direct_cost ?? 0),
            indirect_cost: Number(summaryRaw?.indirect_cost ?? 0),
            contingency: Number(summaryRaw?.contingency ?? 0),
            markup: Number(summaryRaw?.markup ?? 0),
            vat: Number(summaryRaw?.vat ?? 0),
            grand_total: Number(summaryRaw?.grand_total ?? 0),
            boq_item_count: (boqRows ?? []).length,
            wbs_node_count: (wbsRows ?? []).length,
            resource_count: projectRates.length,
          },
          source_status: project.status,
          approved_at: project.approved_at,
          archived_at: project.archived_at,
        }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'tender_package',
        payload: asJson(
          latestTender
            ? {
                tender_submission_id: latestTender.id,
                version: latestTender.version,
                package_snapshot: latestTender.package_snapshot,
                exports: latestTender.exports.map((row) => ({
                  export_type: row.export_type,
                  filename: row.filename,
                  file_size_bytes: row.file_size_bytes,
                  content_base64: row.content_base64,
                })),
              }
            : {
                tender_submission_id: null,
                version: null,
                package_snapshot: null,
                exports: [],
                message: 'No tender package generated before archive.',
              }
        ),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'import_workbook',
        payload: asJson(
          importJob
            ? {
                job_id: importJob.id,
                original_filename: importJob.original_filename,
                file_size_bytes: importJob.file_size_bytes,
                content_base64: importJob.content_base64,
                status: importJob.status,
              }
            : { message: 'No smart-import workbook on this project.' }
        ),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'validation_report',
        payload: asJson(importJob?.validation_report ?? { issues: [] }),
      },
      {
        historical_project_id: historicalProjectId,
        section: 'ai_analysis',
        payload: asJson({
          findings: importJob?.ai_findings ?? [],
          analysis: importJob?.analysis ?? null,
        }),
      },
    ];

    const { error: snapError } = await supabase
      .from('historical_project_snapshots')
      .insert(snapshots);
    if (snapError) {
      return { success: false, error: snapError.message };
    }

    if ((boqRows ?? []).length > 0) {
      const boqLines = (boqRows ?? []).map((row) => {
        const wbs = wbsById.get(row.wbs_id);
        return {
          historical_project_id: historicalProjectId,
          source_boq_item_id: row.id,
          wbs_code: wbs?.wbs_code ?? null,
          wbs_description: wbs?.description ?? null,
          discipline: wbs?.description ?? null,
          item_code: row.item_code,
          description: row.description,
          unit: row.unit,
          quantity: Number(row.quantity),
          unit_rate: Number(row.total_rate),
          total_amount: Number(row.total_amount),
        };
      });
      const { error: boqIndexError } = await supabase
        .from('historical_boq_lines')
        .insert(boqLines);
      if (boqIndexError) {
        return { success: false, error: boqIndexError.message };
      }
    }

    if (projectRates.length > 0) {
      const resourceLines = projectRates.map((row) => ({
        historical_project_id: historicalProjectId,
        source_item_id: row.id,
        code: row.code,
        description: row.description,
        category: row.category,
        unit: row.unit,
        unit_cost: Number(row.unit_cost),
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_id
          ? (supplierNameById.get(row.supplier_id) ?? null)
          : null,
      }));
      const { error: resourceIndexError } = await supabase
        .from('historical_resource_rates')
        .insert(resourceLines);
      if (resourceIndexError) {
        return { success: false, error: resourceIndexError.message };
      }
    }

    return { success: true, historicalProjectId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Archive capture failed.',
    };
  }
}
