import { z } from 'zod';
import {
  computeEscrowSplit,
  escrowBoundsSchema,
  type EscrowBounds,
  type EscrowSplitResult,
} from '../compute-escrow-split';
import { partnerFeeModelSchema, type PartnerFeeModel } from './config';
import type { EscrowCurrency, EscrowMilestoneSpec } from './types';

export const mapBuyerShareToMilestonesInputSchema = z
  .object({
    totalMinor: z.number().int().positive(),
    currency: z.literal('NGN').default('NGN'),
    holdPct: z.number().min(0).max(100),
    bounds: escrowBoundsSchema,
    commissionPct: z.number().min(0).max(100),
    feeModel: partnerFeeModelSchema,
    autoReleaseHours: z.number().int().positive().nullable().default(72),
  })
  .strict();

export type MapBuyerShareToMilestonesInput = z.infer<
  typeof mapBuyerShareToMilestonesInputSchema
>;

export type MappedMilestones = {
  split: EscrowSplitResult;
  partnerFeeMinor: number;
  milestones: EscrowMilestoneSpec[];
};

function computePartnerFeeMinor(totalMinor: number, feeModel: PartnerFeeModel): number {
  const percentPart = Math.floor((totalMinor * feeModel.percentFee) / 100);
  return feeModel.flatFeeMinor + percentPart;
}

/**
 * Map the buyer's chosen later-release share into pay_now + confirm_later milestones.
 * Commission and partner fees follow the configurable fee model; amounts stay integers in kobo.
 */
export function mapBuyerShareToMilestones(input: unknown): MappedMilestones {
  const parsed = mapBuyerShareToMilestonesInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `Invalid milestone mapping input. ${parsed.error.issues
        .map((issue) => issue.message)
        .join(' ')}`,
    );
  }

  const {
    totalMinor,
    currency,
    holdPct,
    bounds,
    commissionPct,
    feeModel,
    autoReleaseHours,
  } = parsed.data;

  const partnerFeeMinor = computePartnerFeeMinor(totalMinor, feeModel);
  const split = computeEscrowSplit({
    totalMinor,
    commissionPct,
    processingFeeMinor: partnerFeeMinor,
    feeBearer: feeModel.feeBearer,
    holdPct,
    bounds,
  });

  const milestones: EscrowMilestoneSpec[] = [
    {
      id: 'pay_now',
      kind: 'pay_now',
      amountMinor: split.releasedNowMinor,
      currency: currency as EscrowCurrency,
      label: 'Pay now — released to vendor when funding is confirmed',
    },
  ];

  if (split.heldMinor > 0) {
    milestones.push({
      id: 'confirm_later',
      kind: 'confirm_later',
      amountMinor: split.heldMinor,
      currency: currency as EscrowCurrency,
      label: 'Confirm later — released after buyer confirmation or auto-release',
      autoReleaseHours,
    });
  }

  const milestoneSum = milestones.reduce((sum, item) => sum + item.amountMinor, 0);
  if (milestoneSum !== split.distributableMinor) {
    throw new Error(
      'Milestone mapping invariant failed: milestone sum must equal distributable amount.',
    );
  }

  return { split, partnerFeeMinor, milestones };
}

export type { EscrowBounds };
