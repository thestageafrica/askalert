import { describe, expect, it } from 'vitest';
import {
  marketingBuyerPlans,
  marketingVendorPlan,
  planFeatureLines,
  planPriceLabel,
} from './plan-marketing';

describe('plan marketing copy', () => {
  it('reads buyer Free and Starter from the catalogue', () => {
    const buyers = marketingBuyerPlans();
    expect(buyers.map((plan) => plan.slug)).toEqual(['buyer_free', 'buyer_starter']);
    expect(planPriceLabel(buyers[0]!)).toBe('Free');
    expect(planPriceLabel(buyers[1]!)).toMatch(/₦3,000\.00/);
  });

  it('describes vendor free lead alerts', () => {
    const vendor = marketingVendorPlan();
    expect(vendor).toBeTruthy();
    const lines = planFeatureLines(vendor!);
    expect(lines.some((line) => /lead alerts/i.test(line))).toBe(true);
    expect(lines.some((line) => /WhatsApp/i.test(line))).toBe(true);
  });

  it('marks Free as in-app chat only', () => {
    const free = marketingBuyerPlans().find((plan) => plan.slug === 'buyer_free')!;
    expect(planFeatureLines(free).some((line) => /in-app chat only/i.test(line))).toBe(true);
  });
});
