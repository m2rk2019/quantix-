import { parseNumericField } from '@/lib/boq/calculations';
import {
  isRateLibraryCategory,
  type CreateRateLibraryItemInput,
  type RateLibraryCategory,
} from '@/types/rate-library';

const HEADER_HINTS = new Set([
  'code',
  'description',
  'unit',
  'unit cost',
  'unitcost',
  'category',
  'active',
]);

function isHeaderRow(cells: string[]): boolean {
  const normalized = cells.map((cell) => cell.trim().toLowerCase());
  return normalized.some((cell) => HEADER_HINTS.has(cell));
}

function parseCategory(value: string | undefined): RateLibraryCategory | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (isRateLibraryCategory(normalized)) {
    return normalized;
  }
  if (normalized.startsWith('mat')) {
    return 'material';
  }
  if (normalized.startsWith('lab')) {
    return 'labor';
  }
  if (normalized.startsWith('equip')) {
    return 'equipment';
  }
  if (normalized.startsWith('sub')) {
    return 'subcontract';
  }
  return null;
}

function parseActive(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  const normalized = value.trim().toLowerCase();
  return !['inactive', 'no', 'false', '0', 'n'].includes(normalized);
}

export function parseRateLibraryExcel(text: string): CreateRateLibraryItemInput[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.length > 0);
  const rows: CreateRateLibraryItemInput[] = [];

  for (const line of lines) {
    const cells = line.split('\t');
    if (cells.length < 4) {
      continue;
    }
    if (rows.length === 0 && isHeaderRow(cells)) {
      continue;
    }

    const code = cells[0]?.trim() ?? '';
    const description = cells[1]?.trim() ?? '';
    const unit = cells[2]?.trim() || 'item';
    const unitCost = parseNumericField((cells[3] ?? '').replace(/[^0-9.\-]/g, ''));
    const category = parseCategory(cells[4]);
    const isActive = parseActive(cells[5]);

    if (!code || !description || !category) {
      continue;
    }

    rows.push({
      code,
      description,
      unit,
      unit_cost: unitCost,
      category,
      is_active: isActive,
    });
  }

  return rows;
}
