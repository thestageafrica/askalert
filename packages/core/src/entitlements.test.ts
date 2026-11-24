import { describe, expect, it } from 'vitest';
import { checkEntitlement } from './entitlements';
import { createFreeSubscription, withUsageAt } from './subscription';

const now = new Date('2026-11-24T12:00:00.000Z');

describe('checkEntitlement', () => {
  it('allows the first request on buyer free', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const decision = checkEntitlement(state, 'start_request', { now });
    expect(decision.outcome).toBe('allow');
  });

  it('warns at exactly 80% of requests (2 limit → after 2nd is 100%, so warn on path to 2)', () => {
    // limit 2: used 1, adding 1 → after=2 → ratio 1.0 >= 0.8 → warn (still allowed)
    const state = withUsageAt(
      createFreeSubscription({ userId: 'u1', audience: 'buyer', now }),
      { requests: 1 },
    );
    const decision = checkEntitlement(state, 'start_request', { now });
    expect(decision.outcome).toBe('warn_at_80');
    if (decision.outcome === 'warn_at_80') {
      expect(decision.limit).toBe(2);
      expect(decision.remaining).toBe(0);
    }
  });

  it('blocks at 100% when requests are exhausted', () => {
    const state = withUsageAt(
      createFreeSubscription({ userId: 'u1', audience: 'buyer', now }),
      { requests: 2 },
    );
    const decision = checkEntitlement(state, 'start_request', { now });
    expect(decision.outcome).toBe('block');
    if (decision.outcome === 'block') {
      expect(decision.reason).toMatch(/all requests/i);
      expect(decision.nextStep).toMatch(/Starter|Top up/i);
    }
  });

  it('warns at exactly 80% of relayed messages (30 → used 23 + 1 = 24 → 80%)', () => {
    const state = withUsageAt(
      createFreeSubscription({ userId: 'u1', audience: 'buyer', now }),
      { relayedMessages: 23 },
    );
    const decision = checkEntitlement(state, 'relay_message', { now });
    expect(decision.outcome).toBe('warn_at_80');
    if (decision.outcome === 'warn_at_80') {
      expect(decision.limit).toBe(30);
      expect(decision.remaining).toBe(6);
    }
  });

  it('blocks WhatsApp on buyer free', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const decision = checkEntitlement(state, 'send_whatsapp', { now });
    expect(decision.outcome).toBe('block');
    if (decision.outcome === 'block') {
      expect(decision.reason).toMatch(/WhatsApp/i);
    }
  });

  it('blocks expired subscriptions', () => {
    const state = {
      ...createFreeSubscription({ userId: 'u1', audience: 'buyer', now }),
      endsAt: '2026-01-01T00:00:00.000Z',
    };
    const decision = checkEntitlement(state, 'start_request', { now });
    expect(decision.outcome).toBe('block');
    if (decision.outcome === 'block') {
      expect(decision.reason).toMatch(/ended/i);
    }
  });

  it('blocks contact_vendors above vendorsPerRequest', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const decision = checkEntitlement(state, 'contact_vendors', {
      now,
      vendorsOnRequest: 4,
    });
    expect(decision.outcome).toBe('block');
  });
});
