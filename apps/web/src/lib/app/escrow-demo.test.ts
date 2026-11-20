import { describe, expect, it } from 'vitest';
import { computeEscrowSplit } from '@askalert/payments';
import {
  DEMO_COMMISSION_PCT,
  DEMO_PROCESSING_FEE_MINOR,
  DEMO_TOTAL_MINOR,
} from './mock-data';

describe('app checkout escrow wiring', () => {
  it('keeps Prompt 7 fixture numbers at 60% hold', () => {
    const split = computeEscrowSplit({
      totalMinor: DEMO_TOTAL_MINOR,
      commissionPct: DEMO_COMMISSION_PCT,
      processingFeeMinor: DEMO_PROCESSING_FEE_MINOR,
      feeBearer: 'vendor',
      holdPct: 60,
      bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
    });

    expect(split.distributableMinor).toBe(8_640_000);
    expect(split.heldMinor).toBe(5_184_000);
    expect(split.releasedNowMinor).toBe(3_456_000);
  });
});
