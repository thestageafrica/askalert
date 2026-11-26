import { describe, expect, it } from 'vitest';
import { simulateVendorReply } from './simulated-vendors';

describe('simulated vendors', () => {
  it('requires explicit useSimulatedVendors flag', () => {
    expect(() =>
      simulateVendorReply({
        useSimulatedVendors: true,
        missionId: '11111111-1111-4111-8111-111111111111',
        vendorProfileId: '22222222-2222-4222-8222-222222222222',
        vendorUserId: '33333333-3333-4333-8333-333333333333',
        budgetMinMinor: 100_000,
        budgetMaxMinor: 300_000,
        seed: 'demo',
      }),
    ).not.toThrow();
  });

  it('returns stable replies for the same seed', () => {
    const base = {
      useSimulatedVendors: true as const,
      missionId: '11111111-1111-4111-8111-111111111111',
      vendorProfileId: '22222222-2222-4222-8222-222222222222',
      vendorUserId: '33333333-3333-4333-8333-333333333333',
      budgetMinMinor: 100_000,
      budgetMaxMinor: 300_000,
      seed: 'stable',
    };
    const a = simulateVendorReply(base);
    const b = simulateVendorReply(base);
    expect(a.kind).toBe(b.kind);
  });
});