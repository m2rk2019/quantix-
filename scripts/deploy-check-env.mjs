/**
 * Validates required environment variables for Quantix deployment.
 * Run: npm run deploy:check-env
 *
 * Loads .env.local when present (Node 20+).
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_LOCAL = resolve(ROOT, '.env.local');

function loadEnvLocal() {
  if (!existsSync(ENV_LOCAL)) {
    return;
  }

  const lines = readFileSync(ENV_LOCAL, 'utf8').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const deployEnv = process.env.DEPLOY_ENV ?? 'local';
const isProductionCheck = deployEnv === 'production';

const REQUIRED = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    validate: (value) => value.startsWith('https://') && value.includes('supabase'),
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    validate: (value) => value.length > 20 && !value.includes('your-supabase'),
  },
];

const RECOMMENDED = [
  {
    key: 'NEXT_PUBLIC_APP_URL',
    validate: (value) => value.startsWith('https://'),
    productionOnly: true,
  },
];

const failures = [];
const warnings = [];

for (const { key, validate } of REQUIRED) {
  const value = process.env[key]?.trim();

  if (!value) {
    failures.push(`Missing required variable: ${key}`);
    continue;
  }

  if (!validate(value)) {
    failures.push(`Invalid value for ${key}`);
  }
}

for (const { key, validate, productionOnly } of RECOMMENDED) {
  if (productionOnly && !isProductionCheck) {
    continue;
  }

  const value = process.env[key]?.trim();

  if (!value) {
    warnings.push(`Missing recommended variable: ${key}`);
    continue;
  }

  if (!validate(value)) {
    warnings.push(`Invalid or non-HTTPS value for ${key}`);
  }
}

if (isProductionCheck && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  warnings.push(
    'SUPABASE_SERVICE_ROLE_KEY is set — it should not be configured on Vercel production runtime.'
  );
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
  failures.push('NEXT_PUBLIC_SUPABASE_URL still uses placeholder value');
}

console.log(`Environment check (${deployEnv})`);

if (warnings.length > 0) {
  console.warn('Warnings:');
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}

if (failures.length > 0) {
  console.error('Failures:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('Environment variables OK.');
