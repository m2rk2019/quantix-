import { readFileSync } from 'node:fs';
import dns from 'node:dns/promises';
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
console.log('projectRef', ref);

const hosts = [
  `db.${ref}.supabase.co`,
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-1-ap-southeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
];

for (const h of hosts) {
  try {
    const a = await dns.lookup(h, { all: true });
    console.log(
      'DNS',
      h,
      a.map((x) => `${x.address}/${x.family}`).join(',')
    );
  } catch (e) {
    console.log('DNS FAIL', h, e.code || e.message);
  }
}

const health = await fetch(`${url}/auth/v1/health`);
console.log('auth health', health.status);

const rest = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
});
console.log('rest', rest.status);
