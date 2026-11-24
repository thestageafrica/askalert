import { z } from 'zod';

export const webhookSourceSchema = z.enum(['whatsapp', 'paystack']);
export type WebhookSource = z.infer<typeof webhookSourceSchema>;

export const ingestEnvelopeSchema = z
  .object({
    source: webhookSourceSchema,
    payload: z.unknown(),
    kept: z
      .array(
        z.object({
          kind: z.string(),
          id: z.string(),
          entryIndex: z.number().optional(),
          changeIndex: z.number().optional(),
        }),
      )
      .optional(),
    event: z.string().optional(),
  })
  .strict();

export type IngestEnvelope = z.infer<typeof ingestEnvelopeSchema>;

/** Constant-time compare for shared webhook secrets. */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function assertSharedSecret(
  provided: string | null | undefined,
  expected: string,
): { ok: true } | { ok: false; status: 401; error: string } {
  if (!expected || !provided || !timingSafeEqualString(provided, expected)) {
    return { ok: false, status: 401, error: 'invalid_shared_secret' };
  }
  return { ok: true };
}

/** Collect dedupe ids from a Worker forward envelope. */
export function collectEventIds(envelope: IngestEnvelope): string[] {
  if (envelope.source === 'whatsapp' && envelope.kept && envelope.kept.length > 0) {
    return envelope.kept.map((item) => `whatsapp:${item.id}`);
  }
  if (envelope.source === 'paystack') {
    const payload = envelope.payload;
    const dataId =
      typeof payload === 'object' &&
      payload !== null &&
      'data' in payload &&
      typeof (payload as { data?: { id?: unknown } }).data?.id !== 'undefined'
        ? String((payload as { data: { id: unknown } }).data.id)
        : null;
    const event = envelope.event ?? 'paystack';
    return [`paystack:${event}:${dataId ?? 'unknown'}`];
  }
  return [`${envelope.source}:${Date.now()}`];
}

export function buildJobPayload(envelope: IngestEnvelope, eventIds: string[]): Record<string, unknown> {
  return {
    type: 'webhook_event',
    source: envelope.source,
    eventIds,
    event: envelope.event ?? null,
    // Handler skeleton only — Prompt 15 has no business logic yet.
    payload: envelope.payload,
    enqueuedAt: new Date().toISOString(),
  };
}
