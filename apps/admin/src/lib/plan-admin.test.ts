import { describe, expect, it } from 'vitest';
import { listPlans } from '@askalert/core';
import {
  getLiveVersion,
  planFromCatalogue,
  previewPlanCapabilities,
  publishPlanVersion,
  rollbackPlanVersion,
} from './plan-admin';

describe('plan admin versioning', () => {
  it('publishes a new version without removing older ones', () => {
    const seed = listPlans(true).find((plan) => plan.slug === 'buyer_free');
    expect(seed).toBeTruthy();
    const plan = planFromCatalogue(seed!);
    const published = publishPlanVersion(plan, {
      slug: plan.slug,
      audience: plan.audience,
      name: plan.name,
      priceMinor: 0,
      periodDays: 30,
      currency: 'NGN',
      limits: {
        ...getLiveVersion(plan).limits,
        requestsPerMonth: 3,
      },
      features: getLiveVersion(plan).features,
      disabled: false,
      changeNote: 'Bump free requests to 3',
    });
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }
    expect(published.version.version).toBe(2);
    expect(published.plan.currentVersion).toBe(2);
    expect(published.plan.versions).toHaveLength(2);
    expect(getLiveVersion(published.plan).limits.requestsPerMonth).toBe(3);
    // Prior version preserved for subscribers still on v1.
    expect(
      published.plan.versions.find((item) => item.version === 1)?.limits.requestsPerMonth,
    ).toBe(2);
  });

  it('rolls the catalogue pointer back without deleting versions', () => {
    const seed = listPlans(true).find((plan) => plan.slug === 'buyer_starter')!;
    let plan = planFromCatalogue(seed);
    const published = publishPlanVersion(plan, {
      slug: plan.slug,
      audience: plan.audience,
      name: plan.name,
      priceMinor: 350_000,
      periodDays: 30,
      currency: 'NGN',
      limits: getLiveVersion(plan).limits,
      features: getLiveVersion(plan).features,
      disabled: false,
      changeNote: 'Price test',
    });
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }
    plan = published.plan;
    const rolled = rollbackPlanVersion(plan, 1);
    expect(rolled.currentVersion).toBe(1);
    expect(rolled.versions).toHaveLength(2);
    expect(getLiveVersion(rolled).priceMinor).toBe(seed.priceMinor);
  });

  it('rejects empty change notes without throwing', () => {
    const seed = listPlans(true)[0]!;
    const plan = planFromCatalogue(seed);
    const result = publishPlanVersion(plan, {
      slug: plan.slug,
      audience: plan.audience,
      name: plan.name,
      priceMinor: 0,
      periodDays: 30,
      currency: 'NGN',
      limits: getLiveVersion(plan).limits,
      features: getLiveVersion(plan).features,
      disabled: false,
      changeNote: '  ',
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toMatch(/change note/i);
  });

  it('previews plain capabilities', () => {
    const seed = listPlans(true).find((plan) => plan.slug === 'buyer_starter')!;
    const lines = previewPlanCapabilities(getLiveVersion(planFromCatalogue(seed)));
    expect(lines.some((line) => /WhatsApp/i.test(line))).toBe(true);
  });

  it('previews vendor service location caps', () => {
    const seed = listPlans(true).find((plan) => plan.slug === 'vendor_free')!;
    const lines = previewPlanCapabilities(getLiveVersion(planFromCatalogue(seed)));
    expect(lines.some((line) => /2 service locations/i.test(line))).toBe(true);
  });
});
