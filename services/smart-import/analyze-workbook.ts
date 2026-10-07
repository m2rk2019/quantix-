import ExcelJS from 'exceljs';

import { buildWbsFromBoq } from '@/lib/smart-import/build-wbs-from-boq';
import {
  extractBidSummary,
  extractBoqRows,
  extractNarrative,
  extractProjectInfo,
  extractResourceRows,
} from '@/lib/smart-import/extractors';
import {
  classifyWorkbookSheets,
  matchImportProfile,
  sheetToMatrix,
  type SheetToMatrixInput,
} from '@/lib/smart-import/sheet-classifier';
import type { SmartImportAnalysis } from '@/types/smart-import';

export async function analyzeSmartImportWorkbook(
  buffer: Buffer
): Promise<SmartImportAnalysis> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  // ExcelJS Worksheet ↔ SheetToMatrixInput: typing bridge only (runtime unchanged).
  const matrices = workbook.worksheets.map((sheet) =>
    sheetToMatrix(sheet as unknown as SheetToMatrixInput)
  );
  const classified = classifyWorkbookSheets(matrices);
  const profile = matchImportProfile(classified);

  const projectInfo = extractProjectInfo(matrices, classified);
  const boqRows = extractBoqRows(matrices, classified);
  const resourceRows = extractResourceRows(matrices, classified);
  const assumptions = extractNarrative(matrices, classified, 'assumptions');
  const notes = extractNarrative(matrices, classified, 'notes');
  const bidSummary = extractBidSummary(matrices, classified);
  const { wbs } = buildWbsFromBoq(boqRows);

  const aiFindings: string[] = [];
  aiFindings.push(
    profile
      ? `Matched import profile "${profile.display_name}" (${Math.round(profile.confidence * 100)}% confidence).`
      : 'No named profile matched; using content-based recognition.'
  );
  aiFindings.push(
    `Detected ${classified.length} worksheet(s); primary BOQ sheets: ${
      classified
        .filter((sheet) => sheet.role === 'boq')
        .map((sheet) => sheet.sheet_name)
        .join(', ') || 'none'
    }.`
  );
  aiFindings.push(
    `Generated ${wbs.length} WBS node(s) and ${
      boqRows.filter((row) => !row.is_group_header).length
    } BOQ line item(s).`
  );
  if (!assumptions) {
    aiFindings.push('No assumptions sheet detected — defaults will be applied.');
  }

  return {
    profile_key: profile?.profile_key ?? null,
    profile_display_name: profile?.display_name ?? null,
    sheets: classified,
    project_info: projectInfo,
    boq_rows: boqRows,
    resource_rows: resourceRows,
    assumptions:
      assumptions ||
      'Rates based on budgetary cost breakdown at date of estimate. Market conditions may vary.',
    exclusions:
      notes && /exclusion/i.test(notes)
        ? notes
        : 'Works not listed in the BOQ are excluded unless agreed in writing.',
    notes,
    bid_summary: bidSummary,
    ai_findings: aiFindings,
  };
}
