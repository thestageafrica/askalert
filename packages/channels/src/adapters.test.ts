import { describe, expect, it } from 'vitest';
import { completeMockPurchase, createFreeSubscription } from '@askalert/core';
import { AppAdapter } from './app-adapter';
import { WhatsAppAdapterStub } from './whatsapp-adapter';
import { relayMessage } from './relay';

const now = new Date('2026-11-24T12:00:00.000Z');

describe('channel adapters', () => {
  it('AppAdapter delivers in-app messages', async () => {
    const adapter = new AppAdapter();
    const result = await adapter.send(
      {
        id: 'm1',
        threadId: 't1',
        senderRole: 'buyer',
        body: 'Is Friday free?',
        filtered: false,
      },
      { userId: 'u1', channel: 'app', relayed: true },
    );
    expect(result.ok).toBe(true);
    expect(result.channel).toBe('app');
  });

  it('WhatsApp stub queues an outbox row and never sends', async () => {
    const adapter = new WhatsAppAdapterStub();
    const result = await adapter.send(
      {
        id: 'm2',
        threadId: 't1',
        senderRole: 'agent',
        body: 'Quote ready',
        filtered: false,
      },
      { userId: 'u1', channel: 'whatsapp', relayed: true },
    );
    expect(result.ok).toBe(true);
    expect(result.queued).toBe(true);
    expect(adapter.outbox).toHaveLength(1);
    expect(adapter.outbox[0]?.status).toBe('pending');
  });

  it('relayMessage blocks WhatsApp on buyer free', async () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const adapter = new WhatsAppAdapterStub();
    const result = await relayMessage({
      state,
      adapter,
      message: {
        id: 'm3',
        threadId: 't1',
        senderRole: 'buyer',
        body: 'Hello on WhatsApp',
        filtered: false,
      },
      context: { userId: 'u1', channel: 'whatsapp', relayed: false },
    });
    expect(result.blocked).toBe(true);
    expect(adapter.outbox).toHaveLength(0);
  });

  it('relayMessage masks phones then sends on app', async () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const adapter = new AppAdapter();
    const result = await relayMessage({
      state,
      adapter,
      message: {
        id: 'm4',
        threadId: 't1',
        senderRole: 'buyer',
        body: 'Call me on 08031234567',
        filtered: false,
      },
      context: { userId: 'u1', channel: 'app', relayed: true },
    });
    expect(result.blocked).toBe(false);
    expect(result.masked).toBe(true);
    expect(result.message.body).toContain('[hidden]');
    expect(result.message.filtered).toBe(true);
    expect(result.send?.ok).toBe(true);
  });

  it('relayMessage allows WhatsApp after Starter upgrade', async () => {
    const free = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const { state } = completeMockPurchase({
      state: free,
      kind: 'starter_pass',
      now,
    });
    const adapter = new WhatsAppAdapterStub();
    const result = await relayMessage({
      state,
      adapter,
      message: {
        id: 'm5',
        threadId: 't1',
        senderRole: 'buyer',
        body: 'Continue here',
        filtered: false,
      },
      context: { userId: 'u1', channel: 'whatsapp', relayed: false },
    });
    expect(result.blocked).toBe(false);
    expect(adapter.outbox).toHaveLength(1);
  });
});
