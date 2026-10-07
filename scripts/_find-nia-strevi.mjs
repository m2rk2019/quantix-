import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!(k in process.env)) process.env[k] = v;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: projects, error } = await sb
  .from('projects')
  .select('id, project_code, project_name, created_at')
  .order('created_at', { ascending: false })
  .limit(40);

console.log('error', error?.message);
for (const p of projects || []) {
  const code = p.project_code || '';
  const name = p.project_name || '';
  if (
    /000013|000017|NIA|STREVI|QCITIZEN|4PH/i.test(code + ' ' + name)
  ) {
    console.log(JSON.stringify(p));
  }
}

const { data: jobs } = await sb
  .from('smart_import_jobs')
  .select('id, project_id, original_filename, status, created_at')
  .order('created_at', { ascending: false })
  .limit(15);
console.log('jobs', JSON.stringify(jobs, null, 2));
