/**
 * BOQ ↔ Master Template comparison for Template Reuse workflow.
 * Uses the permanent Quantix deterministic match engine (not row order).
 * Does not touch Import Engine extractors.
 */

import {
  MATCH_REUSE_CONFIDENCE_THRESHOLD,
  assignBoqMatches,
  buildWbsPathFromImport,
  normalizeBoqText,
  type BoqMatchMethod,
} from '@/lib/boq/deterministic-match';

export type TemplateMatchStatus =
  | 'exact_match'
  | 'quantity_changed'
  | 'unit_rate_changed'
  | 'new_item'
  | 'removed_item'
  | 'uncertain_match';

export interface TemplateCompareBoqLine {
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_rate: number;
  amount: number;
  project_boq_id?: string | null;
  template_boq_id?: string | null;
  discipline?: string;
  group_path?: string[];
  wbs_path?: string[];
  /** Import provenance (Excel). */
  source_workbook?: string | null;
  source_sheet?: string | null;
  source_row?: number | null;
}

export interface TemplateReuseCompareLine {
  status: TemplateMatchStatus;
  match_key: string;
  description: string;
  unit: string;
  item_code: string;
  excel_quantity: number | null;
  excel_unit_rate: number | null;
  template_quantity: number | null;
  template_unit_rate: number | null;
  applied_quantity: number | null;
  applied_unit_rate: number | null;
  project_boq_id: string | null;
  template_boq_id: string | null;
  needs_estimator_review: boolean;
  match_confidence: number;
  match_method: BoqMatchMethod;
  rate_reused: boolean;
  source_workbook: string | null;
  source_sheet: string | null;
  source_row: number | null;
  notes: string[];
}

export interface TemplateReuseReport {
  generated_at: string;
  template_id: string;
  template_name: string;
  total_imported_items: number;
  exact_matches: number;
  quantity_changes: number;
  unit_rate_changes: number;
  new_items: number;
  removed_items: number;
  uncertain_matches: number;
  match_reuse_threshold: number;
  /** Share of imported items that reused template rates with high confidence. */
  percentage_boq_automatically_reused: number;
  lines: TemplateReuseCompareLine[];
}

const QTY_EPS = 1e-6;
const RATE_EPS = 0.02;

export function normalizeBoqTextExport(value: string): string {
  return normalizeBoqText(value);
}

/** @deprecated Prefer deterministic match engine; kept for callers that need a display key. */
export function buildBoqMatchKey(input: {
  description: string;
  unit: string;
  item_code?: string;
}): string {
  const code = String(input.item_code || '').trim();
  return `${code}|${normalizeBoqText(input.description)}|${normalizeBoqText(input.unit || 'item')}`;
}

function nearlyEqual(a: number, b: number, eps: number): boolean {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

export function classifyMatchedPair(input: {
  excelQty: number;
  excelRate: number;
  templateQty: number;
  templateRate: number;
}): Extract<
  TemplateMatchStatus,
  'exact_match' | 'quantity_changed' | 'unit_rate_changed'
> {
  const qtySame = nearlyEqual(input.excelQty, input.templateQty, QTY_EPS);
  const rateSame = nearlyEqual(input.excelRate, input.templateRate, RATE_EPS);
  if (qtySame && rateSame) return 'exact_match';
  if (!rateSame) return 'unit_rate_changed';
  return 'quantity_changed';
}

function lineWbsPath(line: TemplateCompareBoqLine): string[] {
  if (line.wbs_path?.length) return line.wbs_path;
  return buildWbsPathFromImport({
    discipline: line.discipline,
    group_path: line.group_path,
  });
}

/**
 * Compare Excel import leaves against template BOQ lines using deterministic matching.
 */
export function compareImportedBoqToTemplate(input: {
  templateId: string;
  templateName: string;
  importedLeaves: TemplateCompareBoqLine[];
  templateLines: TemplateCompareBoqLine[];
  projectLines?: TemplateCompareBoqLine[];
  reuseThreshold?: number;
}): TemplateReuseReport {
  const threshold =
    input.reuseThreshold ?? MATCH_REUSE_CONFIDENCE_THRESHOLD;

  const importCandidates = input.importedLeaves.map((line, index) => ({
    item_code: line.item_code,
    description: line.description,
    unit: line.unit || 'item',
    wbs_path: lineWbsPath(line),
    id: `import:${index}`,
  }));

  const templateCandidates = input.templateLines.map((line, index) => ({
    item_code: line.item_code,
    description: line.description,
    unit: line.unit || 'item',
    wbs_path: lineWbsPath(line),
    id: line.template_boq_id ?? `template:${index}`,
  }));

  const { assignments, unmatchedQueryIndexes, unmatchedCandidateIndexes } =
    assignBoqMatches(importCandidates, templateCandidates, {
      reuseThreshold: threshold,
    });

  // Map template / import → project BOQ (same engine, 1:1)
  const projectLines = input.projectLines ?? [];
  const projectCandidates = projectLines.map((line, index) => ({
    item_code: line.item_code,
    description: line.description,
    unit: line.unit || 'item',
    wbs_path: lineWbsPath(line),
    id: line.project_boq_id ?? `project:${index}`,
  }));
  const templateToProject = assignBoqMatches(
    templateCandidates,
    projectCandidates,
    { reuseThreshold: threshold }
  );
  const importToProject = assignBoqMatches(
    importCandidates,
    projectCandidates,
    { reuseThreshold: threshold }
  );

  const lines: TemplateReuseCompareLine[] = [];

  for (let qi = 0; qi < input.importedLeaves.length; qi += 1) {
    const excel = input.importedLeaves[qi];
    const assignment = assignments.get(qi);
    const matchKey = buildBoqMatchKey(excel);
    const provenance = {
      source_workbook: excel.source_workbook ?? null,
      source_sheet: excel.source_sheet ?? null,
      source_row: excel.source_row ?? null,
    };

    if (!assignment) {
      lines.push({
        status: 'new_item',
        match_key: matchKey,
        description: excel.description,
        unit: excel.unit || 'item',
        item_code: excel.item_code,
        excel_quantity: excel.quantity,
        excel_unit_rate: excel.unit_rate,
        template_quantity: null,
        template_unit_rate: null,
        applied_quantity: excel.quantity,
        applied_unit_rate: excel.unit_rate,
        project_boq_id: null,
        template_boq_id: null,
        needs_estimator_review: true,
        match_confidence: 0,
        match_method: 'none',
        rate_reused: false,
        ...provenance,
        notes: [
          'No matching template BOQ line — needs estimator review.',
        ],
      });
      continue;
    }

    const template = input.templateLines[assignment.candidate_index];
    const projectAssign =
      templateToProject.assignments.get(assignment.candidate_index) ??
      importToProject.assignments.get(qi);
    const project = projectAssign
      ? projectLines[projectAssign.candidate_index]
      : undefined;

    const classified = classifyMatchedPair({
      excelQty: excel.quantity,
      excelRate: excel.unit_rate,
      templateQty: template.quantity,
      templateRate: template.unit_rate,
    });

    if (!assignment.rate_reuse_allowed) {
      lines.push({
        status: 'uncertain_match',
        match_key: matchKey,
        description: excel.description,
        unit: excel.unit || 'item',
        item_code: excel.item_code || template.item_code,
        excel_quantity: excel.quantity,
        excel_unit_rate: excel.unit_rate,
        template_quantity: template.quantity,
        template_unit_rate: template.unit_rate,
        applied_quantity: excel.quantity,
        applied_unit_rate: excel.unit_rate,
        project_boq_id: project?.project_boq_id ?? null,
        template_boq_id: template.template_boq_id ?? null,
        needs_estimator_review: true,
        match_confidence: assignment.confidence,
        match_method: assignment.method,
        rate_reused: false,
        ...provenance,
        notes: [
          `Match confidence ${Math.round(assignment.confidence * 100)}% is below reuse threshold ${Math.round(threshold * 100)}% — rate not reused.`,
          ...assignment.notes,
          `Would classify as ${classified} if confidence were sufficient.`,
        ],
      });
      continue;
    }

    const notes: string[] = [...assignment.notes];
    if (classified === 'exact_match') {
      notes.push('Exact match — reused template unit rate.');
    } else if (classified === 'quantity_changed') {
      notes.push('Quantity updated from Excel; template unit rate retained.');
    } else {
      notes.push(
        'Excel unit rate differs from template — template/company rate retained.'
      );
      if (!nearlyEqual(excel.quantity, template.quantity, QTY_EPS)) {
        notes.push('Quantity also updated from Excel.');
      }
    }

    lines.push({
      status: classified,
      match_key: matchKey,
      description: excel.description,
      unit: excel.unit || 'item',
      item_code: excel.item_code || template.item_code,
      excel_quantity: excel.quantity,
      excel_unit_rate: excel.unit_rate,
      template_quantity: template.quantity,
      template_unit_rate: template.unit_rate,
      applied_quantity: excel.quantity,
      applied_unit_rate: template.unit_rate,
      project_boq_id: project?.project_boq_id ?? null,
      template_boq_id: template.template_boq_id ?? null,
      needs_estimator_review: false,
      match_confidence: assignment.confidence,
      match_method: assignment.method,
      rate_reused: true,
      ...provenance,
      notes,
    });
  }

  for (const ci of unmatchedCandidateIndexes) {
    const template = input.templateLines[ci];
    const projectAssign = templateToProject.assignments.get(ci);
    const project = projectAssign
      ? projectLines[projectAssign.candidate_index]
      : undefined;
    lines.push({
      status: 'removed_item',
      match_key: buildBoqMatchKey(template),
      description: template.description,
      unit: template.unit || 'item',
      item_code: template.item_code,
      excel_quantity: null,
      excel_unit_rate: null,
      template_quantity: template.quantity,
      template_unit_rate: template.unit_rate,
      applied_quantity: null,
      applied_unit_rate: null,
      project_boq_id: project?.project_boq_id ?? null,
      template_boq_id: template.template_boq_id ?? null,
      needs_estimator_review: false,
      match_confidence: 0,
      match_method: 'none',
      rate_reused: false,
      source_workbook: null,
      source_sheet: null,
      source_row: null,
      notes: [
        'Present in master template but missing from imported BCB — marked removed; history retained.',
      ],
    });
  }

  // Silence unused for lint if tree-shaken oddly
  void unmatchedQueryIndexes;

  const totalImported = input.importedLeaves.length;
  const exact = lines.filter((l) => l.status === 'exact_match').length;
  const qty = lines.filter((l) => l.status === 'quantity_changed').length;
  const rate = lines.filter((l) => l.status === 'unit_rate_changed').length;
  const neu = lines.filter((l) => l.status === 'new_item').length;
  const removed = lines.filter((l) => l.status === 'removed_item').length;
  const uncertain = lines.filter((l) => l.status === 'uncertain_match').length;
  const reused = lines.filter((l) => l.rate_reused).length;
  const percentage =
    totalImported > 0 ? Math.round((reused / totalImported) * 10000) / 100 : 0;

  return {
    generated_at: new Date().toISOString(),
    template_id: input.templateId,
    template_name: input.templateName,
    total_imported_items: totalImported,
    exact_matches: exact,
    quantity_changes: qty,
    unit_rate_changes: rate,
    new_items: neu,
    removed_items: removed,
    uncertain_matches: uncertain,
    match_reuse_threshold: threshold,
    percentage_boq_automatically_reused: percentage,
    lines,
  };
}
