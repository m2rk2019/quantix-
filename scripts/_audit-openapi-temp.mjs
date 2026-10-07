import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(import.meta.dirname, '../.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const openapi = await fetch(`${base}/rest/v1/`, { headers }).then((r) => r.json());
const fav = openapi.definitions?.user_rate_library_favorites?.properties;
console.log('favorites props', fav ? Object.keys(fav) : null);
const paths = Object.keys(openapi.paths || {}).filter((p) => p.includes('rpc'));
console.log('rpc paths sample', paths.filter(p => p.includes('import') || p.includes('sync') || p.includes('rate')).join('\n'));
