import { describe, expect, it } from 'vitest';
import { completeMockPurchase, createFreeSubscription } from './subscription';
import { getActivePlan } from './entitlements';
import { listPlans } from './plans';

const now = new Date('2026-11-24T12:00:00.000Z');

describe('plans catalogue', () => {
  it('exposes buyer free and starter with placeholder prices', () => {
    const plans = listPlans();
    const free = plans.find((plan) => plan.slug === 'buyer_free');
    const starter = plans.find((plan) => plan.slug === 'buyer_starter');
    expect(free?.limits.requestsPerMonth).toBe(2);
    expect(starter?.priceMinor).toBe(300_000);
    expect(plans.find((plan) => plan.slug === 'vendor_pro')).toBeUndefined();
  });

  it('completes a mock Starter purchase and resets usage', () => {
    const free = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const upgraded = completeMockPurchase({
      state: {
        ...free,
        usage: { ...free.usage, requests: 2 },
      },
      kind: 'starter_pass',
      now,
    });
    expect(upgraded.planId).toContain('starter');
    expect(upgraded.usage.requests).toBe(0);
    expect(getActivePlan(upgraded, now)?.slug).toBe('buyer_starter');
  });
});
