const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

let validated = false;

export function validateProductionEnv(): void {
  if (validated || process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (url.includes('placeholder') || !url.startsWith('https://')) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL for production');
  }

  validated = true;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
