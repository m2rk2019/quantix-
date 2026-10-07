import { parseNumericField } from '@/lib/boq/calculations';
import type { BoqClipboardRow } from '@/types/boq';

const HEADER_HINTS = new Set([
  'item',
  'item no',
  'item no.',
  'item number',
  'description',
  'unit',
  'quantity',
  'qty',
  'material',
  'labor',
  'equipment',
  'subcontract',
]);

function isHeaderRow(cells: string[]): boolean {
  const normalized = cells.map((cell) => cell.trim().toLowerCase());
  return normalized.some((cell) => HEADER_HINTS.has(cell));
}

function parseRate(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  return parseNumericField(cleaned);
}

function mapCellsToRow(cells: string[]): BoqClipboardRow | null {
  const trimmed = cells.map((cell) => cell.trim());
  if (trimmed.every((cell) => cell === '')) {
    return null;
  }

  let offset = 0;
  if (trimmed.length >= 10) {
    offset = 1;
  }

  const description = trimmed[offset] ?? trimmed[0] ?? '';
  const unit = trimmed[offset + 1] ?? 'item';
  const quantity = parseRate(trimmed[offset + 2]);
  const material_rate = parseRate(trimmed[offset + 3]);
  const labor_rate = parseRate(trimmed[offset + 4]);
  const equipment_rate = parseRate(trimmed[offset + 5]);
  const subcontract_rate = parseRate(trimmed[offset + 6]);
  const other_cost_rate = parseRate(trimmed[offset + 7]);

  if (!description) {
    return null;
  }

  return {
    item_code: offset === 1 ? trimmed[0] ?? '' : '',
    description,
    unit,
    quantity,
    material_rate,
    labor_rate,
    equipment_rate,
    subcontract_rate,
    other_cost_rate,
  };
}

export function parseExcelClipboard(text: string): BoqClipboardRow[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.length > 0);
  const rows: BoqClipboardRow[] = [];

  for (const line of lines) {
    const cells = line.split('\t');
    if (cells.length < 2) {
      continue;
    }
    if (rows.length === 0 && isHeaderRow(cells)) {
      continue;
    }
    const row = mapCellsToRow(cells);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}
