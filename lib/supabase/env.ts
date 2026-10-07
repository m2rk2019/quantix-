const EXPECTED_SUPABASE_HOST = 'tfpiuuyvknxdegegvqrm.supabase.co';

function trimEnv(value: string | undefined): string {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function resolveAnonOrPublishableKey(): string {
  return (
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

function isBrowserSafeKey(key: string): boolean {
  if (!key || /[\s]/.test(key)) {
    return false;
  }

  // Never allow secret / service-role shaped keys in the browser bundle.
  if (key.startsWith('sb_secret_')) {
    return false;
  }

  return key.startsWith('sb_publishable_') || key.startsWith('eyJ');
}

/**
 * Shared Supabase public env resolver.
 * Never returns the service-role / secret key.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = resolveAnonOrPublishableKey();

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.'
    );
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL must be an https://<project-ref>.supabase.co URL.'
    );
  }

  if (!isBrowserSafeKey(anonKey)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or looks like a service-role/secret key. Use the publishable or anon key only.'
    );
  }

  return { url, anonKey };
}

/** Non-secret diagnostics for operators (never returns key material). */
export function getSupabaseEnvDiagnostics(): {
  urlPresent: boolean;
  anonKeyPresent: boolean;
  urlHostMatchesExpected: boolean;
  anonKeyLooksPublishableOrJwt: boolean;
  anonKeyIsNotServiceRole: boolean;
} {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = resolveAnonOrPublishableKey();

  return {
    urlPresent: Boolean(url),
    anonKeyPresent: Boolean(anonKey),
    urlHostMatchesExpected: url === `https://${EXPECTED_SUPABASE_HOST}`,
    anonKeyLooksPublishableOrJwt:
      anonKey.startsWith('sb_publishable_') || anonKey.startsWith('eyJ'),
    anonKeyIsNotServiceRole:
      Boolean(anonKey) &&
      !anonKey.startsWith('sb_secret_') &&
      isBrowserSafeKey(anonKey),
  };
}
