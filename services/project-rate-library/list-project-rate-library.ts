import { createClient } from '@/lib/supabase/server';
import { assertProjectRateReadAccess } from '@/services/project-rate-library/assert-project-rate-access';
import { mapProjectRateRow } from '@/services/project-rate-library/map-project-rate-row';
import type {
  ProjectRateLibraryListParams,
  ProjectRateLibraryListResult,
} from '@/types/project-rate-library';

const DEFAULT_PAGE_SIZE = 50;

export async function listProjectRateLibrary(
  params: ProjectRateLibraryListParams
): Promise<ProjectRateLibraryListResult> {
  const access = await assertProjectRateReadAccess(params.projectId);
  if (!access.ok) {
    return { items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 };
  }

  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('project_rate_library_items')
    .select('*', { count: 'exact' })
    .eq('project_id', params.projectId)
    .is('deleted_at', null)
    .order('code', { ascending: true })
    .range(from, to);

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }

  if (params.activeOnly !== false) {
    query = query.eq('is_active', true);
  }

  const search = params.search?.trim();
  if (search) {
    query = query.or(
      `code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Project Rate Library] list failed', error);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  const total = count ?? 0;
  return {
    items: (data ?? []).map(mapProjectRateRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
