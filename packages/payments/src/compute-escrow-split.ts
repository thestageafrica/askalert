import { z } from 'zod';

export const feeBearerSchema = z.enum(['vendor', 'platform', 'buyer']);

export const escrowBoundsSchema = z
  .object({
    minHoldPct: z.number().min(0).max(100),
    maxHoldPct: z.number().min(0).max(100),
    vendorMinReleasePct: z.number().min(0).max(100),
  })
  .strict()
  .superRefine((bounds, ctx) => {
    if (bounds.minHoldPct > bounds.maxHoldPct) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minHoldPct cannot be greater than maxHoldPct.',
        path: ['minHoldPct'],
      });
    }
  });

export const computeEscrowSplitInputSchema = z
  .object({
    totalMinor: z
      .number()
      .int('totalMinor must be an integer in kobo.')
      .positive('totalMinor must be greater than zero.'),
    commissionPct: z.number().min(0).max(100),
    processingFeeMinor: z
      .number()
      .int('processingFeeMinor must be an integer in kobo.')
      .nonnegative('processingFeeMinor cannot be negative.'),
    feeBearer: feeBearerSchema,
    holdPct: z.number().min(0).max(100),
    bounds: escrowBoundsSchema,
  })
  .strict();

export type FeeBearer = z.infer<typeof feeBearerSchema>;
export type EscrowBounds = z.infer<typeof escrowBoundsSchema>;
export type ComputeEscrowSplitInput = z.infer<typeof computeEscrowSplitInputSchema>;

export type EscrowSplitResult = {
  totalMinor: number;
  commissionMinor: number;
  processingFeeMinor: number;
  distributableMinor: number;
  heldMinor: number;
  releasedNowMinor: number;
  effectiveHoldPct: number;
  protectionLabel: 'Staged payout' | 'Full payout now';
  warnings: string[];
};

const LOW_HOLD_WARNING_PCT = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join(' ');
}

/**
 * Pure escrow split in minor units (kobo).
 * Never uses floats for money amounts — only integer kobo throughout.
 */
export function computeEscrowSplit(input: unknown): EscrowSplitResult {
  const parsed = computeEscrowSplitInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid escrow split input. ${formatZodErrors(parsed.error)}`);
  }

  const {
    totalMinor,
    commissionPct,
    processingFeeMinor,
    feeBearer,
    holdPct,
    bounds,
  } = parsed.data;

  const commissionMinor = Math.floor((totalMinor * commissionPct) / 100);
  const vendorBorneFee = feeBearer === 'vendor' ? processingFeeMinor : 0;
  const distributableMinor = totalMinor - commissionMinor - vendorBorneFee;

  if (distributableMinor < 0) {
    throw new Error(
      'Invalid escrow split input. Commission and processing fee leave nothing to distribute.',
    );
  }

  const maxHoldFromVendorFloor = 100 - bounds.vendorMinReleasePct;
  const effectiveMaxHoldPct = Math.min(bounds.maxHoldPct, maxHoldFromVendorFloor);
  const effectiveMinHoldPct = Math.min(bounds.minHoldPct, effectiveMaxHoldPct);
  const effectiveHoldPct = clamp(holdPct, effectiveMinHoldPct, effectiveMaxHoldPct);

  // Floor the hold so any rounding remainder stays with the vendor (releasedNow).
  const heldMinor = Math.floor((distributableMinor * effectiveHoldPct) / 100);
  const releasedNowMinor = distributableMinor - heldMinor;

  if (heldMinor + releasedNowMinor !== distributableMinor) {
    throw new Error('Escrow split invariant failed: held + released must equal distributable.');
  }

  const warnings: string[] = [];

  if (holdPct < effectiveMinHoldPct || holdPct > effectiveMaxHoldPct) {
    warnings.push(
      `Later release was adjusted to ${effectiveHoldPct}% to stay within the allowed range (${effectiveMinHoldPct}%–${effectiveMaxHoldPct}%).`,
    );
  }

  if (effectiveHoldPct === 0) {
    warnings.push('Full amount is set to go to the vendor now.');
  } else if (effectiveHoldPct < LOW_HOLD_WARNING_PCT) {
    warnings.push(
      `Later release is low (${effectiveHoldPct}%). Consider releasing more after you confirm the job.`,
    );
  }

  if (bounds.vendorMinReleasePct > 0 && effectiveMaxHoldPct < bounds.maxHoldPct) {
    warnings.push(
      `Vendor must receive at least ${bounds.vendorMinReleasePct}% now, so later release cannot exceed ${effectiveMaxHoldPct}%.`,
    );
  }

  return {
    totalMinor,
    commissionMinor,
    processingFeeMinor,
    distributableMinor,
    heldMinor,
    releasedNowMinor,
    effectiveHoldPct,
    protectionLabel: heldMinor > 0 ? 'Staged payout' : 'Full payout now',
    warnings,
  };
}
