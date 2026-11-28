export type Money = {
  amountKobo: number;
  currency: 'NGN';
};

function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format Naira for display.
 * Uses the en-NG digit grouping style (comma thousands, 2 decimal places).
 * Implemented with integer math so formatting never depends on float money
 * storage and stays reliable across Node ICU builds.
 */
export function formatNaira(money: Money): string {
  if (!Number.isInteger(money.amountKobo)) {
    throw new Error('Money amounts must be integers in kobo.');
  }

  const negative = money.amountKobo < 0;
  const absolute = Math.abs(money.amountKobo);
  const major = Math.trunc(absolute / 100);
  const minor = absolute % 100;
  const formatted = `${groupThousands(major)}.${minor.toString().padStart(2, '0')}`;

  // Match Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }) shape.
  return `${negative ? '-' : ''}₦${formatted}`;
}

export function createMoney(amountKobo: number, currency: Money['currency'] = 'NGN'): Money {
  if (!Number.isInteger(amountKobo)) {
    throw new Error('Money amounts must be integers in kobo.');
  }

  return { amountKobo, currency };
}

/**
 * Convert whole Naira (no kobo fraction) to kobo for storage.
 * People type 3000 for ₦3,000 — never ask them for kobo.
 */
export function nairaToKobo(nairaMajor: number): number {
  if (!Number.isInteger(nairaMajor)) {
    throw new Error('Naira amounts must be whole numbers when converting without kobo.');
  }
  return nairaMajor * 100;
}

/** Whole Naira major units from kobo (drops any kobo remainder). */
export function koboToNairaMajor(amountKobo: number): number {
  if (!Number.isInteger(amountKobo)) {
    throw new Error('Money amounts must be integers in kobo.');
  }
  return Math.trunc(amountKobo / 100);
}

/**
 * Parse a Naira amount typed by a person (e.g. "3,000" or "3.50") into kobo.
 * Returns null when the text is empty or not a valid money amount.
 */
export function parseNairaInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '');
  if (cleaned === '') {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  const [majorPart, minorPart = ''] = cleaned.split('.');
  const major = Number(majorPart);
  const minor = Number(`${minorPart}00`.slice(0, 2));
  return major * 100 + minor;
}

/** Plain Naira text for form fields (no ₦ symbol). */
export function formatNairaInput(amountKobo: number): string {
  if (!Number.isInteger(amountKobo)) {
    throw new Error('Money amounts must be integers in kobo.');
  }
  const negative = amountKobo < 0;
  const absolute = Math.abs(amountKobo);
  const major = Math.trunc(absolute / 100);
  const minor = absolute % 100;
  const body = minor === 0 ? String(major) : `${major}.${minor.toString().padStart(2, '0')}`;
  return `${negative ? '-' : ''}${body}`;
}

export {
  computeEscrowSplit,
  computeEscrowSplitInputSchema,
  escrowBoundsSchema,
  feeBearerSchema,
  type ComputeEscrowSplitInput,
  type EscrowBounds,
  type EscrowSplitResult,
  type FeeBearer,
} from './compute-escrow-split';

export {
  COMING_SOON_COPY,
  ESCROW_BANNED_PATTERNS,
  LEDGER_ACCOUNTS,
  MockEscrowProvider,
  PartnerEscrowProvider,
  SANDBOX_BANNER,
  assertEscrowCopyAllowed,
  canUseEscrowWording,
  createEscrowInputSchema,
  escrowCurrencySchema,
  escrowEventTypeSchema,
  escrowMilestoneSpecSchema,
  escrowPartnerDetailsSchema,
  escrowPartySchema,
  escrowRuntimeConfigSchema,
  escrowStatusSchema,
  lintEscrowCopy,
  loadEscrowRuntimeConfig,
  mapBuyerShareToMilestones,
  mapBuyerShareToMilestonesInputSchema,
  milestoneKindSchema,
  milestoneStatusSchema,
  mirrorEscrowEventToLedger,
  partnerDetailsComplete,
  partnerFeeModelSchema,
  presentCheckoutEscrow,
  resolveEscrowProvider,
  summariseLedger,
  type CheckoutEscrowPresentation,
  type CopyLintHit,
  type CopyLintResult,
  type CreateEscrowInput,
  type DisputeEvidence,
  type EscrowCurrency,
  type EscrowEvent,
  type EscrowEventType,
  type EscrowMilestone,
  type EscrowMilestoneSpec,
  type EscrowPartnerDetails,
  type EscrowParty,
  type EscrowProvider,
  type EscrowRecord,
  type EscrowRuntimeConfig,
  type EscrowStatus,
  type FundingInstructions,
  type LedgerAccount,
  type LedgerEntry,
  type LedgerSnapshot,
  type MapBuyerShareToMilestonesInput,
  type MappedMilestones,
  type MilestoneKind,
  type MilestoneStatus,
  type MockEscrowProviderOptions,
  type ParsedWebhook,
  type PartnerEscrowProviderOptions,
  type PartnerFeeModel,
  type ResolveEscrowProviderOptions,
  type WebhookVerificationResult,
} from './escrow/index';
