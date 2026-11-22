import { describe, expect, it } from 'vitest';
import { computeEscrowSplit } from '@askalert/payments';
import {
  DEMO_COMMISSION_PCT,
  DEMO_ESCROW_BOUNDS,
  DEMO_FEE_BEARER,
  DEMO_HOLD_PCT,
  DEMO_PROCESSING_FEE_MINOR,
  DEMO_TOTAL_MINOR,
} from './mock-data';

describe('app checkout escrow wiring', () => {
  it('matches ₦128,500 at 40% hold after commission and processing fees', () => {
    const split = computeEscrowSplit({
      totalMinor: DEMO_TOTAL_MINOR,
      commissionPct: DEMO_COMMISSION_PCT,
      processingFeeMinor: DEMO_PROCESSING_FEE_MINOR,
      feeBearer: DEMO_FEE_BEARER,
      holdPct: DEMO_HOLD_PCT,
      bounds: DEMO_ESCROW_BOUNDS,
    });

    expect(DEMO_TOTAL_MINOR).toBe(12_850_000);
    expect(split.commissionMinor).toBe(1_542_000);
    expect(split.processingFeeMinor).toBe(160_000);
    expect(split.distributableMinor).toBe(11_148_000);
    expect(split.heldMinor).toBe(4_459_200);
    expect(split.releasedNowMinor).toBe(6_688_800);
    expect(split.effectiveHoldPct).toBe(40);
    expect(split.heldMinor + split.releasedNowMinor).toBe(split.distributableMinor);
  });
});
