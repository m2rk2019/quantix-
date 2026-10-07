import ExcelJS from 'exceljs';

import { toCsv } from '@/lib/resource-library/csv';

export async function buildWorkbookBuffer(
  sheetName: string,
  headers: string[],
  rows: Array<Array<string | number | boolean>>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row);
  }
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildCsvDownload(
  headers: string[],
  rows: Array<Array<string | number | boolean>>
): string {
  return toCsv(headers, rows);
}

export function downloadFilename(prefix: string, extension: 'csv' | 'xlsx'): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${prefix}_${y}${m}${d}.${extension}`;
}
