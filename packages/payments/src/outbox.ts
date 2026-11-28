import { z } from 'zod';

export const outboxStatusSchema = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'dead',
]);
export type OutboxStatus = z.infer<typeof outboxStatusSchema>;

export type ProviderOutboxItem = {
  id: string;
  providerKey: string;
  idempotencyKey: string;
  operation: string;
  payload: Record<string, string | number | boolean | null>;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * In-memory outbox for provider requests (retries + backoff + dead-letter).
 * Persist to Postgres in a later migration; interface stays the same.
 */
export class ProviderOutbox {
  private readonly items = new Map<string, ProviderOutboxItem>();
  private seq = 0;

  enqueue(input: {
    providerKey: string;
    idempotencyKey: string;
    operation: string;
    payload: ProviderOutboxItem['payload'];
  }): ProviderOutboxItem {
    const existing = [...this.items.values()].find(
      (item) =>
        item.providerKey === input.providerKey &&
        item.idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      return existing;
    }
    this.seq += 1;
    const now = new Date().toISOString();
    const item: ProviderOutboxItem = {
      id: `out_${this.seq}`,
      providerKey: input.providerKey,
      idempotencyKey: input.idempotencyKey,
      operation: input.operation,
      payload: input.payload,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: now,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    return item;
  }

  markSuccess(id: string): ProviderOutboxItem {
    const item = this.require(id);
    const next = {
      ...item,
      status: 'succeeded' as const,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }

  markFailure(id: string, error: string, maxAttempts = 5): ProviderOutboxItem {
    const item = this.require(id);
    const attempts = item.attempts + 1;
    const dead = attempts >= maxAttempts;
    const delayMs = Math.min(60_000, 500 * 2 ** attempts);
    const next: ProviderOutboxItem = {
      ...item,
      attempts,
      status: dead ? 'dead' : 'failed',
      lastError: error.slice(0, 240),
      nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }

  listDeadLetters(): ProviderOutboxItem[] {
    return [...this.items.values()].filter((item) => item.status === 'dead');
  }

  listPending(now = new Date()): ProviderOutboxItem[] {
    return [...this.items.values()].filter(
      (item) =>
        (item.status === 'pending' || item.status === 'failed') &&
        new Date(item.nextAttemptAt).getTime() <= now.getTime(),
    );
  }

  private require(id: string): ProviderOutboxItem {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Outbox item not found: ${id}`);
    }
    return item;
  }
}
