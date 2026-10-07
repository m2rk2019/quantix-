import { parseNumericField } from '@/lib/boq/calculations';
import { parseActiveFlag, parseDelimitedText } from '@/lib/resource-library/csv';
import {
  isRateLibraryCategory,
  type RateLibraryCategory,
} from '@/types/rate-library';
import type {
  CreateCompanyResourceCategoryInput,
  CreateCompanyResourceInput,
  CreateCompanySupplierInput,
  CreateCompanyUnitInput,
} from '@/types/resource-library';

function isHeaderRow(cells: string[], hints: Set<string>): boolean {
  const normalized = cells.map((cell) => cell.trim().toLowerCase());
  return normalized.some((cell) => hints.has(cell));
}

function parseResourceType(value: string | undefined): RateLibraryCategory | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (isRateLibraryCategory(normalized)) {
    return normalized;
  }
  if (normalized.startsWith('mat')) return 'material';
  if (normalized.startsWith('lab')) return 'labor';
  if (normalized.startsWith('equip')) return 'equipment';
  if (normalized.startsWith('sub')) return 'subcontract';
  return null;
}

export function parseSupplierImport(
  text: string
): CreateCompanySupplierInput[] {
  const rows = parseDelimitedText(text);
  const hints = new Set(['code', 'name', 'contact', 'email', 'phone', 'active']);
  const result: CreateCompanySupplierInput[] = [];

  for (const cells of rows) {
    if (result.length === 0 && isHeaderRow(cells, hints)) {
      continue;
    }
    const code = cells[0]?.trim() ?? '';
    const name = cells[1]?.trim() ?? '';
    if (!code || !name) {
      continue;
    }
    result.push({
      code,
      name,
      contact_person: cells[2]?.trim() || null,
      email: cells[3]?.trim() || null,
      phone: cells[4]?.trim() || null,
      notes: cells[5]?.trim() || null,
      is_active: parseActiveFlag(cells[6]),
    });
  }

  return result;
}

export function parseUnitImport(text: string): CreateCompanyUnitInput[] {
  const rows = parseDelimitedText(text);
  const hints = new Set(['code', 'symbol', 'name', 'description', 'active']);
  const result: CreateCompanyUnitInput[] = [];

  for (const cells of rows) {
    if (result.length === 0 && isHeaderRow(cells, hints)) {
      continue;
    }
    const code = cells[0]?.trim() ?? '';
    const symbol = cells[1]?.trim() ?? '';
    const name = cells[2]?.trim() ?? '';
    if (!code || !symbol || !name) {
      continue;
    }
    result.push({
      code,
      symbol,
      name,
      description: cells[3]?.trim() || null,
      is_active: parseActiveFlag(cells[4]),
    });
  }

  return result;
}

export function parseCategoryImport(
  text: string,
  defaultType?: RateLibraryCategory
): CreateCompanyResourceCategoryInput[] {
  const rows = parseDelimitedText(text);
  const hints = new Set(['code', 'name', 'resource type', 'type', 'description', 'active']);
  const result: CreateCompanyResourceCategoryInput[] = [];

  for (const cells of rows) {
    if (result.length === 0 && isHeaderRow(cells, hints)) {
      continue;
    }
    const code = cells[0]?.trim() ?? '';
    const name = cells[1]?.trim() ?? '';
    const resourceType = parseResourceType(cells[2]) ?? defaultType;
    if (!code || !name || !resourceType) {
      continue;
    }
    result.push({
      code,
      name,
      resource_type: resourceType,
      description: cells[3]?.trim() || null,
      is_active: parseActiveFlag(cells[4]),
    });
  }

  return result;
}

export function parseCompanyResourceImport(
  text: string,
  category: RateLibraryCategory
): Array<CreateCompanyResourceInput & { supplier_code?: string }> {
  const rows = parseDelimitedText(text);
  const hints = new Set([
    'code',
    'description',
    'unit',
    'unit cost',
    'category',
    'supplier',
    'active',
  ]);
  const result: Array<CreateCompanyResourceInput & { supplier_code?: string }> = [];

  for (const cells of rows) {
    if (result.length === 0 && isHeaderRow(cells, hints)) {
      continue;
    }
    const code = cells[0]?.trim() ?? '';
    const description = cells[1]?.trim() ?? '';
    const unit = cells[2]?.trim() || 'item';
    const unitCost = parseNumericField((cells[3] ?? '').replace(/[^0-9.\-]/g, ''));
    const supplierCode = cells[4]?.trim();
    if (!code || !description) {
      continue;
    }
    result.push({
      code,
      description,
      unit,
      unit_cost: unitCost,
      category,
      is_active: parseActiveFlag(cells[5]),
      supplier_code: supplierCode || undefined,
    });
  }

  return result;
}
