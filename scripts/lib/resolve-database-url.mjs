/**

 * Resolve a working Supabase PostgreSQL connection string.

 */



import pg from 'pg';



const REGIONS = [

  'ap-southeast-1',

  'ap-southeast-2',

  'ap-northeast-1',

  'ap-northeast-2',

  'ap-south-1',

  'ap-east-1',

  'us-east-1',

  'us-east-2',

  'us-west-1',

  'us-west-2',

  'eu-west-1',

  'eu-west-2',

  'eu-central-1',

  'eu-central-2',

  'eu-north-1',

  'sa-east-1',

  'ca-central-1',

];



function buildCandidates(projectRef, password) {

  const encoded = encodeURIComponent(password);

  const candidates = [];



  // Prefer common pooler endpoints first (session 5432 + transaction 6543).

  for (const cluster of [0, 1]) {

    for (const region of REGIONS.slice(0, 8)) {

      for (const port of [6543, 5432]) {

        candidates.push({

          label: `aws-${cluster}-${region}:${port}`,

          url: `postgresql://postgres.${projectRef}:${encoded}@aws-${cluster}-${region}.pooler.supabase.com:${port}/postgres`,

        });

      }

    }

  }



  candidates.push({

    label: `db.${projectRef}.supabase.co:5432`,

    url: `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,

  });



  // Remaining pooler combinations as fallback.

  for (const cluster of [0, 1, 2, 3, 4, 5]) {

    for (const region of REGIONS) {

      for (const port of [6543, 5432]) {

        const label = `aws-${cluster}-${region}:${port}`;

        if (candidates.some((c) => c.label === label)) {

          continue;

        }

        candidates.push({

          label,

          url: `postgresql://postgres.${projectRef}:${encoded}@aws-${cluster}-${region}.pooler.supabase.com:${port}/postgres`,

        });

      }

    }

  }



  return candidates;

}



async function tryConnect(candidate, timeoutMs) {

  const client = new pg.Client({

    connectionString: candidate.url,

    ssl: { rejectUnauthorized: false },

    connectionTimeoutMillis: timeoutMs,

  });



  try {

    await client.connect();

    await client.query('SELECT 1');

    await client.end();

    return { ok: true, candidate };

  } catch (error) {

    try {

      await client.end();

    } catch {

      // ignore

    }

    return {

      ok: false,

      candidate,

      error:

        error instanceof Error

          ? { message: error.message, code: error.code }

          : { message: String(error) },

    };

  }

}



export async function resolveWorkingDatabaseUrl(projectRef, password, options = {}) {

  const { timeoutMs = 4000, concurrency = 8, onProgress } = options;

  const candidates = buildCandidates(projectRef, password);

  const failures = [];



  for (let i = 0; i < candidates.length; i += concurrency) {

    const batch = candidates.slice(i, i + concurrency);

    const results = await Promise.all(

      batch.map((candidate) => tryConnect(candidate, timeoutMs))

    );



    for (const result of results) {

      if (result.ok) {

        onProgress?.({ status: 'found', label: result.candidate.label });

        return result.candidate;

      }

      failures.push(result);

      onProgress?.({

        status: 'fail',

        label: result.candidate.label,

        error: result.error,

      });

    }

  }



  const sample = failures

    .slice(0, 5)

    .map((f) => `${f.candidate.label}: ${f.error?.code || ''} ${f.error?.message || ''}`)

    .join('\n  ');



  return {

    url: null,

    label: null,

    errorSummary: sample || 'No candidates attempted',

  };

}



export function projectRefFromSupabaseUrl(supabaseUrl) {

  const match = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/);

  return match?.[1] ?? null;

}


