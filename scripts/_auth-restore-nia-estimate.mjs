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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const actorId = '7de80660-a7d9-44a7-a046-3048bb110879';

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: profile, error: pErr } = await admin
  .from('profiles')
  .select('id, email, full_name, role')
  .eq('id', actorId)
  .maybeSingle();
console.log('profile', profile, pErr?.message);

const { data: userData, error: uErr } = await admin.auth.admin.getUserById(actorId);
console.log('auth user', userData?.user?.email, uErr?.message);

// Try generateLink to get a tokenized session
if (userData?.user?.email) {
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    });
  console.log(
    'link',
    linkErr?.message,
    linkData?.properties?.hashed_token ? 'has_hashed_token' : null,
    Object.keys(linkData || {})
  );

  // Verify OTP style session from token_hash
  const tokenHash = linkData?.properties?.hashed_token;
  if (tokenHash) {
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sess, error: vErr } = await userClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });
    console.log(
      'session',
      vErr?.message,
      sess?.session?.access_token ? 'got_token' : null,
      sess?.user?.id
    );

    if (sess?.session?.access_token) {
      const authed = createClient(url, anonKey, {
        global: {
          headers: { Authorization: `Bearer ${sess.session.access_token}` },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const before = JSON.parse(
        readFileSync('docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json', 'utf8')
      ).nia_db.estimate;
      const { data, error } = await authed
        .from('estimate_summary')
        .update({
          direct_cost: before.direct_cost,
          indirect_cost: before.indirect_cost,
          contingency: before.contingency,
          markup: before.markup,
          vat: before.vat,
          grand_total: before.grand_total,
        })
        .eq('project_id', 'd387f1f1-4271-4e35-832c-e30ba2cb0e66')
        .select('direct_cost, grand_total');
      console.log('estimate update', { data, error });
    }
  }
}
