import { Webhook } from 'standardwebhooks';
import { authEmailHookPayloadSchema, type AuthEmailHookPayload } from './types';

/**
 * Normalize Supabase Send Email Hook secrets for `standardwebhooks`.
 * Accepts `v1,whsec_…`, `whsec_…`, or raw base64 (matches Supabase docs).
 */
export function normalizeHookSecret(secret: string): string {
  return secret
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^v1,whsec_/, '')
    .replace(/^whsec_/, '')
    .replace(/^v1,/, '')
    .trim();
}

export type VerifyHookResult =
  | { ok: true; payload: AuthEmailHookPayload }
  | { ok: false; errorCode: string };

function headerValue(headers: Record<string, string>, name: string): string {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return value;
    }
  }
  return '';
}

/**
 * Verify a Supabase Send Email Hook request (Standard Webhooks HMAC).
 * Uses the same library scheme Auth uses when signing.
 */
export function verifySendEmailHook(input: {
  secret: string;
  rawBody: string;
  headers: Record<string, string>;
}): VerifyHookResult {
  if (!input.secret) {
    return { ok: false, errorCode: 'missing_hook_secret' };
  }

  const id = headerValue(input.headers, 'webhook-id');
  const timestamp = headerValue(input.headers, 'webhook-timestamp');
  const signature = headerValue(input.headers, 'webhook-signature');
  if (!id || !timestamp || !signature) {
    return { ok: false, errorCode: 'invalid_hook_signature' };
  }

  try {
    const wh = new Webhook(normalizeHookSecret(input.secret));
    const verified = wh.verify(input.rawBody, {
      'webhook-id': id,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    });
    const parsed = authEmailHookPayloadSchema.safeParse(verified);
    if (!parsed.success) {
      return { ok: false, errorCode: 'invalid_hook_payload' };
    }
    return { ok: true, payload: parsed.data };
  } catch {
    return { ok: false, errorCode: 'invalid_hook_signature' };
  }
}
