import { createClient } from '@/lib/supabase/server';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import type { Database } from '@/types/database';
import type { RateLibraryCategory } from '@/types/rate-library';
import type {
  CompanyResourceCategory,
  CreateCompanyResourceCategoryInput,
  PaginatedResult,
  ResourceCategoryListParams,
  UpdateCompanyResourceCategoryInput,
} from '@/types/resource-library';
import { assertResourceLibraryManageAccess } from './assert-resource-access';

const DEFAULT_PAGE_SIZE = 50;

export async function listCompanyResourceCategories(
  params: ResourceCategoryListParams = {}
): Promise<PaginatedResult<CompanyResourceCategory>> {
  const supabase = await createClient();
  await requireProvisionedUserProfile();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('company_resource_categories')
    .select(
      'id, code, name, resource_type, description, is_active, created_at, updated_at',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (params.resourceType && params.resourceType !== 'all') {
    query = query.eq('resource_type', params.resourceType);
  }

  if (params.activeOnly) {
    query = query.eq('is_active', true);
  }

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`code.ilike.${term},name.ilike.${term}`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: (data ?? []) as CompanyResourceCategory[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAllCompanyResourceCategories(
  resourceType?: RateLibraryCategory,
  activeOnly = false
): Promise<CompanyResourceCategory[]> {
  const supabase = await createClient();
  await requireProvisionedUserProfile();

  let query = supabase
    .from('company_resource_categories')
    .select(
      'id, code, name, resource_type, description, is_active, created_at, updated_at'
    )
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompanyResourceCategory[];
}

export async function createCompanyResourceCategory(
  input: CreateCompanyResourceCategoryInput
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const code = input.code.trim();
  const name = input.name.trim();

  if (!code || !name) {
    return { success: false, error: 'Code and name are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('company_resource_categories')
    .insert({
      code,
      name,
      resource_type: input.resource_type,
      description: input.description?.trim() || null,
      is_active: input.is_active ?? true,
      created_by: access.profileId,
      updated_by: access.profileId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create category.' };
  }

  return { success: true, itemId: data.id };
}

export async function updateCompanyResourceCategory(
  itemId: string,
  input: UpdateCompanyResourceCategoryInput
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const patch: Database['public']['Tables']['company_resource_categories']['Update'] = {
    updated_by: access.profileId,
  };

  if (input.code !== undefined) patch.code = input.code.trim();
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.resource_type !== undefined) patch.resource_type = input.resource_type;
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_resource_categories')
    .update(patch)
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCompanyResourceCategory(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_resource_categories')
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

export async function importCompanyResourceCategories(
  items: CreateCompanyResourceCategoryInput[]
): Promise<{ success: boolean; error?: string; imported: number }> {
  let imported = 0;

  for (const item of items) {
    const result = await createCompanyResourceCategory(item);
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
