import { z } from 'zod';
import type { VendorOfferInput } from './quote-rank';

export const simulatedVendorsInputSchema = z
  .object({
    useSimulatedVendors: z.literal(true),
    missionId: z.string().min(1),
    vendorProfileId: z.string().uuid(),
    vendorUserId: z.string().uuid(),
    budgetMinMinor: z.number().int().nonnegative().optional(),
    budgetMaxMinor: z.number().int().nonnegative().optional(),
    seed: z.string().optional(),
    now: z.date().optional(),
  })
  .strict();

export type SimulatedVendorsInput = z.infer<typeof simulatedVendorsInputSchema>;

export type SimulatedVendorReply =
  | { kind: 'offer'; offer: VendorOfferInput }
  | { kind: 'decline'; message: string }
  | { kind: 'question'; message: string };

/** Development-only: realistic vendor replies. Never call without useSimulatedVendors: true. */
export function simulateVendorReply(input: SimulatedVendorsInput): SimulatedVendorReply {
  const parsed = simulatedVendorsInputSchema.parse(input);
  const now = parsed.now ?? new Date();
  const roll = hashToUnit(`${parsed.seed ?? ''}:${parsed.vendorProfileId}`);

  if (roll < 0.12) {
    return {
      kind: 'decline',
      message: 'Thanks, we are fully booked that day.',
    };
  }
  if (roll < 0.22) {
    return {
      kind: 'question',
      message: 'Can you share more detail on timing and access?',
    };
  }

  const min = parsed.budgetMinMinor ?? 50_000;
  const max = parsed.budgetMaxMinor ?? Math.max(min + 100_000, min * 2);
  const span = Math.max(max - min, 1);
  const amountMinor = min + Math.floor(span * (0.35 + roll * 0.45));

  return {
    kind: 'offer',
    offer: {
      id: `sim-offer-${parsed.missionId.slice(0, 8)}-${parsed.vendorProfileId.slice(0, 8)}`,
      vendorProfileId: parsed.vendorProfileId,
      vendorUserId: parsed.vendorUserId,
      amountMinor,
      currency: 'NGN',
      message:
        roll > 0.7
          ? 'We can handle this. Price includes setup and travel within Lekki.'
          : 'Happy to help. This quote covers labour and standard materials.',
      status: 'pending',
      vendorRating: 3.8 + roll,
      responseMinutes: 5 + Math.floor(roll * 40),
      createdAt: now.toISOString(),
    },
  };
}

function hashToUnit(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return (hash % 10_000) / 10_000;
}