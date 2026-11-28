import { z } from 'zod';

export const escrowCurrencySchema = z.enum(['NGN']);
export type EscrowCurrency = z.infer<typeof escrowCurrencySchema>;

export const escrowStatusSchema = z.enum([
  'CREATED',
  'AWAITING_FUNDS',
  'FUNDED',
  'PARTIALLY_RELEASED',
  'RELEASED',
  'PAUSED',
  'REFUND_PENDING',
  'REFUNDED',
  'EXPIRED',
  'FAILED',
]);
export type EscrowStatus = z.infer<typeof escrowStatusSchema>;

export const milestoneKindSchema = z.enum(['pay_now', 'confirm_later']);
export type MilestoneKind = z.infer<typeof milestoneKindSchema>;

export const milestoneStatusSchema = z.enum([
  'PENDING',
  'RELEASED',
  'PAUSED',
  'REFUNDED',
  'FAILED',
]);
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

export const escrowPartySchema = z
  .object({
    role: z.enum(['buyer', 'vendor', 'platform']),
    partyId: z.string().min(1),
    displayName: z.string().min(1).optional(),
  })
  .strict();
export type EscrowParty = z.infer<typeof escrowPartySchema>;

export const escrowMilestoneSpecSchema = z
  .object({
    id: z.string().min(1),
    kind: milestoneKindSchema,
    amountMinor: z.number().int().nonnegative(),
    currency: escrowCurrencySchema,
    label: z.string().min(1),
    autoReleaseHours: z.number().int().positive().nullable().optional(),
  })
  .strict();
export type EscrowMilestoneSpec = z.infer<typeof escrowMilestoneSpecSchema>;

export type EscrowMilestone = EscrowMilestoneSpec & {
  status: MilestoneStatus;
  releasedAt: string | null;
  pausedAt: string | null;
};

export const createEscrowInputSchema = z
  .object({
    bookingId: z.string().min(1),
    parties: z.array(escrowPartySchema).min(2),
    amountMinor: z.number().int().positive(),
    currency: escrowCurrencySchema,
    milestones: z.array(escrowMilestoneSpecSchema).min(1),
    metadata: z.record(z.string()).optional(),
  })
  .strict();
export type CreateEscrowInput = z.infer<typeof createEscrowInputSchema>;

export type FundingInstructions = {
  escrowId: string;
  sandbox: boolean;
  label: 'SANDBOX' | 'LIVE';
  method: 'virtual_account' | 'payment_link';
  reference: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  paymentLink?: string;
  currency: EscrowCurrency;
  amountMinor: number;
  expiresAt: string | null;
};

export type EscrowRecord = {
  id: string;
  bookingId: string;
  status: EscrowStatus;
  currency: EscrowCurrency;
  amountMinor: number;
  parties: EscrowParty[];
  milestones: EscrowMilestone[];
  sandbox: boolean;
  providerKey: string;
  createdAt: string;
  updatedAt: string;
  fundedAt: string | null;
  disputeOpen: boolean;
  externalRefs: Record<string, string>;
  metadata: Record<string, string>;
};

export const escrowEventTypeSchema = z.enum([
  'EscrowCreated',
  'EscrowFunded',
  'MilestoneReleased',
  'ReleaseFailed',
  'RefundCompleted',
  'EscrowPaused',
  'EscrowResumed',
  'DisputeOpened',
  'ProviderError',
]);
export type EscrowEventType = z.infer<typeof escrowEventTypeSchema>;

export type EscrowEvent = {
  id: string;
  type: EscrowEventType;
  escrowId: string;
  providerEventId: string;
  occurredAt: string;
  payload: Record<string, string | number | boolean | null>;
};

export type DisputeEvidence = {
  claimId: string;
  summary: string;
  attachmentRefs?: string[];
};

export type WebhookVerificationResult =
  | { ok: true }
  | { ok: false; reason: string };

export type ParsedWebhook =
  | { kind: 'ignored'; reason: string }
  | { kind: 'event'; event: EscrowEvent; rawProviderRefs?: Record<string, string> };
