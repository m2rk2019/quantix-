import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Required for server-side profile provisioning.'
    );
  }

  return key;
}

export function createAdminClient(): ReturnType<
  typeof createClient<Database>
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL.');
  }

  return createClient<Database>(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
