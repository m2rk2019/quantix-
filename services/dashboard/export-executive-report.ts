import ExcelJS from 'exceljs';

import {
  getExecutiveDashboard,
  parseDashboardFilters,
} from '@/services/dashboard/get-executive-dashboard';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { toReportBranding } from '@/lib/company/branding';
import { excelCurrencyNumFmt } from '@/lib/format-currency';
import type { ExecutiveDashboardData, ExecutiveReportType } from '@/types/dashboard';
import { EXECUTIVE_REPORT_LABELS } from '@/types/dashboard';

const DEFAULT_BRAND_DARK = 'FF1F4E79';
let executiveBrandDark = DEFAULT_BRAND_DARK;

function currencyFmt(): string {
  return excelCurrencyNumFmt();
}

function addHeaderRow(
  sheet: ExcelJS.Worksheet,
  title: string,
  data: ExecutiveDashboardData
): void {
  sheet.mergeCells('A1', 'F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: executiveBrandDark } };

  sheet.mergeCells('A2', 'F2');
  sheet.getCell('A2').value = `Generated ${new Date(data.generated_at).toLocaleString()}`;
  sheet.getCell('A2').font = { italic: true, size: 10 };

  if (data.mixed_currency_warning) {
    sheet.mergeCells('A3', 'F3');
    sheet.getCell('A3').value =
      'Note: Portfolio contains mixed currencies; amounts are summed without conversion.';
    sheet.getCell('A3').font = { color: { argb: 'FFC65911' }, size: 10 };
  }
}

function addKpiSheet(
  workbook: ExcelJS.Workbook,
  data: ExecutiveDashboardData
): void {
  const sheet = workbook.addWorksheet('Executive Summary');
  addHeaderRow(sheet, 'Executive Summary', data);

  const rows: Array<[string, string | number]> = [
    ['Total Projects', data.kpis.total_projects],
    ['Active Projects', data.kpis.active_projects],
    ['Completed Projects', data.kpis.completed_projects],
    ['Draft Projects', data.kpis.draft_projects],
    ['Total Estimated Value', data.kpis.total_estimated_value],
    ['Average Markup %', data.kpis.average_markup_percent],
    ['Average Profit', data.kpis.average_profit],
    ['Average Cost per Project', data.kpis.average_cost_per_project],
    ['AI Confidence Score', data.ai_confidence_score],
  ];

  let rowIndex = 5;
  for (const [label, value] of rows) {
    sheet.getCell(`A${rowIndex}`).value = label;
    sheet.getCell(`A${rowIndex}`).font = { bold: true };
    const valueCell = sheet.getCell(`B${rowIndex}`);
    valueCell.value = value;
    if (typeof value === 'number' && label.includes('%')) {
      valueCell.numFmt = '0.00"%"';
    } else if (typeof value === 'number' && label.includes('Score')) {
      valueCell.numFmt = '0.0%';
      valueCell.value = value;
    } else if (typeof value === 'number' && label !== 'Total Projects') {
      valueCell.numFmt = currencyFmt();
    }
    rowIndex += 1;
  }

  sheet.columns = [{ width: 28 }, { width: 22 }];
}

function addProjectCostSheet(
  workbook: ExcelJS.Workbook,
  data: ExecutiveDashboardData
): void {
  const sheet = workbook.addWorksheet('Project Cost');
  addHeaderRow(sheet, 'Project Cost Summary', data);

  const headers = [
    'Code',
    'Project',
    'Client',
    'Status',
    'Grand Total',
    'Markup %',
    'BOQ Items',
  ];
  sheet.addRow(headers).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(6).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: executiveBrandDark },
  };

  for (const project of data.projects) {
    sheet.addRow([
      project.project_code,
      project.project_name,
      project.client_name,
      project.executive_status,
      project.grand_total,
      project.markup_percent,
      project.boq_item_count,
    ]);
  }

  sheet.getColumn(5).numFmt = currencyFmt();
  sheet.columns = [
    { width: 14 },
    { width: 28 },
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
  ];
}

function addResourceSheet(
  workbook: ExcelJS.Workbook,
  data: ExecutiveDashboardData
): void {
  const sheet = workbook.addWorksheet('Resources');
  addHeaderRow(sheet, 'Resource Summary', data);

  const breakdown = data.cost_breakdown;
  const rows = [
    ['Material', breakdown.material],
    ['Labor', breakdown.labor],
    ['Equipment', breakdown.equipment],
    ['Subcontract', breakdown.subcontract],
    ['OCM', breakdown.ocm],
    ['Contingency', breakdown.contingency],
    ['Profit', breakdown.profit],
    ['VAT', breakdown.vat],
    ['Grand Total', breakdown.grand_total],
  ];

  sheet.addRow(['Category', 'Amount']).font = { bold: true };
  for (const [label, amount] of rows) {
    const row = sheet.addRow([label, amount]);
    row.getCell(2).numFmt = currencyFmt();
  }

  sheet.columns = [{ width: 20 }, { width: 18 }];
}

function addDisciplineSheet(
  workbook: ExcelJS.Workbook,
  data: ExecutiveDashboardData
): void {
  const sheet = workbook.addWorksheet('Discipline');
  addHeaderRow(sheet, 'Discipline Summary', data);

  sheet.addRow(['Discipline', 'Amount', 'Percent']).font = { bold: true };
  for (const item of data.discipline_breakdown) {
    const row = sheet.addRow([item.name, item.amount, item.percent]);
    row.getCell(2).numFmt = currencyFmt();
    row.getCell(3).numFmt = '0.0"%"';
  }

  sheet.columns = [{ width: 32 }, { width: 18 }, { width: 12 }];
}

function addRiskSheet(
  workbook: ExcelJS.Workbook,
  data: ExecutiveDashboardData
): void {
  const sheet = workbook.addWorksheet('Risk');
  addHeaderRow(sheet, 'Risk Summary', data);

  sheet.addRow(['Severity', 'Category', 'Title', 'Message', 'Project']).font = {
    bold: true,
  };
  for (const insight of data.insights.filter(
    (item) =>
      item.category === 'high_risk' ||
      item.category === 'missing_scope' ||
      item.category === 'duplicate_boq'
  )) {
    sheet.addRow([
      insight.severity,
      insight.category,
      insight.title,
      insight.message,
      insight.project_code ?? '—',
    ]);
  }

  sheet.columns = [
    { width: 12 },
    { width: 16 },
    { width: 22 },
    { width: 48 },
    { width: 14 },
  ];
}

function addAiSheet(
  workbook: ExcelJS.Workbook,
  data: ExecutiveDashboardData
): void {
  const sheet = workbook.addWorksheet('AI Insights');
  addHeaderRow(sheet, 'AI Recommendation', data);

  sheet.getCell('A5').value = 'AI Confidence Score';
  sheet.getCell('B5').value = data.ai_confidence_score;
  sheet.getCell('B5').numFmt = '0.0%';

  sheet.addRow([]);
  sheet.addRow(['Category', 'Title', 'Message']).font = { bold: true };
  for (const insight of data.insights) {
    sheet.addRow([insight.category, insight.title, insight.message]);
  }

  sheet.columns = [{ width: 18 }, { width: 24 }, { width: 56 }];
}

export function buildExecutiveExportFilename(reportType: ExecutiveReportType): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `Quantix_Executive_${reportType}_${stamp}.xlsx`;
}

export async function exportExecutiveReportExcel(
  reportType: ExecutiveReportType,
  searchParams: Record<string, string | undefined>
): Promise<{ ok: true; buffer: Buffer; filename: string } | { ok: false; message: string; status: number }> {
  const filters = parseDashboardFilters(searchParams);
  filters.pageSize = 500;
  const [data, company] = await Promise.all([
    getExecutiveDashboard(filters),
    getCompanySettings(),
  ]);
  const branding = toReportBranding(company);
  executiveBrandDark = branding.themeColorExcel;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = branding.companyName;
  workbook.created = new Date();

  switch (reportType) {
    case 'executive_summary':
      addKpiSheet(workbook, data);
      addProjectCostSheet(workbook, data);
      break;
    case 'project_cost':
      addProjectCostSheet(workbook, data);
      break;
    case 'resource':
      addResourceSheet(workbook, data);
      break;
    case 'discipline':
      addDisciplineSheet(workbook, data);
      break;
    case 'risk':
      addRiskSheet(workbook, data);
      break;
    case 'ai_recommendation':
      addAiSheet(workbook, data);
      break;
    default:
      return {
        ok: false,
        message: `Unknown report type: ${reportType}`,
        status: 400,
      };
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    ok: true,
    buffer,
    filename: buildExecutiveExportFilename(reportType),
  };
}

export function getReportLabel(reportType: ExecutiveReportType): string {
  return EXECUTIVE_REPORT_LABELS[reportType];
}
