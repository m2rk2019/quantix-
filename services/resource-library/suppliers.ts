import { createClient } from '@/lib/supabase/server';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import type { Database } from '@/types/database';
import type {
  CompanySupplier,
  CreateCompanySupplierInput,
  ListQueryParams,
  PaginatedResult,
  UpdateCompanySupplierInput,
} from '@/types/resource-library';
import { assertResourceLibraryManageAccess } from './assert-resource-access';

const DEFAULT_PAGE_SIZE = 50;

function mapSupplier(row: CompanySupplier): CompanySupplier {
  return row;
}

export async function listCompanySuppliers(
  params: ListQueryParams = {}
): Promise<PaginatedResult<CompanySupplier>> {
  const supabase = await createClient();
  await requireProvisionedUserProfile();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('company_suppliers')
    .select(
      'id, code, name, contact_person, email, phone, notes, is_active, created_at, updated_at',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('code', { ascending: true });

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
    items: (data ?? []).map((row) => mapSupplier(row as CompanySupplier)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAllCompanySuppliers(
  activeOnly = false
): Promise<CompanySupplier[]> {
  const supabase = await createClient();
  await requireProvisionedUserProfile();

  let query = supabase
    .from('company_suppliers')
    .select(
      'id, code, name, contact_person, email, phone, notes, is_active, created_at, updated_at'
    )
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompanySupplier[];
}

export async function createCompanySupplier(
  input: CreateCompanySupplierInput
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
    .from('company_suppliers')
    .insert({
      code,
      name,
      contact_person: input.contact_person?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      is_active: input.is_active ?? true,
      created_by: access.profileId,
      updated_by: access.profileId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create supplier.' };
  }

  return { success: true, itemId: data.id };
}

export async function updateCompanySupplier(
  itemId: string,
  input: UpdateCompanySupplierInput
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const patch: Database['public']['Tables']['company_suppliers']['Update'] = {
    updated_by: access.profileId,
  };

  if (input.code !== undefined) patch.code = input.code.trim();
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.contact_person !== undefined) {
    patch.contact_person = input.contact_person?.trim() || null;
  }
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_suppliers')
    .update(patch)
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCompanySupplier(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_suppliers')
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

export async function importCompanySuppliers(
  items: CreateCompanySupplierInput[]
): Promise<{ success: boolean; error?: string; imported: number }> {
  let imported = 0;

  for (const item of items) {
    const result = await createCompanySupplier(item);
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
