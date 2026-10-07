import { createClient } from '@/lib/supabase/server';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import type { Database } from '@/types/database';
import type { RateLibraryCategory } from '@/types/rate-library';
import type {
  CompanyResourceItem,
  CompanyResourceListParams,
  CreateCompanyResourceInput,
  PaginatedResult,
  UpdateCompanyResourceInput,
} from '@/types/resource-library';
import { assertResourceLibraryManageAccess } from './assert-resource-access';

const DEFAULT_PAGE_SIZE = 50;

interface RawResourceRow {
  id: string;
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active: boolean;
  supplier_id: string | null;
  unit_id: string | null;
  resource_category_id: string | null;
  created_at: string;
  updated_at: string;
  supplier: { name: string } | null;
  unit_ref: { symbol: string } | null;
  resource_category: { name: string } | null;
}

async function getFavoriteIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_rate_library_favorites')
    .select('library_item_id')
    .eq('user_id', userId);

  return new Set((data ?? []).map((row) => row.library_item_id));
}

function mapResourceRow(
  row: RawResourceRow,
  favoriteIds: Set<string>
): CompanyResourceItem {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    unit: row.unit,
    unit_cost: Number(row.unit_cost),
    category: row.category,
    is_active: row.is_active,
    supplier_id: row.supplier_id,
    unit_id: row.unit_id,
    resource_category_id: row.resource_category_id,
    supplier_name: row.supplier?.name ?? null,
    unit_symbol: row.unit_ref?.symbol ?? null,
    resource_category_name: row.resource_category?.name ?? null,
    is_favorite: favoriteIds.has(row.id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const RESOURCE_SELECT = `
  id, code, description, unit, unit_cost, category, is_active,
  supplier_id, unit_id, resource_category_id, created_at, updated_at,
  supplier:company_suppliers(name),
  unit_ref:company_units(symbol),
  resource_category:company_resource_categories(name)
`;

export async function listCompanyResources(
  params: CompanyResourceListParams
): Promise<PaginatedResult<CompanyResourceItem>> {
  const supabase = await createClient();
  const profile = await requireProvisionedUserProfile();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const favoriteIds = await getFavoriteIds(supabase, profile.id);

  if (params.favoritesOnly && favoriteIds.size === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  let query = supabase
    .from('rate_library_items')
    .select(RESOURCE_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .eq('category', params.category)
    .order('code', { ascending: true });

  if (params.activeOnly !== false) {
    query = query.eq('is_active', true);
  }

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`code.ilike.${term},description.ilike.${term}`);
  }

  if (params.favoritesOnly) {
    query = query.in('id', Array.from(favoriteIds));
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: (data ?? []).map((row) =>
      mapResourceRow(row as unknown as RawResourceRow, favoriteIds)
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAllCompanyResources(
  category: RateLibraryCategory,
  activeOnly = false
): Promise<CompanyResourceItem[]> {
  const supabase = await createClient();
  const profile = await requireProvisionedUserProfile();
  const favoriteIds = await getFavoriteIds(supabase, profile.id);

  let query = supabase
    .from('rate_library_items')
    .select(RESOURCE_SELECT)
    .is('deleted_at', null)
    .eq('category', category)
    .order('code', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapResourceRow(row as unknown as RawResourceRow, favoriteIds)
  );
}

async function resolveUnitSymbol(
  supabase: Awaited<ReturnType<typeof createClient>>,
  unitId: string | null | undefined,
  fallbackUnit: string
): Promise<string> {
  if (!unitId) {
    return fallbackUnit.trim() || 'item';
  }

  const { data } = await supabase
    .from('company_units')
    .select('symbol')
    .eq('id', unitId)
    .is('deleted_at', null)
    .maybeSingle();

  return data?.symbol ?? (fallbackUnit.trim() || 'item');
}

export async function createCompanyResource(
  input: CreateCompanyResourceInput
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const code = input.code.trim();
  const description = input.description.trim();

  if (!code || !description) {
    return { success: false, error: 'Code and description are required.' };
  }

  if (input.unit_cost < 0) {
    return { success: false, error: 'Unit cost must be ≥ 0.' };
  }

  const supabase = await createClient();
  const unit = await resolveUnitSymbol(supabase, input.unit_id, input.unit);

  const { data, error } = await supabase
    .from('rate_library_items')
    .insert({
      code,
      description,
      unit,
      unit_cost: input.unit_cost,
      category: input.category,
      is_active: input.is_active ?? true,
      supplier_id: input.supplier_id ?? null,
      unit_id: input.unit_id ?? null,
      resource_category_id: input.resource_category_id ?? null,
      created_by: access.profileId,
      updated_by: access.profileId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create resource.' };
  }

  return { success: true, itemId: data.id };
}

export async function updateCompanyResource(
  itemId: string,
  input: UpdateCompanyResourceInput
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const patch: Database['public']['Tables']['rate_library_items']['Update'] = {
    updated_by: access.profileId,
  };

  if (input.code !== undefined) patch.code = input.code.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.unit_cost !== undefined) {
    if (input.unit_cost < 0) {
      return { success: false, error: 'Unit cost must be ≥ 0.' };
    }
    patch.unit_cost = input.unit_cost;
  }
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.supplier_id !== undefined) patch.supplier_id = input.supplier_id;
  if (input.resource_category_id !== undefined) {
    patch.resource_category_id = input.resource_category_id;
  }

  if (input.unit_id !== undefined) {
    patch.unit_id = input.unit_id;
    patch.unit = await resolveUnitSymbol(
      supabase,
      input.unit_id,
      input.unit ?? 'item'
    );
  } else if (input.unit !== undefined) {
    patch.unit = input.unit.trim() || 'item';
  }

  const { error } = await supabase
    .from('rate_library_items')
    .update(patch)
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCompanyResource(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('rate_library_items')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: access.profileId,
      is_active: false,
    })
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function importCompanyResources(
  items: Array<CreateCompanyResourceInput & { supplier_code?: string }>
): Promise<{ success: boolean; error?: string; imported: number }> {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from('company_suppliers')
    .select('id, code')
    .is('deleted_at', null);

  const supplierByCode = new Map(
    (suppliers ?? []).map((row) => [row.code.toLowerCase(), row.id])
  );

  let imported = 0;

  for (const item of items) {
    const supplierId =
      item.supplier_id ??
      (item.supplier_code
        ? supplierByCode.get(item.supplier_code.toLowerCase()) ?? null
        : null);

    const result = await createCompanyResource({
      ...item,
      supplier_id: supplierId,
    });
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? `Failed to import ${item.code}.`,
        imported,
      };
    }
    imported += 1;
  }

  return { success: true, imported };
}
