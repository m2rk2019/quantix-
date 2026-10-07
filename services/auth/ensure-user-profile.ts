'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { isUserRole, type UserRole } from '@/types/auth';

export interface EnsureUserProfileResult {
  ok: boolean;
  created: boolean;
  error?: string;
}

function resolveFullName(
  email: string,
  metadata: Record<string, unknown> | undefined
): string {
  const fromMetadata = metadata?.full_name;

  if (typeof fromMetadata === 'string' && fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  const localPart = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return localPart ? localPart : email;
}

function readRoleFromAuthUser(
  authUser: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
): UserRole | null {
  const candidates = [authUser.app_metadata?.role, authUser.user_metadata?.role];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isUserRole(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function syncAuthMetadataForUser(
  admin: ReturnType<typeof createAdminClient>,
  authUser: {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  },
  role: UserRole,
  fullName: string
): Promise<boolean> {
  const { error } = await admin.auth.admin.updateUserById(authUser.id, {
    app_metadata: {
      ...authUser.app_metadata,
      role,
      profile_active: true,
      quantix_profile_synced: true,
    },
    user_metadata: {
      ...authUser.user_metadata,
      full_name: fullName,
    },
  });

  return !error;
}

export async function ensureUserProfileAfterSignIn(
  userId: string
): Promise<EnsureUserProfileResult> {
  if (!userId) {
    return { ok: false, created: false, error: 'Missing user id.' };
  }

  try {
    const admin = createAdminClient();

    const { data: existingProfile, error: existingError } = await admin
      .from('users')
      .select('id, role, deleted_at')
      .eq('id', userId)
      .maybeSingle();

    if (existingError) {
      const { data: authUserData } = await admin.auth.admin.getUserById(userId);
      const authUser = authUserData?.user;

      if (authUser && existingError.message.includes('permission denied')) {
        const role = readRoleFromAuthUser(authUser);
        if (role) {
          return { ok: true, created: false };
        }
      }

      return { ok: false, created: false, error: existingError.message };
    }

    if (existingProfile && !existingProfile.deleted_at) {
      const { data: authUserData } = await admin.auth.admin.getUserById(userId);
      if (authUserData?.user) {
        const role =
          (existingProfile.role && isUserRole(existingProfile.role)
            ? existingProfile.role
            : null) ?? readRoleFromAuthUser(authUserData.user);

        if (role) {
          await syncAuthMetadataForUser(
            admin,
            authUserData.user,
            role,
            resolveFullName(
              authUserData.user.email ?? '',
              authUserData.user.user_metadata
            )
          );
        }
      }

      return { ok: true, created: false };
    }

    const { data: authUserData, error: authError } =
      await admin.auth.admin.getUserById(userId);

    if (authError || !authUserData.user) {
      return {
        ok: false,
        created: false,
        error: authError?.message ?? 'Auth user not found.',
      };
    }

    const authUser = authUserData.user;
    const email = authUser.email?.trim().toLowerCase();

    if (!email) {
      return { ok: false, created: false, error: 'Auth user has no email.' };
    }

    const { data: emailConflict, error: emailConflictError } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (emailConflictError) {
      return { ok: false, created: false, error: emailConflictError.message };
    }

    if (emailConflict && emailConflict.id !== userId) {
      return {
        ok: false,
        created: false,
        error: 'An active profile already exists for this email.',
      };
    }

    const { count: activeProfileCount, error: countError } = await admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (countError) {
      return { ok: false, created: false, error: countError.message };
    }

    const role: UserRole =
      (activeProfileCount ?? 0) === 0 ? 'super_admin' : 'viewer';

    const { error: insertError } = await admin.from('users').insert({
      id: userId,
      email,
      full_name: resolveFullName(email, authUser.user_metadata),
      role,
    });

    if (insertError) {
      const metadataSynced = await syncAuthMetadataForUser(
        admin,
        authUser,
        role,
        resolveFullName(email, authUser.user_metadata)
      );

      if (metadataSynced) {
        return { ok: true, created: false };
      }

      return { ok: false, created: false, error: insertError.message };
    }

    await syncAuthMetadataForUser(
      admin,
      authUser,
      role,
      resolveFullName(email, authUser.user_metadata)
    );

    if (!isUserRole(role)) {
      return { ok: false, created: false, error: 'Invalid role assigned.' };
    }

    return { ok: true, created: true };
  } catch (error) {
    return {
      ok: false,
      created: false,
      error: error instanceof Error ? error.message : 'Provisioning failed.',
    };
  }
}
