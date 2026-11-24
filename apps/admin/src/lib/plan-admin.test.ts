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
    const { plan: next, version } = publishPlanVersion(plan, {
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
    expect(version.version).toBe(2);
    expect(next.currentVersion).toBe(2);
    expect(next.versions).toHaveLength(2);
    expect(getLiveVersion(next).limits.requestsPerMonth).toBe(3);
    // Prior version preserved for subscribers still on v1.
    expect(next.versions.find((item) => item.version === 1)?.limits.requestsPerMonth).toBe(2);
  });

  it('rolls the catalogue pointer back without deleting versions', () => {
    const seed = listPlans(true).find((plan) => plan.slug === 'buyer_starter')!;
    let plan = planFromCatalogue(seed);
    plan = publishPlanVersion(plan, {
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
    }).plan;
    const rolled = rollbackPlanVersion(plan, 1);
    expect(rolled.currentVersion).toBe(1);
    expect(rolled.versions).toHaveLength(2);
    expect(getLiveVersion(rolled).priceMinor).toBe(seed.priceMinor);
  });

  it('rejects empty change notes', () => {
    const seed = listPlans(true)[0]!;
    const plan = planFromCatalogue(seed);
    expect(() =>
      publishPlanVersion(plan, {
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
      }),
    ).toThrow(/change note/i);
  });

  it('previews plain capabilities', () => {
    const seed = listPlans(true).find((plan) => plan.slug === 'buyer_starter')!;
    const lines = previewPlanCapabilities(getLiveVersion(planFromCatalogue(seed)));
    expect(lines.some((line) => /WhatsApp/i.test(line))).toBe(true);
  });
});
