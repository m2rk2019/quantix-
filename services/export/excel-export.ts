import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ExcelJS from 'exceljs';

import { MEGAWIDE_LOGO_ASPECT } from '@/lib/branding';
import {
  defaultCompanySettings,
  lightenHexForExcel,
  toReportBranding,
} from '@/lib/company/branding';
import type { BoqItem } from '@/types/boq';
import type {
  BoqResourceTotals,
  DisciplineBreakdownItem,
  EstimateBreakdown,
  WbsRollupNode,
} from '@/types/estimate';
import type { ReportBranding } from '@/types/company-settings';
import { excelCurrencyNumFmt } from '@/lib/format-currency';
import type { CurrencyCode } from '@/types/project';
import type { ExcelExportData } from '@/types/export';

const BORDER_COLOR = 'FFB4B4B4';
const DRAFT_COLOR = 'FFC65911';

interface ExcelStyles {
  brandDark: string;
  brandLight: string;
  headerFill: ExcelJS.Fill;
  subtotalFill: ExcelJS.Fill;
  headerFooter: {
    oddHeader: string;
    oddFooter: string;
    evenHeader: string;
    evenFooter: string;
  };
  companyName: string;
}

function createExcelStyles(branding: ReportBranding): ExcelStyles {
  const brandDark = branding.themeColorExcel;
  const brandLight = lightenHexForExcel(branding.themeColor);
  const footerText = branding.reportFooter ?? 'Confidential';

  return {
    brandDark,
    brandLight,
    headerFill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: brandDark },
    },
    subtotalFill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: brandLight },
    },
    headerFooter: {
      oddHeader: `&L&"Arial,Bold"${branding.companyName} Estimate&C&"Arial"Professional Export&R&D`,
      oddFooter: `&L${footerText}&RPage &P of &N`,
      evenHeader: `&L&"Arial,Bold"${branding.companyName} Estimate&C&"Arial"Professional Export&R&D`,
      evenFooter: `&L${footerText}&RPage &P of &N`,
    },
    companyName: branding.companyName,
  };
}

let excelStyles: ExcelStyles = createExcelStyles(
  toReportBranding(defaultCompanySettings())
);

const PAGE_SETUP: Partial<ExcelJS.PageSetup> = {
  paperSize: 9,
  orientation: 'landscape',
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
  margins: {
    left: 0.5,
    right: 0.5,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3,
  },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

const MEGAWIDE_LOGO_FILE = resolve(
  process.cwd(),
  'public/assets/logo/megawide-logo.png'
);

function embedMegawideLogo(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  anchor: { col: number; row: number }
): void {
  const base64 = readFileSync(MEGAWIDE_LOGO_FILE).toString('base64');
  const imageId = workbook.addImage({ base64, extension: 'png' });
  const width = 150;
  const height = Math.round(width / MEGAWIDE_LOGO_ASPECT);
  sheet.addImage(imageId, {
    tl: { col: anchor.col, row: anchor.row },
    ext: { width, height },
  });
}

export function buildExportFilename(projectCode: string): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const safeCode = projectCode.replace(/[^\w-]+/g, '_');
  return `${safeCode}_Estimate_${y}${m}${d}.xlsx`;
}

function currencyNumFmt(currency: CurrencyCode): string {
  return excelCurrencyNumFmt(currency);
}

function applySheetDefaults(worksheet: ExcelJS.Worksheet): void {
  worksheet.pageSetup = { ...PAGE_SETUP };
  worksheet.headerFooter = { ...excelStyles.headerFooter };
}

function styleHeaderRow(row: ExcelJS.Row, columnCount: number): void {
  row.height = 22;

  for (let col = 1; col <= columnCount; col += 1) {
    const cell = row.getCell(col);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = excelStyles.headerFill;
    cell.border = THIN_BORDER;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  }
}

function applyBorders(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): void {
  for (let rowNum = startRow; rowNum <= endRow; rowNum += 1) {
    const row = worksheet.getRow(rowNum);

    for (let col = startCol; col <= endCol; col += 1) {
      row.getCell(col).border = THIN_BORDER;
    }
  }
}

function autoFitColumns(
  worksheet: ExcelJS.Worksheet,
  minWidth = 10,
  maxWidth = 48
): void {
  worksheet.columns.forEach((column) => {
    if (!column) {
      return;
    }

    let maxLength = minWidth;

    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const text =
        cell.value === null || cell.value === undefined
          ? ''
          : typeof cell.value === 'object' && 'richText' in cell.value
            ? cell.value.richText.map((part) => part.text).join('')
            : String(cell.value);

      maxLength = Math.max(maxLength, text.length + 2);
    });

    column.width = Math.min(maxLength, maxWidth);
  });
}

function setPrintArea(
  worksheet: ExcelJS.Worksheet,
  lastRow: number,
  lastCol: number
): void {
  const colLetter = worksheet.getColumn(lastCol).letter;
  worksheet.pageSetup.printArea = `A1:${colLetter}${lastRow}`;
}

function flattenWbsNodes(
  nodes: WbsRollupNode[],
  depth = 0
): Array<{ node: WbsRollupNode; depth: number }> {
  const rows: Array<{ node: WbsRollupNode; depth: number }> = [];

  for (const node of nodes) {
    rows.push({ node, depth });
    rows.push(...flattenWbsNodes(node.children, depth + 1));
  }

  return rows;
}

function buildProjectInfoSheet(
  workbook: ExcelJS.Workbook,
  data: ExcelExportData
): void {
  const sheet = workbook.addWorksheet('Project Information');
  applySheetDefaults(sheet);

  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Project Information';
  titleCell.font = { bold: true, size: 16, color: { argb: excelStyles.brandDark } };
  titleCell.alignment = { vertical: 'middle' };

  sheet.mergeCells('D1:E4');
  sheet.getRow(4).height = 38;
  embedMegawideLogo(workbook, sheet, { col: 3, row: 0 });

  if (data.project.status === 'draft') {
    sheet.mergeCells('A2:B2');
    const draftCell = sheet.getCell('A2');
    draftCell.value = 'DRAFT — Not for tender submission';
    draftCell.font = { bold: true, color: { argb: DRAFT_COLOR }, size: 11 };
  }

  const fields: Array<[string, string]> = [
    ['Project Name', data.project.project_name],
    ['Client', data.project.client_name],
    ['Location', data.project.location ?? '—'],
    ['Estimator', data.project.estimator_name],
    ['Date', data.project.export_date],
    ['Currency', data.project.currency],
  ];

  const startRow = data.project.status === 'draft' ? 4 : 3;

  fields.forEach(([label, value], index) => {
    const rowNum = startRow + index;
    sheet.getCell(`A${rowNum}`).value = label;
    sheet.getCell(`A${rowNum}`).font = { bold: true };
    sheet.getCell(`A${rowNum}`).fill = excelStyles.subtotalFill;
    sheet.getCell(`B${rowNum}`).value = value;
  });

  const endRow = startRow + fields.length - 1;
  applyBorders(sheet, startRow, endRow, 1, 2);
  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 42;
  sheet.getColumn(4).width = 16;
  setPrintArea(sheet, Math.max(endRow, 4), 5);
}

function buildEstimateSummarySheet(
  workbook: ExcelJS.Workbook,
  breakdown: EstimateBreakdown,
  resourceTotals: BoqResourceTotals,
  currency: CurrencyCode
): void {
  const sheet = workbook.addWorksheet('Estimate Summary');
  applySheetDefaults(sheet);

  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = 'Estimate Summary';
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: excelStyles.brandDark } };

  const headerRow = sheet.getRow(3);
  headerRow.values = ['Component', 'Amount'];
  styleHeaderRow(headerRow, 2);

  const rows: Array<[string, number, boolean]> = [
    ['Material Cost', resourceTotals.material, false],
    ['Labor Cost', resourceTotals.labor, false],
    ['Equipment Cost', resourceTotals.equipment, false],
    ['Subcontract Cost', resourceTotals.subcontract, false],
    ['Direct Cost', breakdown.direct_cost, false],
    ['OCM', breakdown.indirect_cost, false],
    ['Contingency', breakdown.contingency, false],
    ['Profit', breakdown.markup, false],
    ['VAT', breakdown.vat, false],
    ['Total Bid Price', breakdown.grand_total, true],
  ];

  const numFmt = currencyNumFmt(currency);

  rows.forEach(([label, amount, highlight], index) => {
    const rowNum = 4 + index;
    const row = sheet.getRow(rowNum);
    row.getCell(1).value = label;
    const amountCell = row.getCell(2);
    amountCell.value = amount;
    amountCell.numFmt = numFmt;
    amountCell.alignment = { horizontal: 'right' };

    if (highlight) {
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.fill = excelStyles.subtotalFill;
      });
    }
  });

  applyBorders(sheet, 3, 13, 1, 2);
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  autoFitColumns(sheet);
  setPrintArea(sheet, 13, 2);
}

function buildCategoryBreakdownSheet(
  workbook: ExcelJS.Workbook,
  items: DisciplineBreakdownItem[],
  currency: CurrencyCode
): void {
  const sheet = workbook.addWorksheet('Category Breakdown');
  applySheetDefaults(sheet);

  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'Category Breakdown';
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: excelStyles.brandDark } };

  const headerRow = sheet.getRow(3);
  headerRow.values = ['Code', 'Category', 'Amount', '%'];
  styleHeaderRow(headerRow, 4);

  const numFmt = currencyNumFmt(currency);
  let rowNum = 4;

  for (const item of items) {
    const row = sheet.getRow(rowNum);
    row.getCell(1).value = item.code;
    row.getCell(2).value = item.name;
    row.getCell(3).value = item.amount;
    row.getCell(3).numFmt = numFmt;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).value = item.percent / 100;
    row.getCell(4).numFmt = '0.0%';
    row.getCell(4).alignment = { horizontal: 'right' };
    rowNum += 1;
  }

  const lastRow = Math.max(rowNum - 1, 3);
  applyBorders(sheet, 3, lastRow, 1, 4);
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  autoFitColumns(sheet);
  setPrintArea(sheet, lastRow, 4);
}

function buildWbsSheet(
  workbook: ExcelJS.Workbook,
  nodes: WbsRollupNode[],
  currency: CurrencyCode
): void {
  const sheet = workbook.addWorksheet('WBS');
  applySheetDefaults(sheet);
  sheet.properties.outlineProperties = {
    summaryBelow: false,
    summaryRight: false,
  };

  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'Work Breakdown Structure';
  sheet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: excelStyles.brandDark },
  };

  const headerRow = sheet.getRow(3);
  headerRow.values = [
    'WBS Code',
    'Description',
    'Direct Total',
    'Combined Total',
  ];
  styleHeaderRow(headerRow, 4);

  const flatNodes = flattenWbsNodes(nodes);
  const numFmt = currencyNumFmt(currency);
  let rowNum = 4;

  for (const { node, depth } of flatNodes) {
    const row = sheet.getRow(rowNum);
    row.outlineLevel = Math.min(depth + 1, 7);

    row.getCell(1).value = node.wbs_code;
    row.getCell(1).alignment = { indent: depth };
    row.getCell(2).value = node.description;
    row.getCell(2).alignment = { indent: depth, wrapText: true };

    row.getCell(3).value = node.direct_total;
    row.getCell(3).numFmt = numFmt;
    row.getCell(3).alignment = { horizontal: 'right' };

    row.getCell(4).value = node.combined_total;
    row.getCell(4).numFmt = numFmt;
    row.getCell(4).alignment = { horizontal: 'right' };

    if (node.children.length > 0) {
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.fill = excelStyles.subtotalFill;
      });
    }

    rowNum += 1;
  }

  const lastRow = Math.max(rowNum - 1, 3);
  applyBorders(sheet, 3, lastRow, 1, 4);
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  autoFitColumns(sheet);
  setPrintArea(sheet, lastRow, 4);
}

async function buildBoqSheet(
  workbook: ExcelJS.Workbook,
  currency: CurrencyCode,
  boqStream: AsyncIterable<BoqItem>
): Promise<void> {
  const sheet = workbook.addWorksheet('Bill of Quantities');
  applySheetDefaults(sheet);

  sheet.mergeCells('A1:L1');
  sheet.getCell('A1').value = 'Bill of Quantities';
  sheet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: excelStyles.brandDark },
  };

  const headers = [
    'Item No.',
    'WBS',
    'Description',
    'Unit',
    'Quantity',
    'Material',
    'Labor',
    'Equipment',
    'Subcontract',
    'Other Cost',
    'Total Rate',
    'Total Amount',
  ];

  const headerRow = sheet.getRow(3);
  headerRow.values = headers;
  styleHeaderRow(headerRow, headers.length);

  const numFmt = currencyNumFmt(currency);
  const qtyFmt = '#,##0.###';
  let rowNum = 4;

  for await (const item of boqStream) {
    const row = sheet.getRow(rowNum);
    row.values = [
      item.item_code,
      item.wbs_code,
      item.description,
      item.unit,
      item.quantity,
      item.material_rate,
      item.labor_rate,
      item.equipment_rate,
      item.subcontract_rate,
      item.other_cost_rate,
      item.total_rate,
      item.total_amount,
    ];

    row.getCell(5).numFmt = qtyFmt;

    for (let col = 6; col <= 12; col += 1) {
      row.getCell(col).numFmt = numFmt;
      row.getCell(col).alignment = { horizontal: 'right' };
    }

    rowNum += 1;
  }

  const lastRow = Math.max(rowNum - 1, 3);
  applyBorders(sheet, 3, lastRow, 1, 12);
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  autoFitColumns(sheet, 10, 52);
  setPrintArea(sheet, lastRow, 12);
}

export async function buildExcelWorkbook(
  data: ExcelExportData,
  boqStream: AsyncIterable<BoqItem>
): Promise<Buffer> {
  excelStyles = createExcelStyles(data.branding);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.branding.companyName;
  workbook.created = new Date();
  workbook.modified = new Date();

  buildProjectInfoSheet(workbook, data);
  buildEstimateSummarySheet(
    workbook,
    data.breakdown,
    data.resourceTotals,
    data.project.currency
  );
  buildCategoryBreakdownSheet(
    workbook,
    data.disciplineBreakdown,
    data.project.currency
  );
  buildWbsSheet(workbook, data.wbsRollup, data.project.currency);
  await buildBoqSheet(workbook, data.project.currency, boqStream);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
