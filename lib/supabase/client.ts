import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnv } from '@/lib/supabase/env';
import type { Database } from '@/types/database';

/**
 * Browser Supabase client — uses only the public URL + anon/publishable key.
 * Never reads SUPABASE_SERVICE_ROLE_KEY.
 */
export function createClient(): ReturnType<
  typeof createBrowserClient<Database>
> {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
