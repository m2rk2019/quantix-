import { createClient } from '@/lib/supabase/server';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import type { Database } from '@/types/database';
import type {
  CompanyUnit,
  CreateCompanyUnitInput,
  ListQueryParams,
  PaginatedResult,
  UpdateCompanyUnitInput,
} from '@/types/resource-library';
import { assertResourceLibraryManageAccess } from './assert-resource-access';

const DEFAULT_PAGE_SIZE = 50;

export async function listCompanyUnits(
  params: ListQueryParams = {}
): Promise<PaginatedResult<CompanyUnit>> {
  const supabase = await createClient();
  await requireProvisionedUserProfile();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('company_units')
    .select(
      'id, code, symbol, name, description, is_active, created_at, updated_at',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (params.activeOnly) {
    query = query.eq('is_active', true);
  }

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`code.ilike.${term},symbol.ilike.${term},name.ilike.${term}`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: (data ?? []) as CompanyUnit[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAllCompanyUnits(activeOnly = false): Promise<CompanyUnit[]> {
  const supabase = await createClient();
  await requireProvisionedUserProfile();

  let query = supabase
    .from('company_units')
    .select('id, code, symbol, name, description, is_active, created_at, updated_at')
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompanyUnit[];
}

export async function createCompanyUnit(
  input: CreateCompanyUnitInput
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const code = input.code.trim();
  const symbol = input.symbol.trim();
  const name = input.name.trim();

  if (!code || !symbol || !name) {
    return { success: false, error: 'Code, symbol, and name are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('company_units')
    .insert({
      code,
      symbol,
      name,
      description: input.description?.trim() || null,
      is_active: input.is_active ?? true,
      created_by: access.profileId,
      updated_by: access.profileId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create unit.' };
  }

  return { success: true, itemId: data.id };
}

export async function updateCompanyUnit(
  itemId: string,
  input: UpdateCompanyUnitInput
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const patch: Database['public']['Tables']['company_units']['Update'] = {
    updated_by: access.profileId,
  };

  if (input.code !== undefined) patch.code = input.code.trim();
  if (input.symbol !== undefined) patch.symbol = input.symbol.trim();
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_units')
    .update(patch)
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCompanyUnit(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_units')
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

export async function importCompanyUnits(
  items: CreateCompanyUnitInput[]
): Promise<{ success: boolean; error?: string; imported: number }> {
  let imported = 0;

  for (const item of items) {
    const result = await createCompanyUnit(item);
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
