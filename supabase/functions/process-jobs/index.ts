/**
 * Processes pending pgmq jobs in small idempotent batches.
 * Skeleton only — no domain business logic in Prompt 15.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const cronSecret = Deno.env.get('CRON_SHARED_SECRET') ?? '';
  const provided = request.headers.get('x-askalert-cron-secret');
  const auth = request.headers.get('authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authorized =
    (cronSecret && provided === cronSecret) ||
    (serviceKey && auth === `Bearer ${serviceKey}`);

  if (!authorized) {
    return json({ error: 'unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Prefer pgmq.read via RPC if exposed; fallback: no-op success when empty.
  const { data: rows, error } = await client.rpc('process_askalert_job_batch', {
    p_batch_size: BATCH_SIZE,
    p_max_attempts: MAX_ATTEMPTS,
  });

  if (error) {
    // Function may not exist until migration applied — return clear skeleton status.
    return json({
      ok: false,
      error: 'batch_rpc_unavailable',
      code: error.code,
      hint: 'Apply migrations including process_askalert_job_batch',
    }, 200);
  }

  return json({ ok: true, result: rows ?? null });
});
