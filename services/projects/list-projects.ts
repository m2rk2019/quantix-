import { createClient } from '@/lib/supabase/server';
import type {
  ProjectListParams,
  ProjectListResult,
  ProjectWithDetails,
} from '@/types/project';
import { isProjectStatus } from '@/types/project';

const DEFAULT_PAGE_SIZE = 25;

export async function listProjects(
  params: ProjectListParams = {}
): Promise<ProjectListResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? 'updated_at';
  const order = params.order ?? 'desc';
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('projects')
    .select(
      `
        id,
        project_code,
        project_name,
        client_name,
        location,
        status,
        created_at,
        updated_at,
        created_by,
        creator:users!projects_created_by_fkey(full_name)
      `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (params.search?.trim()) {
    const search = params.search.trim();
    query = query.or(
      `project_name.ilike.%${search}%,project_code.ilike.%${search}%,client_name.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  const ascending = order === 'asc';
  query = query.order(sort, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  const projects = (data ?? []).map((row) => {
    const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
    const status = isProjectStatus(row.status) ? row.status : 'draft';

    return {
      id: row.id,
      project_code: row.project_code,
      project_name: row.project_name,
      client_name: row.client_name,
      location: row.location,
      status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      created_by_name: creator?.full_name ?? 'Unknown',
    };
  });

  return {
    projects,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProjectById(
  projectId: string
): Promise<ProjectWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
        id,
        project_code,
        project_name,
        client_name,
        location,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at,
        submitted_at,
        approved_at,
        archived_at,
        creator:users!projects_created_by_fkey(full_name),
        project_details(description)
      `
    )
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const creator = Array.isArray(data.creator) ? data.creator[0] : data.creator;
  const details = Array.isArray(data.project_details)
    ? data.project_details[0]
    : data.project_details;
  const status = isProjectStatus(data.status) ? data.status : 'draft';

  return {
    id: data.id,
    project_code: data.project_code,
    project_name: data.project_name,
    client_name: data.client_name,
    location: data.location,
    status,
    created_by: data.created_by,
    updated_by: data.updated_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    submitted_at: data.submitted_at,
    approved_at: data.approved_at,
    archived_at: data.archived_at,
    description: details?.description ?? null,
    created_by_name: creator?.full_name ?? 'Unknown',
  };
}
