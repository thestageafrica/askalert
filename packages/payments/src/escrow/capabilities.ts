import { z } from 'zod';

export const escrowCapabilitiesSchema = z
  .object({
    nativeHold: z.boolean(),
    partialRelease: z.boolean(),
    autoRelease: z.boolean(),
    claimPause: z.boolean(),
    partialRefund: z.boolean(),
    multiPartyPayout: z.boolean(),
    commissionDeduction: z.boolean(),
    payInMethods: z.array(z.string()),
    currencies: z.array(z.enum(['NGN', 'USD'])),
    limits: z
      .object({
        minAmountMinor: z.number().int().nonnegative().optional(),
        maxAmountMinor: z.number().int().positive().optional(),
      })
      .default({}),
  })
  .strict();

export type EscrowCapabilities = z.infer<typeof escrowCapabilitiesSchema>;

export const MOCK_ESCROW_CAPABILITIES: EscrowCapabilities = {
  nativeHold: true,
  partialRelease: true,
  autoRelease: true,
  claimPause: true,
  partialRefund: true,
  multiPartyPayout: false,
  commissionDeduction: true,
  payInMethods: ['sandbox_link'],
  currencies: ['NGN'],
  limits: {},
};

/** Flutterwave has no confirmed native hold in public docs — both strategies gated off. */
export const FLUTTERWAVE_ESCROW_CAPABILITIES_BASE: EscrowCapabilities = {
  nativeHold: false,
  partialRelease: true,
  autoRelease: true,
  claimPause: true,
  partialRefund: true,
  multiPartyPayout: true,
  commissionDeduction: true,
  payInMethods: ['card', 'banktransfer', 'ussd'],
  currencies: ['NGN'],
  limits: {},
};
