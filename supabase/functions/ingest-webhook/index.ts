/**
 * Receives events forwarded by apps/edge-webhooks.
 * Checks shared secret, dedupes event ids, enqueues jobs. No business logic yet.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'authorization, x-client-info, apikey, content-type, x-askalert-webhook-secret, x-askalert-webhook-source',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function collectEventIds(body: Record<string, unknown>): string[] {
  const source = String(body.source ?? 'unknown');
  if (source === 'whatsapp' && Array.isArray(body.kept)) {
    return (body.kept as Array<{ id?: string }>)
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id))
      .map((id) => `whatsapp:${id}`);
  }
  if (source === 'paystack') {
    const payload = body.payload as { data?: { id?: unknown } } | undefined;
    const dataId = payload?.data?.id != null ? String(payload.data.id) : 'unknown';
    const event = typeof body.event === 'string' ? body.event : 'paystack';
    return [`paystack:${event}:${dataId}`];
  }
  return [`${source}:${crypto.randomUUID()}`];
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const expected = Deno.env.get('WEBHOOK_SHARED_SECRET') ?? '';
  const provided = request.headers.get('x-askalert-webhook-secret');
  if (!expected || !provided || !timingSafeEqualString(provided, expected)) {
    return json({ error: 'invalid_shared_secret' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const source = String(body.source ?? '');
  if (source !== 'whatsapp' && source !== 'paystack') {
    return json({ error: 'invalid_source' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const eventIds = collectEventIds(body);
  let inserted = 0;
  let duplicates = 0;

  for (const id of eventIds) {
    const { error } = await client.from('webhook_events').insert({ id, source });
    if (error) {
      if (error.code === '23505') {
        duplicates += 1;
        continue;
      }
      return json({ error: 'dedupe_insert_failed', code: error.code }, 500);
    }
    inserted += 1;
  }

  if (inserted === 0) {
    return json({ ok: true, enqueued: false, duplicates, inserted: 0 });
  }

  const jobPayload = {
    type: 'webhook_event',
    source,
    eventIds,
    event: body.event ?? null,
    payload: body.payload ?? body,
    enqueuedAt: new Date().toISOString(),
  };

  const { data: msgId, error: enqueueError } = await client.rpc('enqueue_job', {
    p_payload: jobPayload,
  });

  if (enqueueError) {
    return json({ error: 'enqueue_failed', code: enqueueError.code }, 500);
  }

  return json({
    ok: true,
    enqueued: true,
    jobId: msgId,
    inserted,
    duplicates,
  });
});
