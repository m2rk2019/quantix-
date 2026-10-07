import { createClient } from '@/lib/supabase/server';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import type { Database } from '@/types/database';
import type {
  CreateRateLibraryItemInput,
  RateLibraryCategory,
  RateLibraryItem,
  RateLibraryListParams,
  RateLibraryListResult,
  UpdateRateLibraryItemInput,
} from '@/types/rate-library';
import { assertResourceLibraryManageAccess } from '@/services/resource-library/assert-resource-access';

const DEFAULT_PAGE_SIZE = 50;

interface RawLibraryRow {
  id: string;
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: RawLibraryRow, favoriteIds: Set<string>): RateLibraryItem {
  return {
    ...row,
    unit_cost: Number(row.unit_cost),
    is_favorite: favoriteIds.has(row.id),
  };
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

export async function listRateLibraryItems(
  params: RateLibraryListParams = {}
): Promise<RateLibraryListResult> {
  const supabase = await createClient();
  const profile = await requireProvisionedUserProfile();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const favoriteIds = await getFavoriteIds(supabase, profile.id);

  if (params.favoritesOnly) {
    const ids = Array.from(favoriteIds);
    if (ids.length === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 1 };
    }
  }

  let query = supabase
    .from('rate_library_items')
    .select(
      'id, code, description, unit, unit_cost, category, is_active, created_at, updated_at',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }

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
    items: (data ?? []).map((row) => mapRow(row as RawLibraryRow, favoriteIds)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createRateLibraryItem(
  input: CreateRateLibraryItemInput
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const profile = await requireProvisionedUserProfile();
  const supabase = await createClient();

  const code = input.code.trim();
  const description = input.description.trim();
  const unit = input.unit.trim() || 'item';

  if (!code || !description) {
    return { success: false, error: 'Code and description are required.' };
  }

  if (input.unit_cost < 0) {
    return { success: false, error: 'Unit cost must be ≥ 0.' };
  }

  const { data, error } = await supabase
    .from('rate_library_items')
    .insert({
      code,
      description,
      unit,
      unit_cost: input.unit_cost,
      category: input.category,
      is_active: input.is_active ?? true,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create item.' };
  }

  return { success: true, itemId: data.id };
}

export async function updateRateLibraryItem(
  itemId: string,
  input: UpdateRateLibraryItemInput
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const profile = await requireProvisionedUserProfile();
  const supabase = await createClient();

  const patch: Database['public']['Tables']['rate_library_items']['Update'] = {
    updated_by: profile.id,
  };

  if (input.code !== undefined) patch.code = input.code.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.unit !== undefined) patch.unit = input.unit.trim() || 'item';
  if (input.unit_cost !== undefined) {
    if (input.unit_cost < 0) {
      return { success: false, error: 'Unit cost must be ≥ 0.' };
    }
    patch.unit_cost = input.unit_cost;
  }
  if (input.category !== undefined) patch.category = input.category;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

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

export async function deleteRateLibraryItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const access = await assertResourceLibraryManageAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const profile = await requireProvisionedUserProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from('rate_library_items')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: profile.id,
      is_active: false,
    })
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function importRateLibraryItems(
  items: CreateRateLibraryItemInput[]
): Promise<{ success: boolean; error?: string; imported: number }> {
  let imported = 0;

  for (const item of items) {
    const result = await createRateLibraryItem(item);
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

export async function toggleRateLibraryFavorite(
  libraryItemId: string
): Promise<{ success: boolean; error?: string; isFavorite: boolean }> {
  const profile = await requireProvisionedUserProfile();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('user_rate_library_favorites')
    .select('library_item_id')
    .eq('user_id', profile.id)
    .eq('library_item_id', libraryItemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_rate_library_favorites')
      .delete()
      .eq('user_id', profile.id)
      .eq('library_item_id', libraryItemId);

    if (error) {
      return { success: false, error: error.message, isFavorite: true };
    }

    return { success: true, isFavorite: false };
  }

  const { error } = await supabase.from('user_rate_library_favorites').insert({
    user_id: profile.id,
    library_item_id: libraryItemId,
  });

  if (error) {
    return { success: false, error: error.message, isFavorite: false };
  }

  return { success: true, isFavorite: true };
}
