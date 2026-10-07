import {
  fetchResolvedProfile,
  toUserProfile,
} from '@/lib/auth/resolve-profile';
import { createClient } from '@/lib/supabase/server';
import { ensureUserProfileAfterSignIn } from '@/services/auth/ensure-user-profile';
import { isUserRole, type UserProfile } from '@/types/auth';

export async function getAuthUser(): Promise<{
  authUser: { id: string; email?: string } | null;
  profile: UserProfile | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authUser: null, profile: null };
  }

  const profileRow = await fetchResolvedProfile(supabase, user);

  if (!profileRow || profileRow.deleted_at) {
    return { authUser: { id: user.id, email: user.email }, profile: null };
  }

  return {
    authUser: { id: user.id, email: user.email },
    profile: toUserProfile(profileRow),
  };
}

export async function requireUserProfile(): Promise<UserProfile> {
  const { profile } = await getAuthUser();

  if (!profile) {
    throw new Error('Unauthorized');
  }

  return profile;
}

/** Profile row in public.users (required for FK columns like projects.created_by). */
export async function requireProvisionedUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const ensured = await ensureUserProfileAfterSignIn(user.id);
  if (!ensured.ok) {
    throw new Error(ensured.error ?? 'User profile is not provisioned.');
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profileRow || profileRow.deleted_at || !isUserRole(profileRow.role)) {
    throw new Error('User profile is not provisioned.');
  }

  return toUserProfile({
    ...profileRow,
    role: profileRow.role,
    source: 'database',
  });
}
