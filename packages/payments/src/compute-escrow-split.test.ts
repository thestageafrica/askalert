import { describe, expect, it } from 'vitest';
import { computeEscrowSplit } from './compute-escrow-split';

const fixtureBounds = {
  minHoldPct: 0,
  maxHoldPct: 100,
  vendorMinReleasePct: 0,
} as const;

/** Required Prompt 7 fixture: ₦100,000 total, 12% commission, ₦1,600 fee on vendor. */
const requiredFixture = {
  totalMinor: 10_000_000,
  commissionPct: 12,
  processingFeeMinor: 160_000,
  feeBearer: 'vendor' as const,
  bounds: fixtureBounds,
};

describe('computeEscrowSplit', () => {
  it('matches the required fixture at 60%, 0%, and 100% hold', () => {
    const at60 = computeEscrowSplit({ ...requiredFixture, holdPct: 60 });
    expect(at60.commissionMinor).toBe(1_200_000);
    expect(at60.distributableMinor).toBe(8_640_000);
    expect(at60.heldMinor).toBe(5_184_000);
    expect(at60.releasedNowMinor).toBe(3_456_000);
    expect(at60.effectiveHoldPct).toBe(60);
    expect(at60.protectionLabel).toBe('Protected');
    expect(at60.heldMinor + at60.releasedNowMinor).toBe(at60.distributableMinor);

    const at0 = computeEscrowSplit({ ...requiredFixture, holdPct: 0 });
    expect(at0.distributableMinor).toBe(8_640_000);
    expect(at0.heldMinor).toBe(0);
    expect(at0.releasedNowMinor).toBe(8_640_000);
    expect(at0.protectionLabel).toBe('Direct payment, no protection');
    expect(at0.warnings.some((warning) => /no protection|direct payment/i.test(warning))).toBe(
      true,
    );

    const at100 = computeEscrowSplit({ ...requiredFixture, holdPct: 100 });
    expect(at100.heldMinor).toBe(8_640_000);
    expect(at100.releasedNowMinor).toBe(0);
    expect(at100.protectionLabel).toBe('Protected');
  });

  it('does not deduct processing fee when feeBearer is platform', () => {
    const result = computeEscrowSplit({
      ...requiredFixture,
      feeBearer: 'platform',
      holdPct: 60,
    });
    expect(result.distributableMinor).toBe(10_000_000 - 1_200_000);
    expect(result.distributableMinor).toBe(8_800_000);
    expect(result.heldMinor).toBe(5_280_000);
    expect(result.releasedNowMinor).toBe(3_520_000);
    expect(result.processingFeeMinor).toBe(160_000);
  });

  it('does not deduct processing fee when feeBearer is buyer', () => {
    const result = computeEscrowSplit({
      ...requiredFixture,
      feeBearer: 'buyer',
      holdPct: 50,
    });
    expect(result.distributableMinor).toBe(8_800_000);
    expect(result.heldMinor).toBe(4_400_000);
    expect(result.releasedNowMinor).toBe(4_400_000);
  });

  it('clamps holdPct to min and max bounds', () => {
    const high = computeEscrowSplit({
      ...requiredFixture,
      holdPct: 95,
      bounds: { minHoldPct: 10, maxHoldPct: 70, vendorMinReleasePct: 0 },
    });
    expect(high.effectiveHoldPct).toBe(70);
    expect(high.warnings.some((warning) => /adjusted/i.test(warning))).toBe(true);

    const low = computeEscrowSplit({
      ...requiredFixture,
      holdPct: 5,
      bounds: { minHoldPct: 20, maxHoldPct: 80, vendorMinReleasePct: 0 },
    });
    expect(low.effectiveHoldPct).toBe(20);
  });

  it('caps hold by vendorMinReleasePct so the vendor always gets a floor now', () => {
    const result = computeEscrowSplit({
      ...requiredFixture,
      holdPct: 100,
      bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 30 },
    });
    expect(result.effectiveHoldPct).toBe(70);
    expect(result.heldMinor).toBe(Math.floor((8_640_000 * 70) / 100));
    expect(result.releasedNowMinor).toBe(8_640_000 - result.heldMinor);
    expect(result.warnings.some((warning) => /at least 30%/i.test(warning))).toBe(true);
  });

  it('gives rounding remainders to releasedNow on odd distributable amounts', () => {
    // 10001 * 12% floor = 1200; vendor fee 0 → distributable 8801; 33% hold floors.
    const result = computeEscrowSplit({
      totalMinor: 10_001,
      commissionPct: 12,
      processingFeeMinor: 0,
      feeBearer: 'vendor',
      holdPct: 33,
      bounds: fixtureBounds,
    });
    expect(result.commissionMinor).toBe(1_200);
    expect(result.distributableMinor).toBe(8_801);
    expect(result.heldMinor).toBe(Math.floor((8_801 * 33) / 100));
    expect(result.heldMinor).toBe(2_904);
    expect(result.releasedNowMinor).toBe(5_897);
    expect(result.heldMinor + result.releasedNowMinor).toBe(result.distributableMinor);
  });

  it('warns when the effective hold is low but above zero', () => {
    const result = computeEscrowSplit({
      ...requiredFixture,
      holdPct: 10,
    });
    expect(result.effectiveHoldPct).toBe(10);
    expect(result.protectionLabel).toBe('Protected');
    expect(result.warnings.some((warning) => /hold is low/i.test(warning))).toBe(true);
  });

  it('throws clear Zod errors for invalid input', () => {
    expect(() =>
      computeEscrowSplit({
        ...requiredFixture,
        totalMinor: 10_000.5,
        holdPct: 60,
      }),
    ).toThrow(/integer in kobo/i);

    expect(() =>
      computeEscrowSplit({
        ...requiredFixture,
        holdPct: 150,
      }),
    ).toThrow(/Invalid escrow split input/i);

    expect(() =>
      computeEscrowSplit({
        ...requiredFixture,
        feeBearer: 'customer',
        holdPct: 60,
      }),
    ).toThrow(/Invalid escrow split input/i);

    expect(() =>
      computeEscrowSplit({
        ...requiredFixture,
        holdPct: 60,
        bounds: { minHoldPct: 80, maxHoldPct: 20, vendorMinReleasePct: 0 },
      }),
    ).toThrow(/minHoldPct/i);
  });

  it('throws when fees consume the full total', () => {
    expect(() =>
      computeEscrowSplit({
        totalMinor: 1_000,
        commissionPct: 50,
        processingFeeMinor: 600,
        feeBearer: 'vendor',
        holdPct: 50,
        bounds: fixtureBounds,
      }),
    ).toThrow(/nothing to distribute/i);
  });
});
