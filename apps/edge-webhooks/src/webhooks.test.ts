import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hmacHex } from './crypto';
import { DedupeStore } from './dedupe';
import type { EdgeWebhookEnv } from './env';
import {
  paystackChargeSuccessPayload,
  whatsappFailedStatusPayload,
  whatsappMessagePayload,
  whatsappStatusOnlyPayload,
} from './fixtures';
import { handleRequest } from './index';
import { filterWhatsAppPayload } from './whatsapp';

const env: EdgeWebhookEnv = {
  WHATSAPP_VERIFY_TOKEN: 'verify-token-test',
  WHATSAPP_APP_SECRET: 'whatsapp-app-secret',
  PAYSTACK_SECRET: 'paystack-secret',
  WEBHOOK_SHARED_SECRET: 'shared-secret',
  SUPABASE_FUNCTION_URL: 'https://example.functions.supabase.co/webhooks',
  SERVICE_NAME: 'askalert-edge-webhooks-test',
};

describe('WhatsApp filter', () => {
  it('drops status-only sent/delivered/read payloads', () => {
    const dedupe = new DedupeStore();
    const filtered = filterWhatsAppPayload(whatsappStatusOnlyPayload, dedupe);
    expect(filtered.keptMessages).toBe(0);
    expect(filtered.keptFailedStatuses).toBe(0);
    expect(filtered.droppedStatuses).toBe(3);
    expect(filtered.events).toHaveLength(0);
  });

  it('keeps incoming messages', () => {
    const dedupe = new DedupeStore();
    const filtered = filterWhatsAppPayload(whatsappMessagePayload, dedupe);
    expect(filtered.keptMessages).toBe(1);
    expect(filtered.events[0]?.id).toBe('wamid.MESSAGE_1');
  });

  it('keeps failed statuses', () => {
    const dedupe = new DedupeStore();
    const filtered = filterWhatsAppPayload(whatsappFailedStatusPayload, dedupe);
    expect(filtered.keptFailedStatuses).toBe(1);
    expect(filtered.droppedStatuses).toBe(0);
  });

  it('deduplicates by message id', () => {
    const dedupe = new DedupeStore();
    const first = filterWhatsAppPayload(whatsappMessagePayload, dedupe);
    const second = filterWhatsAppPayload(whatsappMessagePayload, dedupe);
    expect(first.keptMessages).toBe(1);
    expect(second.keptMessages).toBe(0);
    expect(second.duplicates).toBe(1);
  });
});

describe('handleRequest', () => {
  let dedupe: DedupeStore;
  let forwarded: Array<{ url: string; init?: RequestInit }>;

  beforeEach(() => {
    dedupe = new DedupeStore();
    forwarded = [];
  });

  const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
    forwarded.push({ url: String(input), init });
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;

  it('answers Meta verification challenge', async () => {
    const url =
      'https://hooks.example/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token-test&hub.challenge=12345';
    const response = await handleRequest(new Request(url, { method: 'GET' }), env, {
      dedupe,
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('12345');
  });

  it('rejects WhatsApp posts with an invalid signature', async () => {
    const body = JSON.stringify(whatsappMessagePayload);
    const response = await handleRequest(
      new Request('https://hooks.example/whatsapp', {
        method: 'POST',
        headers: { 'x-hub-signature-256': 'sha256=deadbeef' },
        body,
      }),
      env,
      { dedupe, fetchImpl },
    );
    expect(response.status).toBe(401);
    expect(forwarded).toHaveLength(0);
  });

  it('forwards a valid WhatsApp message payload', async () => {
    const body = JSON.stringify(whatsappMessagePayload);
    const digest = await hmacHex('SHA-256', env.WHATSAPP_APP_SECRET, body);
    const response = await handleRequest(
      new Request('https://hooks.example/whatsapp', {
        method: 'POST',
        headers: { 'x-hub-signature-256': `sha256=${digest}` },
        body,
      }),
      env,
      { dedupe, fetchImpl },
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { forwarded: number };
    expect(json.forwarded).toBe(1);
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0]?.url).toBe(env.SUPABASE_FUNCTION_URL);
  });

  it('returns 200 and does not forward status-only payloads', async () => {
    const body = JSON.stringify(whatsappStatusOnlyPayload);
    const digest = await hmacHex('SHA-256', env.WHATSAPP_APP_SECRET, body);
    const response = await handleRequest(
      new Request('https://hooks.example/whatsapp', {
        method: 'POST',
        headers: { 'x-hub-signature-256': `sha256=${digest}` },
        body,
      }),
      env,
      { dedupe, fetchImpl },
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { forwarded: number };
    expect(json.forwarded).toBe(0);
    expect(forwarded).toHaveLength(0);
  });

  it('does not forward duplicate WhatsApp messages', async () => {
    const body = JSON.stringify(whatsappMessagePayload);
    const digest = await hmacHex('SHA-256', env.WHATSAPP_APP_SECRET, body);
    const headers = { 'x-hub-signature-256': `sha256=${digest}` };

    const first = await handleRequest(
      new Request('https://hooks.example/whatsapp', { method: 'POST', headers, body }),
      env,
      { dedupe, fetchImpl },
    );
    const second = await handleRequest(
      new Request('https://hooks.example/whatsapp', { method: 'POST', headers, body }),
      env,
      { dedupe, fetchImpl },
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(((await second.json()) as { forwarded: number }).forwarded).toBe(0);
    expect(forwarded).toHaveLength(1);
  });

  it('rejects Paystack posts with an invalid signature', async () => {
    const body = JSON.stringify(paystackChargeSuccessPayload);
    const response = await handleRequest(
      new Request('https://hooks.example/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': 'nope' },
        body,
      }),
      env,
      { dedupe, fetchImpl },
    );
    expect(response.status).toBe(401);
    expect(forwarded).toHaveLength(0);
  });

  it('forwards a valid Paystack event', async () => {
    const body = JSON.stringify(paystackChargeSuccessPayload);
    const digest = await hmacHex('SHA-512', env.PAYSTACK_SECRET, body);
    const response = await handleRequest(
      new Request('https://hooks.example/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': digest },
        body,
      }),
      env,
      { dedupe, fetchImpl },
    );
    expect(response.status).toBe(200);
    expect(forwarded).toHaveLength(1);
  });
});
