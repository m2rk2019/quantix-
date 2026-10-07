'use server';

/**
 * Import a new Excel BCB onto a project created from a Master Template.
 * Uses analyzeSmartImportWorkbook (read-only) — does NOT modify Import Engine v1.
 * Matching uses the permanent Quantix deterministic match engine (not row order).
 */

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import {
  calculateTotalAmount,
  roundCurrency,
} from '@/lib/boq/calculations';
import {
  buildWbsPathFromNodes,
  normalizeBoqText,
} from '@/lib/boq/deterministic-match';
import { ROUTES } from '@/lib/constants/routes';
import {
  compareImportedBoqToTemplate,
  type TemplateReuseReport,
} from '@/lib/master-templates/compare-boq-to-template';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import { analyzeSmartImportWorkbook } from '@/services/smart-import/analyze-workbook';
import { generateTenderSubmission } from '@/services/tender/generate-tender-submission';
import { DEFAULT_ENABLED_TENDER_SECTIONS } from '@/types/tender';
import type { MasterTemplateSnapshot } from '@/types/master-template';
import type { Json } from '@/types/database';
import { canCreateProjectRole } from '@/types/project';

export interface TemplateReuseImportResult {
  success: boolean;
  error?: string;
  report?: TemplateReuseReport;
  projectId?: string;
}

function resolveWbsId(
  row: { discipline: string; group_path: string[] },
  wbs: Array<{
    id: string;
    description: string;
    parent_id: string | null;
    level: number;
  }>
): string | null {
  const groupName = row.group_path[row.group_path.length - 1];
  if (groupName) {
    const group = wbs.find(
      (n) =>
        n.level >= 2 &&
        normalizeBoqText(n.description) === normalizeBoqText(groupName)
    );
    if (group) return group.id;
  }
  const disc = wbs.find(
    (n) =>
      n.level === 1 &&
      normalizeBoqText(n.description) === normalizeBoqText(row.discipline)
  );
  if (disc) return disc.id;
  return wbs.find((n) => n.level === 1)?.id ?? wbs[0]?.id ?? null;
}

function primaryBoqSheetName(
  sheets: Array<{ sheet_name: string; role: string }>
): string | null {
  const boq = sheets.find((s) => s.role === 'boq');
  return boq?.sheet_name ?? sheets[0]?.sheet_name ?? null;
}

export async function runTemplateReuseImport(
  projectId: string,
  formData: FormData
): Promise<TemplateReuseImportResult> {
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
    return { success: false, error: 'Permission denied.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'No Excel file uploaded.' };
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return { success: false, error: 'Only .xlsx workbooks are supported.' };
  }

  const supabase = await createClient();

  const { data: details, error: detailsError } = await supabase
    .from('project_details')
    .select('source_master_template_id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (detailsError || !details?.source_master_template_id) {
    return {
      success: false,
      error:
        'This project is not linked to a Master Template. Create the project from a template first.',
    };
  }

  const templateId = details.source_master_template_id;
  const { data: template, error: templateError } = await supabase
    .from('master_templates')
    .select('id, display_name, snapshot')
    .eq('id', templateId)
    .eq('is_active', true)
    .maybeSingle();

  if (templateError || !template) {
    return { success: false, error: 'Source master template not found.' };
  }

  const snapshot = template.snapshot as unknown as MasterTemplateSnapshot;
  if (!snapshot?.boq?.length) {
    return { success: false, error: 'Master template snapshot has no BOQ.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let analysis;
  try {
    analysis = await analyzeSmartImportWorkbook(buffer);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to analyze workbook.',
    };
  }

  const sourceWorkbook = file.name;
  const sourceSheet = primaryBoqSheetName(analysis.sheets);
  const importedAt = new Date().toISOString();

  const importedLeaves = analysis.boq_rows.filter((row) => !row.is_group_header);

  const { data: projectBoq } = await supabase
    .from('boq_items')
    .select(
      'id, item_code, description, unit, quantity, total_rate, total_amount, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, wbs_id'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const { data: projectWbs } = await supabase
    .from('wbs')
    .select('id, description, parent_id, level')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const wbsNodes = projectWbs ?? [];
  const projectWbsById = new Map(
    wbsNodes.map((n) => [n.id, n] as const)
  );

  const snapshotWbsById = new Map(
    (snapshot.wbs ?? []).map((n) => [
      n.id,
      { id: n.id, parent_id: n.parent_id, description: n.description },
    ])
  );

  const report = compareImportedBoqToTemplate({
    templateId: template.id,
    templateName: template.display_name,
    importedLeaves: importedLeaves.map((row) => ({
      item_code: row.item_number,
      description: row.description,
      unit: row.unit || 'item',
      quantity: Number(row.quantity),
      unit_rate: Number(row.unit_rate),
      amount: Number(row.amount),
      discipline: row.discipline,
      group_path: row.group_path,
      source_workbook: sourceWorkbook,
      source_sheet: sourceSheet,
      source_row: row.row_index,
    })),
    templateLines: snapshot.boq.map((row) => ({
      item_code: row.item_code,
      description: row.description,
      unit: row.unit || 'item',
      quantity: Number(row.quantity),
      unit_rate: Number(row.total_rate),
      amount: Number(row.total_amount),
      template_boq_id: row.id,
      wbs_path: buildWbsPathFromNodes(row.wbs_id, snapshotWbsById),
    })),
    projectLines: (projectBoq ?? []).map((row) => ({
      item_code: row.item_code,
      description: row.description,
      unit: row.unit || 'item',
      quantity: Number(row.quantity),
      unit_rate: Number(row.total_rate),
      amount: Number(row.total_amount),
      project_boq_id: row.id,
      wbs_path: buildWbsPathFromNodes(row.wbs_id, projectWbsById),
    })),
  });

  const projectById = new Map((projectBoq ?? []).map((row) => [row.id, row]));
  const templateById = new Map(snapshot.boq.map((row) => [row.id, row]));

  // Index imported leaves by source row for provenance application
  const importByRow = new Map(
    importedLeaves.map((row) => [row.row_index, row] as const)
  );

  for (const line of report.lines) {
    const provenance = {
      source_workbook: line.source_workbook,
      source_sheet: line.source_sheet,
      source_row: line.source_row,
      imported_at: importedAt,
      match_confidence: line.match_confidence,
      template_match_status: line.status,
      needs_estimator_review: line.needs_estimator_review,
      updated_by: profile.id,
    };

    if (line.status === 'removed_item') {
      if (line.project_boq_id) {
        await supabase
          .from('boq_items')
          .update({
            template_match_status: 'removed_item',
            needs_estimator_review: false,
            match_confidence: 0,
            deleted_at: importedAt,
            updated_by: profile.id,
          })
          .eq('id', line.project_boq_id)
          .eq('project_id', projectId);
      }
      continue;
    }

    if (line.status === 'new_item' || line.status === 'uncertain_match') {
      // Prefer updating an existing project row when we have a project link
      if (line.project_boq_id && line.status === 'uncertain_match') {
        const quantity = Number(line.applied_quantity ?? 0);
        const unitRate = Number(line.applied_unit_rate ?? 0);
        const { error: updateError } = await supabase
          .from('boq_items')
          .update({
            quantity,
            material_rate: unitRate,
            labor_rate: 0,
            equipment_rate: 0,
            subcontract_rate: 0,
            other_cost_rate: 0,
            total_rate: unitRate,
            total_amount: calculateTotalAmount(quantity, unitRate),
            ...provenance,
          })
          .eq('id', line.project_boq_id)
          .eq('project_id', projectId);
        if (updateError) {
          return { success: false, error: updateError.message };
        }
        continue;
      }

      const excelRow =
        (line.source_row != null ? importByRow.get(line.source_row) : null) ??
        importedLeaves.find(
          (row) =>
            normalizeBoqText(row.description) ===
              normalizeBoqText(line.description) &&
            normalizeBoqText(row.unit || 'item') ===
              normalizeBoqText(line.unit)
        );
      if (!excelRow) continue;
      const wbsId = resolveWbsId(excelRow, wbsNodes);
      if (!wbsId) {
        return {
          success: false,
          error: `Cannot place item "${excelRow.description}" — no WBS node available.`,
        };
      }
      const unitRate = Number(excelRow.unit_rate) || 0;
      const quantity = Number(excelRow.quantity) || 0;
      const { error: insertError } = await supabase.from('boq_items').insert({
        project_id: projectId,
        wbs_id: wbsId,
        item_code: (excelRow.item_number || 'NEW').slice(0, 50),
        description: excelRow.description.slice(0, 1000),
        unit: excelRow.unit || 'item',
        quantity,
        material_rate: unitRate,
        labor_rate: 0,
        equipment_rate: 0,
        subcontract_rate: 0,
        other_cost_rate: 0,
        total_rate: unitRate,
        total_amount: calculateTotalAmount(quantity, unitRate),
        template_match_status: line.status,
        needs_estimator_review: true,
        match_confidence: line.match_confidence,
        source_workbook: sourceWorkbook,
        source_sheet: sourceSheet,
        source_row: excelRow.row_index,
        imported_at: importedAt,
        created_by: profile.id,
        updated_by: profile.id,
      });
      if (insertError) {
        return { success: false, error: insertError.message };
      }
      continue;
    }

    // High-confidence: exact_match | quantity_changed | unit_rate_changed — reuse template rates
    const existing = line.project_boq_id
      ? projectById.get(line.project_boq_id)
      : null;
    const templateLine = line.template_boq_id
      ? templateById.get(line.template_boq_id)
      : null;
    if (!existing || !templateLine) {
      // Matched template but no project row — insert with reused rates
      if (!templateLine) continue;
      const excelRow =
        (line.source_row != null ? importByRow.get(line.source_row) : null) ??
        null;
      const wbsId = excelRow
        ? resolveWbsId(excelRow, wbsNodes)
        : wbsNodes[0]?.id ?? null;
      if (!wbsId) continue;
      const quantity = Number(line.applied_quantity ?? templateLine.quantity);
      const material = Number(templateLine.material_rate);
      const labor = Number(templateLine.labor_rate);
      const equipment = Number(templateLine.equipment_rate);
      const subcontract = Number(templateLine.subcontract_rate);
      const other = Number(templateLine.other_cost_rate);
      const totalRate = roundCurrency(
        material + labor + equipment + subcontract + other
      );
      const { error: insertError } = await supabase.from('boq_items').insert({
        project_id: projectId,
        wbs_id: wbsId,
        item_code: (line.item_code || templateLine.item_code).slice(0, 50),
        description: line.description.slice(0, 1000),
        unit: line.unit || 'item',
        quantity,
        material_rate: material,
        labor_rate: labor,
        equipment_rate: equipment,
        subcontract_rate: subcontract,
        other_cost_rate: other,
        total_rate: totalRate,
        total_amount: calculateTotalAmount(quantity, totalRate),
        template_match_status: line.status,
        needs_estimator_review: false,
        match_confidence: line.match_confidence,
        source_workbook: sourceWorkbook,
        source_sheet: sourceSheet,
        source_row: line.source_row,
        imported_at: importedAt,
        created_by: profile.id,
        updated_by: profile.id,
      });
      if (insertError) {
        return { success: false, error: insertError.message };
      }
      continue;
    }

    const quantity = Number(line.applied_quantity ?? existing.quantity);
    const material = Number(templateLine.material_rate);
    const labor = Number(templateLine.labor_rate);
    const equipment = Number(templateLine.equipment_rate);
    const subcontract = Number(templateLine.subcontract_rate);
    const other = Number(templateLine.other_cost_rate);
    const totalRate = roundCurrency(
      material + labor + equipment + subcontract + other
    );
    const totalAmount = calculateTotalAmount(quantity, totalRate);

    const { error: updateError } = await supabase
      .from('boq_items')
      .update({
        quantity,
        material_rate: material,
        labor_rate: labor,
        equipment_rate: equipment,
        subcontract_rate: subcontract,
        other_cost_rate: other,
        total_rate: totalRate,
        total_amount: totalAmount,
        ...provenance,
      })
      .eq('id', existing.id)
      .eq('project_id', projectId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  }

  await supabase
    .from('project_details')
    .update({
      template_reuse_report: report as unknown as Json,
      updated_by: profile.id,
    })
    .eq('project_id', projectId);

  await refreshProjectEstimate(projectId, profile.id);

  try {
    await generateTenderSubmission({
      projectId,
      enabledSections: DEFAULT_ENABLED_TENDER_SECTIONS,
      exportTypes: ['pdf', 'excel', 'zip'],
      preparedBy: profile.full_name,
    });
  } catch {
    // tender tables may be absent in some envs
  }

  await logAuditEvent({
    projectId,
    entityType: 'master_template',
    entityId: templateId,
    action: 'master_template.reuse_import',
    actorId: profile.id,
    module: 'admin',
    remarks: `Template reuse import against ${template.display_name}`,
    payload: {
      template_id: templateId,
      source_workbook: sourceWorkbook,
      exact_matches: report.exact_matches,
      quantity_changes: report.quantity_changes,
      unit_rate_changes: report.unit_rate_changes,
      new_items: report.new_items,
      removed_items: report.removed_items,
      uncertain_matches: report.uncertain_matches,
      percentage_boq_automatically_reused:
        report.percentage_boq_automatically_reused,
      match_reuse_threshold: report.match_reuse_threshold,
    },
  });

  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projectWbs(projectId));
  revalidatePath(ROUTES.projectBoq(projectId));
  revalidatePath(ROUTES.projectRates(projectId));
  revalidatePath(ROUTES.projectSummary(projectId));
  revalidatePath(ROUTES.projectTender(projectId));

  return { success: true, projectId, report };
}
