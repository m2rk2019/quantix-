import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { canManageCompanyResources } from '@/lib/auth/permissions';
import type { UserRole } from '@/types/auth';

export interface ResourceAccessResult {
  ok: true;
  profileId: string;
  role: UserRole;
}

export interface ResourceAccessDenied {
  ok: false;
  error: string;
}

export type ResourceAccessContext = ResourceAccessResult | ResourceAccessDenied;

export async function assertResourceLibraryManageAccess(): Promise<ResourceAccessContext> {
  const profile = await requireProvisionedUserProfile();

  if (!canManageCompanyResources(profile.role)) {
    return {
      ok: false,
      error: 'You do not have permission to manage company resources.',
    };
  }

  return { ok: true, profileId: profile.id, role: profile.role };
}
