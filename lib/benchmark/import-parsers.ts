import { parseDelimitedText } from '@/lib/resource-library/csv';
import type {
  BenchmarkImportBoqRow,
  BenchmarkImportBundle,
  BenchmarkImportMetadata,
  BenchmarkImportSummary,
  BenchmarkImportWbsRow,
} from '@/types/benchmark';

function isHeaderRow(cells: string[], hints: Set<string>): boolean {
  const normalized = cells.map((cell) => cell.trim().toLowerCase());
  return normalized.some((cell) => hints.has(cell));
}

function parseNumber(value: string | undefined): number {
  if (!value?.trim()) {
    return 0;
  }
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMetadataCsv(text: string): BenchmarkImportMetadata {
  const rows = parseDelimitedText(text);
  const metadata: BenchmarkImportMetadata = {
    project_name: 'Imported Project',
    client_name: 'Unknown Client',
  };

  for (const cells of rows) {
    const key = cells[0]?.trim().toLowerCase() ?? '';
    const value = cells[1]?.trim() ?? '';
    if (!key || !value) {
      continue;
    }
    switch (key) {
      case 'project_name':
      case 'project name':
        metadata.project_name = value;
        break;
      case 'client_name':
      case 'client':
        metadata.client_name = value;
        break;
      case 'location':
        metadata.location = value;
        break;
      case 'description':
        metadata.description = value;
        break;
      case 'currency':
        metadata.currency = value;
        break;
      case 'project_type':
      case 'type':
        metadata.project_type = value;
        break;
      case 'is_benchmark':
      case 'benchmark':
        metadata.is_benchmark = value.toLowerCase() === 'true' || value === '1';
        break;
      default:
        break;
    }
  }

  return metadata;
}

export function parseWbsCsv(text: string): BenchmarkImportWbsRow[] {
  const rows = parseDelimitedText(text);
  const hints = new Set(['wbs_code', 'code', 'description', 'parent_code', 'parent']);
  const result: BenchmarkImportWbsRow[] = [];

  for (const cells of rows) {
    if (result.length === 0 && isHeaderRow(cells, hints)) {
      continue;
    }
    const wbs_code = cells[0]?.trim() ?? '';
    const description = cells[1]?.trim() ?? '';
    if (!wbs_code || !description) {
      continue;
    }
    result.push({
      wbs_code,
      description,
      parent_code: cells[2]?.trim() || undefined,
    });
  }

  return result;
}

export function parseBoqCsv(text: string): BenchmarkImportBoqRow[] {
  const rows = parseDelimitedText(text);
  const hints = new Set([
    'item_code',
    'code',
    'wbs_code',
    'description',
    'unit',
    'quantity',
    'material_rate',
    'labor_rate',
  ]);
  const result: BenchmarkImportBoqRow[] = [];

  for (const cells of rows) {
    if (result.length === 0 && isHeaderRow(cells, hints)) {
      continue;
    }
    const item_code = cells[0]?.trim() ?? '';
    const wbs_code = cells[1]?.trim() ?? '';
    const description = cells[2]?.trim() ?? '';
    if (!item_code || !description) {
      continue;
    }
    result.push({
      item_code,
      wbs_code,
      description,
      unit: cells[3]?.trim() || 'item',
      quantity: parseNumber(cells[4]),
      material_rate: parseNumber(cells[5]),
      labor_rate: parseNumber(cells[6]),
      equipment_rate: parseNumber(cells[7]),
      subcontract_rate: parseNumber(cells[8]),
      other_cost_rate: parseNumber(cells[9]),
      actual_quantity: parseNumber(cells[10]) || undefined,
      actual_unit_rate: parseNumber(cells[11]) || undefined,
      awarded_cost: parseNumber(cells[12]) || undefined,
    });
  }

  return result;
}

export function parseSummaryCsv(text: string): BenchmarkImportSummary {
  const rows = parseDelimitedText(text);
  const summary: BenchmarkImportSummary = {};

  for (const cells of rows) {
    const key = cells[0]?.trim().toLowerCase() ?? '';
    const value = parseNumber(cells[1]);
    switch (key) {
      case 'direct_cost':
        summary.direct_cost = value;
        break;
      case 'indirect_cost_percent':
      case 'ocm_percent':
        summary.indirect_cost_percent = value;
        break;
      case 'contingency_percent':
        summary.contingency_percent = value;
        break;
      case 'markup_percent':
      case 'profit_percent':
        summary.markup_percent = value;
        break;
      case 'vat_percent':
        summary.vat_percent = value;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function parseCombinedCsv(text: string): BenchmarkImportBundle {
  const sections = text.split(/^---\s*(\w+)\s*---\s*$/im);
  const bundle: BenchmarkImportBundle = {
    metadata: { project_name: 'Imported Project', client_name: 'Unknown Client' },
    wbs: [],
    boq: [],
  };

  if (sections.length <= 1) {
    bundle.boq = parseBoqCsv(text);
    return bundle;
  }

  for (let index = 1; index < sections.length; index += 2) {
    const section = sections[index]?.toLowerCase() ?? '';
    const content = sections[index + 1] ?? '';
    switch (section) {
      case 'metadata':
        bundle.metadata = parseMetadataCsv(content);
        break;
      case 'wbs':
        bundle.wbs = parseWbsCsv(content);
        break;
      case 'boq':
        bundle.boq = parseBoqCsv(content);
        break;
      case 'summary':
      case 'estimate_summary':
        bundle.summary = parseSummaryCsv(content);
        break;
      default:
        break;
    }
  }

  return bundle;
}

export async function parseExcelBuffer(buffer: Uint8Array | ArrayBuffer): Promise<BenchmarkImportBundle> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const bytes = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : Buffer.from(buffer);
  await workbook.xlsx.load(bytes as never);

  const bundle: BenchmarkImportBundle = {
    metadata: { project_name: 'Imported Project', client_name: 'Unknown Client' },
    wbs: [],
    boq: [],
  };

  for (const sheet of workbook.worksheets) {
    const name = sheet.name.toLowerCase();
    const rows: string[][] = [];
    sheet.eachRow((row) => {
      const cells = row.values as Array<string | number | undefined>;
      rows.push(
        cells.slice(1).map((cell) => (cell === undefined || cell === null ? '' : String(cell)))
      );
    });
    const text = rows.map((row) => row.join(',')).join('\n');

    if (name.includes('metadata') || name.includes('project')) {
      bundle.metadata = parseMetadataCsv(text);
    } else if (name.includes('wbs')) {
      bundle.wbs = parseWbsCsv(text);
    } else if (name.includes('boq')) {
      bundle.boq = parseBoqCsv(text);
    } else if (name.includes('summary')) {
      bundle.summary = parseSummaryCsv(text);
    }
  }

  return bundle;
}
