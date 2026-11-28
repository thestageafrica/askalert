import type { EscrowCurrency, EscrowEvent, EscrowRecord } from './types';

/**
 * AskAlert ledger accounts never treat customer funds as AskAlert money.
 * Entries only mirror licensed-partner (or sandbox) events.
 */
export const LEDGER_ACCOUNTS = {
  partnerSuspense: 'partner_suspense',
  vendorPayable: 'vendor_payable',
  platformCommission: 'platform_commission',
  partnerFees: 'partner_fees',
  refunds: 'refunds',
} as const;

export type LedgerAccount = (typeof LEDGER_ACCOUNTS)[keyof typeof LEDGER_ACCOUNTS];

export type LedgerEntry = {
  id: string;
  escrowId: string;
  eventId: string;
  account: LedgerAccount;
  /** Positive = debit, negative = credit. Integers in minor units. */
  amountMinor: number;
  currency: EscrowCurrency;
  memo: string;
  createdAt: string;
};

export type LedgerSnapshot = {
  entries: LedgerEntry[];
  /** Sum of all amounts; must stay 0 (debits equal credits). */
  balanceMinor: number;
};

function entryId(eventId: string, account: LedgerAccount): string {
  return `led_${eventId}_${account}`;
}

/**
 * Mirror a normalised partner event into balanced ledger entries.
 * Customer funds sit in partner_suspense — never an AskAlert cash account.
 */
export function mirrorEscrowEventToLedger(
  record: EscrowRecord,
  event: EscrowEvent,
): LedgerEntry[] {
  const at = event.occurredAt;
  const currency = record.currency;

  switch (event.type) {
    case 'EscrowFunded': {
      const amount = record.amountMinor;
      return [
        {
          id: entryId(event.id, LEDGER_ACCOUNTS.partnerSuspense),
          escrowId: record.id,
          eventId: event.id,
          account: LEDGER_ACCOUNTS.partnerSuspense,
          amountMinor: amount,
          currency,
          memo: 'Partner reports funds received (not AskAlert cash)',
          createdAt: at,
        },
        {
          id: entryId(event.id, LEDGER_ACCOUNTS.vendorPayable),
          escrowId: record.id,
          eventId: event.id,
          account: LEDGER_ACCOUNTS.vendorPayable,
          amountMinor: -amount,
          currency,
          memo: 'Obligation to vendor via partner',
          createdAt: at,
        },
      ];
    }
    case 'MilestoneReleased': {
      const amount = Number(event.payload.amountMinor ?? 0);
      if (!Number.isInteger(amount) || amount <= 0) {
        return [];
      }
      return [
        {
          id: entryId(event.id, LEDGER_ACCOUNTS.vendorPayable),
          escrowId: record.id,
          eventId: event.id,
          account: LEDGER_ACCOUNTS.vendorPayable,
          amountMinor: amount,
          currency,
          memo: 'Vendor payable reduced after partner release',
          createdAt: at,
        },
        {
          id: entryId(event.id, LEDGER_ACCOUNTS.partnerSuspense),
          escrowId: record.id,
          eventId: event.id,
          account: LEDGER_ACCOUNTS.partnerSuspense,
          amountMinor: -amount,
          currency,
          memo: 'Partner suspense reduced after release',
          createdAt: at,
        },
      ];
    }
    case 'RefundCompleted': {
      const amount = Number(event.payload.amountMinor ?? 0);
      if (!Number.isInteger(amount) || amount <= 0) {
        return [];
      }
      return [
        {
          id: entryId(event.id, LEDGER_ACCOUNTS.refunds),
          escrowId: record.id,
          eventId: event.id,
          account: LEDGER_ACCOUNTS.refunds,
          amountMinor: amount,
          currency,
          memo: 'Refund mirrored from partner',
          createdAt: at,
        },
        {
          id: entryId(event.id, LEDGER_ACCOUNTS.partnerSuspense),
          escrowId: record.id,
          eventId: event.id,
          account: LEDGER_ACCOUNTS.partnerSuspense,
          amountMinor: -amount,
          currency,
          memo: 'Partner suspense reduced after refund',
          createdAt: at,
        },
      ];
    }
    default:
      return [];
  }
}

export function summariseLedger(entries: LedgerEntry[]): LedgerSnapshot {
  const balanceMinor = entries.reduce((sum, entry) => sum + entry.amountMinor, 0);
  return { entries, balanceMinor };
}
