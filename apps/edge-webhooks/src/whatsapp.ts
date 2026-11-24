import { hmacHex, timingSafeEqualHex } from './crypto';
import type { DedupeStore } from './dedupe';
import { forwardToSupabase } from './forward';
import { logInfo } from './log';

const DROP_STATUS = new Set(['sent', 'delivered', 'read']);

type WhatsAppStatus = {
  id?: string;
  status?: string;
};

type WhatsAppMessage = {
  id?: string;
  type?: string;
};

type WhatsAppValue = {
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
};

type WhatsAppChange = {
  field?: string;
  value?: WhatsAppValue;
};

type WhatsAppEntry = {
  changes?: WhatsAppChange[];
};

export type WhatsAppWebhookBody = {
  object?: string;
  entry?: WhatsAppEntry[];
};

export type FilterResult = {
  keptMessages: number;
  keptFailedStatuses: number;
  droppedStatuses: number;
  duplicates: number;
  events: Array<{
    kind: 'message' | 'status_failed';
    id: string;
    entryIndex: number;
    changeIndex: number;
  }>;
};

/** Meta webhook verification challenge. */
export function handleWhatsAppVerify(
  url: URL,
  verifyToken: string,
): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    logInfo('whatsapp_verify', { ok: true });
    return new Response(challenge, { status: 200 });
  }

  logInfo('whatsapp_verify', { ok: false, code: 'token_mismatch' });
  return new Response('Forbidden', { status: 403 });
}

export async function verifyWhatsAppSignature(
  appSecret: string,
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader?.startsWith('sha256=')) {
    return false;
  }
  const provided = signatureHeader.slice('sha256='.length).toLowerCase();
  const expected = (await hmacHex('SHA-256', appSecret, rawBody)).toLowerCase();
  return timingSafeEqualHex(provided, expected);
}

/**
 * Keep incoming messages and failed statuses.
 * Drop sent / delivered / read status events.
 * Deduplicate by WhatsApp message / status id.
 */
export function filterWhatsAppPayload(
  body: WhatsAppWebhookBody,
  dedupe: DedupeStore,
): FilterResult {
  const result: FilterResult = {
    keptMessages: 0,
    keptFailedStatuses: 0,
    droppedStatuses: 0,
    duplicates: 0,
    events: [],
  };

  const entries = body.entry ?? [];
  entries.forEach((entry, entryIndex) => {
    const changes = entry.changes ?? [];
    changes.forEach((change, changeIndex) => {
      const value = change.value ?? {};

      for (const message of value.messages ?? []) {
        const id = message.id;
        if (!id) {
          continue;
        }
        if (!dedupe.claim(`wa:msg:${id}`)) {
          result.duplicates += 1;
          continue;
        }
        result.keptMessages += 1;
        result.events.push({
          kind: 'message',
          id,
          entryIndex,
          changeIndex,
        });
      }

      for (const status of value.statuses ?? []) {
        const id = status.id;
        const statusName = (status.status ?? '').toLowerCase();
        if (!id) {
          continue;
        }
        if (DROP_STATUS.has(statusName)) {
          result.droppedStatuses += 1;
          continue;
        }
        if (statusName !== 'failed') {
          result.droppedStatuses += 1;
          continue;
        }
        if (!dedupe.claim(`wa:status:${id}`)) {
          result.duplicates += 1;
          continue;
        }
        result.keptFailedStatuses += 1;
        result.events.push({
          kind: 'status_failed',
          id,
          entryIndex,
          changeIndex,
        });
      }
    });
  });

  return result;
}

export async function handleWhatsAppPost(options: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
  sharedSecret: string;
  supabaseFunctionUrl: string;
  dedupe: DedupeStore;
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const valid = await verifyWhatsAppSignature(
    options.appSecret,
    options.rawBody,
    options.signatureHeader,
  );
  if (!valid) {
    logInfo('whatsapp_reject', { code: 'invalid_signature' });
    return new Response('Unauthorized', { status: 401 });
  }

  let parsed: WhatsAppWebhookBody;
  try {
    parsed = JSON.parse(options.rawBody) as WhatsAppWebhookBody;
  } catch {
    logInfo('whatsapp_reject', { code: 'invalid_json' });
    return new Response('Bad Request', { status: 400 });
  }

  const filtered = filterWhatsAppPayload(parsed, options.dedupe);
  logInfo('whatsapp_filtered', {
    keptMessages: filtered.keptMessages,
    keptFailedStatuses: filtered.keptFailedStatuses,
    droppedStatuses: filtered.droppedStatuses,
    duplicates: filtered.duplicates,
  });

  if (filtered.events.length === 0) {
    return new Response(JSON.stringify({ ok: true, forwarded: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Return 200 quickly: fire-and-forget style by awaiting a short forward.
  // Worker still awaits forward so Cloudflare keeps the isolate alive long enough.
  const forward = await forwardToSupabase({
    url: options.supabaseFunctionUrl,
    sharedSecret: options.sharedSecret,
    source: 'whatsapp',
    body: {
      source: 'whatsapp',
      kept: filtered.events,
      // Pass the original payload for the Edge Function; it must not log PII.
      payload: parsed,
    },
    fetchImpl: options.fetchImpl,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      forwarded: filtered.events.length,
      upstreamOk: forward.ok,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  );
}
