/**
 * Probe required tables via PostgREST (no DDL).
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/load-env-local.mjs';

loadEnvLocal();

const tables = [
  'users',
  'projects',
  'project_details',
  'wbs',
  'boq_items',
  'estimate_summary',
  'rate_library_items',
  'boq_rate_analysis_lines',
  'company_suppliers',
  'company_units',
  'company_resource_categories',
  'company_settings',
  'project_benchmark_actuals',
];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

for (const table of tables) {
  const { error } = await admin.from(table).select('*', { count: 'exact', head: true });
  console.log(error ? `MISSING ${table}: ${error.message}` : `OK      ${table}`);
}
