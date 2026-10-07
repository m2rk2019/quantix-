import type { User } from '@supabase/supabase-js';

import { isUserRole, type UserProfile, type UserRole } from '@/types/auth';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ResolvedProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  deleted_at: string | null;
  source: 'database' | 'auth_metadata';
}

function readRoleFromAuthUser(user: User): UserRole | null {
  const candidates = [
    user.app_metadata?.role,
    user.user_metadata?.role,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isUserRole(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isProfileInactiveInAuthMetadata(user: User): boolean {
  return user.app_metadata?.profile_active === false;
}

export function resolveProfileFromAuthUser(user: User): ResolvedProfile | null {
  if (isProfileInactiveInAuthMetadata(user)) {
    return null;
  }

  const role = readRoleFromAuthUser(user);
  if (!role) {
    return null;
  }

  const fullName =
    (typeof user.user_metadata?.full_name === 'string' &&
      user.user_metadata.full_name.trim()) ||
    user.email?.split('@')[0] ||
    'User';

  const email = user.email ?? '';

  if (!email) {
    return null;
  }

  return {
    id: user.id,
    email,
    full_name: fullName,
    role,
    deleted_at: null,
    source: 'auth_metadata',
  };
}

export function toUserProfile(profile: ResolvedProfile): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
  };
}

export async function fetchResolvedProfile(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<ResolvedProfile | null> {
  const { data: profileRow, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!profileError && profileRow) {
    if (profileRow.deleted_at || !isUserRole(profileRow.role)) {
      return null;
    }

    return {
      ...profileRow,
      role: profileRow.role,
      source: 'database',
    };
  }

  return resolveProfileFromAuthUser(user);
}
