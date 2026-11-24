import { describe, expect, it } from 'vitest';
import {
  assertSharedSecret,
  buildJobPayload,
  collectEventIds,
  ingestEnvelopeSchema,
} from './webhook-ingest';

describe('webhook ingest helpers', () => {
  it('rejects a bad shared secret', () => {
    const result = assertSharedSecret('nope', 'expected-secret');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  it('accepts a matching shared secret', () => {
    expect(assertSharedSecret('secret', 'secret').ok).toBe(true);
  });

  it('collects WhatsApp kept event ids', () => {
    const envelope = ingestEnvelopeSchema.parse({
      source: 'whatsapp',
      payload: {},
      kept: [{ kind: 'message', id: 'wamid.1' }],
    });
    expect(collectEventIds(envelope)).toEqual(['whatsapp:wamid.1']);
  });

  it('builds a job payload skeleton', () => {
    const envelope = ingestEnvelopeSchema.parse({
      source: 'paystack',
      event: 'charge.success',
      payload: { data: { id: 99 } },
    });
    const ids = collectEventIds(envelope);
    const job = buildJobPayload(envelope, ids);
    expect(job.type).toBe('webhook_event');
    expect(job.source).toBe('paystack');
    expect(ids[0]).toBe('paystack:charge.success:99');
  });
});
