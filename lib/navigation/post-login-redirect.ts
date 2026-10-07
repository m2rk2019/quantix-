import { ROUTES } from '@/lib/constants/routes';
import {
  clearRecentProjectId,
  getRecentProjectId,
  setRecentProjectId,
} from '@/lib/navigation/recent-project';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROJECT_PATH_PATTERN = /^\/projects\/([^/]+)(?:\/.*)?$/;

export function extractProjectIdFromPath(pathname: string): string | null {
  const match = PROJECT_PATH_PATTERN.exec(pathname);
  if (!match) {
    return null;
  }

  const segment = match[1];
  if (!segment || segment === 'new') {
    return null;
  }

  return UUID_PATTERN.test(segment) ? segment : null;
}

export function isSafeInternalPath(path: string): boolean {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }

  if (path.includes('://')) {
    return false;
  }

  const pathname = path.split('?')[0]?.split('#')[0] ?? path;
  return pathname.length > 0;
}

export function normalizePostLoginPath(next: string | null | undefined): string {
  if (!next || next === '/' || next === ROUTES.login) {
    return ROUTES.dashboard;
  }

  if (!isSafeInternalPath(next)) {
    return ROUTES.dashboard;
  }

  const pathname = next.split('?')[0]?.split('#')[0] ?? next;

  if (pathname === ROUTES.unauthorized) {
    return ROUTES.dashboard;
  }

  return next;
}

async function isProjectAccessible(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function resolvePostLoginRedirect(
  supabase: SupabaseClient<Database>,
  next: string | null | undefined
): Promise<string> {
  const storedProjectId = getRecentProjectId();
  if (storedProjectId) {
    const storedAccessible = await isProjectAccessible(supabase, storedProjectId);
    if (!storedAccessible) {
      clearRecentProjectId();
    }
  }

  const normalized = normalizePostLoginPath(next);
  const pathname = normalized.split('?')[0]?.split('#')[0] ?? normalized;
  const projectId = extractProjectIdFromPath(pathname);

  if (!projectId) {
    return normalized;
  }

  const accessible = await isProjectAccessible(supabase, projectId);

  if (!accessible) {
    clearRecentProjectId();
    return ROUTES.dashboard;
  }

  setRecentProjectId(projectId);
  return normalized;
}
