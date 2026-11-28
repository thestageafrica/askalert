import { createHash, timingSafeEqual } from 'node:crypto';
import {
  FLUTTERWAVE_ESCROW_CAPABILITIES_BASE,
  type EscrowCapabilities,
} from '../../escrow/capabilities';
import type { EscrowProvider } from '../../escrow/provider';
import type {
  CreateEscrowInput,
  DisputeEvidence,
  EscrowEvent,
  EscrowMilestone,
  EscrowRecord,
  EscrowStatus,
  FundingInstructions,
  ParsedWebhook,
  WebhookVerificationResult,
} from '../../escrow/types';
import { createEscrowInputSchema } from '../../escrow/types';
import type { FlutterwaveClient } from './client';
import { FlutterwaveDirectProvider } from './direct-provider';

export type FlutterwaveEscrowStrategy = 'native' | 'ledger_hold';

export type FlutterwaveEscrowGates = {
  /** Written confirmation from Flutterwave that hold/delayed release is permitted. */
  flutterwaveHoldConfirmed: boolean;
  flutterwaveHoldConfirmedAt?: string;
  flutterwaveHoldConfirmedRef?: string;
  /** Nigerian fintech legal opinion on file. */
  legalOpinionOnFile: boolean;
};

export type FlutterwaveEscrowProviderOptions = {
  strategy: FlutterwaveEscrowStrategy;
  /** Both strategies are OFF unless explicitly enabled AND gates pass for ledger_hold. */
  strategyEnabled: boolean;
  gates: FlutterwaveEscrowGates;
  direct: FlutterwaveDirectProvider;
  client: FlutterwaveClient;
  /** Vendor payout destination for ledger_hold releases. */
  resolveVendorPayout?: (vendorPartyId: string) => Promise<{
    accountBank: string;
    accountNumber: string;
    beneficiaryName?: string;
  } | null>;
};

type Store = {
  escrows: Map<string, EscrowRecord>;
  seenEvents: Set<string>;
  events: EscrowEvent[];
};

function deriveStatus(milestones: EscrowMilestone[], disputeOpen: boolean): EscrowStatus {
  if (disputeOpen) {
    return 'PAUSED';
  }
  const released = milestones.filter((item) => item.status === 'RELEASED');
  const refunded = milestones.filter((item) => item.status === 'REFUNDED');
  if (refunded.length === milestones.length) {
    return 'REFUNDED';
  }
  if (released.length === milestones.length) {
    return 'RELEASED';
  }
  if (released.length > 0) {
    return 'PARTIALLY_RELEASED';
  }
  return 'FUNDED';
}

/**
 * Flutterwave escrow adapter.
 * - native: NOT implemented — no public hold/delayed-release docs; throws if enabled.
 * - ledger_hold: collect via Flutterwave checkout, release via transfers. Gated OFF by default.
 */
export class FlutterwaveEscrowProvider implements EscrowProvider {
  readonly key = 'flutterwave';
  readonly sandbox: boolean;

  private readonly strategy: FlutterwaveEscrowStrategy;
  private readonly strategyEnabled: boolean;
  private readonly gates: FlutterwaveEscrowGates;
  private readonly direct: FlutterwaveDirectProvider;
  private readonly client: FlutterwaveClient;
  private readonly resolveVendorPayout: FlutterwaveEscrowProviderOptions['resolveVendorPayout'];
  private readonly store: Store = {
    escrows: new Map(),
    seenEvents: new Set(),
    events: [],
  };
  private seq = 0;

  constructor(options: FlutterwaveEscrowProviderOptions) {
    this.strategy = options.strategy;
    this.strategyEnabled = options.strategyEnabled;
    this.gates = options.gates;
    this.direct = options.direct;
    this.client = options.client;
    this.sandbox = options.client.sandbox;
    this.resolveVendorPayout = options.resolveVendorPayout;
  }

  capabilities(): EscrowCapabilities {
    return {
      ...FLUTTERWAVE_ESCROW_CAPABILITIES_BASE,
      nativeHold: this.strategy === 'native' && this.strategyEnabled,
      currencies: ['NGN'],
    };
  }

  private assertStrategyAllowed(): void {
    if (!this.strategyEnabled) {
      throw new Error(
        `Flutterwave escrow strategy '${this.strategy}' is disabled. Both strategies stay off until gates are met.`,
      );
    }
    if (this.strategy === 'native') {
      throw new Error(
        'Flutterwave native hold/delayed-release is not implemented. No public docs confirm this feature — paste Flutterwave confirmation before enabling.',
      );
    }
    if (
      this.strategy === 'ledger_hold' &&
      (!this.gates.flutterwaveHoldConfirmed || !this.gates.legalOpinionOnFile)
    ) {
      throw new Error(
        'ledger_hold requires flutterwave_hold_confirmed AND legal_opinion_on_file. Holding customer funds may be regulated.',
      );
    }
  }

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}_${Date.now()}`;
  }

  private stamp(): string {
    return new Date().toISOString();
  }

  private require(escrowId: string): EscrowRecord {
    const record = this.store.escrows.get(escrowId);
    if (!record) {
      throw new Error(`Escrow not found: ${escrowId}`);
    }
    return record;
  }

  private save(record: EscrowRecord): EscrowRecord {
    const next = { ...record, updatedAt: this.stamp() };
    this.store.escrows.set(next.id, next);
    return next;
  }

  private pushEvent(
    type: EscrowEvent['type'],
    escrowId: string,
    providerEventId: string,
    payload: EscrowEvent['payload'] = {},
  ): EscrowEvent | null {
    if (this.store.seenEvents.has(providerEventId)) {
      return null;
    }
    this.store.seenEvents.add(providerEventId);
    const event: EscrowEvent = {
      id: this.nextId('evt'),
      type,
      escrowId,
      providerEventId,
      occurredAt: this.stamp(),
      payload,
    };
    this.store.events.push(event);
    return event;
  }

  listEvents(): EscrowEvent[] {
    return [...this.store.events];
  }

  async createEscrow(input: CreateEscrowInput): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    const parsed = createEscrowInputSchema.parse(input);
    const createdAt = this.stamp();
    const record: EscrowRecord = {
      id: this.nextId('esc_flw'),
      bookingId: parsed.bookingId,
      status: 'AWAITING_FUNDS',
      currency: parsed.currency,
      amountMinor: parsed.amountMinor,
      parties: parsed.parties,
      milestones: parsed.milestones.map((milestone) => ({
        ...milestone,
        status: 'PENDING',
        releasedAt: null,
        pausedAt: null,
      })),
      sandbox: this.sandbox,
      providerKey: this.key,
      createdAt,
      updatedAt: createdAt,
      fundedAt: null,
      disputeOpen: false,
      externalRefs: {
        strategy: this.strategy,
        sandboxLabel: this.sandbox ? 'SANDBOX' : 'LIVE',
      },
      metadata: parsed.metadata ?? {},
    };
    this.pushEvent('EscrowCreated', record.id, `flw_create_${record.id}`, {
      bookingId: record.bookingId,
      amountMinor: record.amountMinor,
    });
    return this.save(record);
  }

  async getFundingInstructions(escrowId: string): Promise<FundingInstructions> {
    this.assertStrategyAllowed();
    const record = this.require(escrowId);
    const buyer = record.parties.find((party) => party.role === 'buyer');
    const email = record.metadata.buyerEmail ?? `${buyer?.partyId ?? 'buyer'}@example.invalid`;
    const txRef = `escrow_${record.id}`;
    const checkout = await this.direct.initiateCheckout({
      amount: { amountMinor: record.amountMinor, currency: 'NGN' },
      txRef,
      redirectUrl: record.metadata.redirectUrl ?? 'https://www.askalert.com/app/',
      customer: { email, name: buyer?.displayName },
      meta: { escrowId: record.id, bookingId: record.bookingId },
      idempotencyKey: txRef,
    });
    this.save({
      ...record,
      externalRefs: {
        ...record.externalRefs,
        txRef,
        checkoutUrl: checkout.checkoutUrl,
      },
    });
    return {
      escrowId: record.id,
      sandbox: this.sandbox,
      label: this.sandbox ? 'SANDBOX' : 'LIVE',
      method: 'payment_link',
      reference: txRef,
      paymentLink: checkout.checkoutUrl,
      currency: record.currency,
      amountMinor: record.amountMinor,
      expiresAt: null,
    };
  }

  async onFunded(escrowId: string, providerEventId: string): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    const record = this.require(escrowId);
    if (record.fundedAt) {
      return record;
    }
    const providerTxnId = record.externalRefs.providerTxnId;
    const txRef = record.externalRefs.txRef;
    if (providerTxnId && txRef) {
      const verified = await this.direct.verifyTransaction({
        providerTxnId,
        expectedTxRef: txRef,
        expectedAmountMinor: record.amountMinor,
        expectedCurrency: 'NGN',
      });
      if (!verified.verified) {
        throw new Error(verified.reason ?? 'Flutterwave verification failed before funding.');
      }
    }

    const event = this.pushEvent('EscrowFunded', escrowId, providerEventId, {
      amountMinor: record.amountMinor,
    });
    if (!event) {
      return record;
    }

    let next: EscrowRecord = {
      ...record,
      status: 'FUNDED',
      fundedAt: this.stamp(),
    };
    const payNow = next.milestones.find((item) => item.kind === 'pay_now' && item.status === 'PENDING');
    if (payNow) {
      next = await this.releaseMilestoneInternal(next, payNow.id, `${providerEventId}_pay_now`);
    }
    return this.save(next);
  }

  private async releaseMilestoneInternal(
    record: EscrowRecord,
    milestoneId: string,
    providerEventId: string,
  ): Promise<EscrowRecord> {
    if (record.disputeOpen) {
      throw new Error('Cannot release while a claim is open.');
    }
    if (!record.fundedAt) {
      throw new Error('Cannot release before funding.');
    }
    const milestone = record.milestones.find((item) => item.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }
    if (milestone.status === 'RELEASED') {
      return record;
    }
    if (milestone.status === 'PAUSED') {
      throw new Error(`Milestone ${milestoneId} is paused.`);
    }

    const vendor = record.parties.find((party) => party.role === 'vendor');
    if (vendor && this.resolveVendorPayout && milestone.amountMinor > 0) {
      const payout = await this.resolveVendorPayout(vendor.partyId);
      if (payout) {
        await this.direct.transfer({
          accountBank: payout.accountBank,
          accountNumber: payout.accountNumber,
          amount: { amountMinor: milestone.amountMinor, currency: 'NGN' },
          reference: `rel_${record.id}_${milestoneId}`,
          narration: `AskAlert milestone ${milestoneId}`,
          beneficiaryName: payout.beneficiaryName,
          idempotencyKey: providerEventId,
        });
      }
    }

    const milestones = record.milestones.map((item) =>
      item.id === milestoneId
        ? {
            ...item,
            status: 'RELEASED' as const,
            releasedAt: this.stamp(),
            pausedAt: null,
          }
        : item,
    );
    this.pushEvent('MilestoneReleased', record.id, providerEventId, {
      milestoneId,
      amountMinor: milestone.amountMinor,
    });
    return {
      ...record,
      milestones,
      status: deriveStatus(milestones, false),
      disputeOpen: false,
    };
  }

  async releaseMilestone(escrowId: string, milestoneId: string): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    const record = this.require(escrowId);
    const next = await this.releaseMilestoneInternal(
      record,
      milestoneId,
      this.nextId(`flw_release_${milestoneId}`),
    );
    return this.save(next);
  }

  async releaseAll(escrowId: string): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    let record = this.require(escrowId);
    for (const milestone of record.milestones) {
      if (milestone.status === 'PENDING') {
        record = await this.releaseMilestoneInternal(
          record,
          milestone.id,
          this.nextId(`flw_release_all_${milestone.id}`),
        );
      }
    }
    return this.save(record);
  }

  async refund(escrowId: string, amountMinor: number, reason: string): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new Error('Refund amount must be a positive integer in kobo.');
    }
    const record = this.require(escrowId);
    const providerTxnId = record.externalRefs.providerTxnId;
    if (providerTxnId) {
      await this.direct.refund({
        providerTxnId,
        amountMinor,
        currency: 'NGN',
        comments: reason,
        idempotencyKey: `refund_${escrowId}_${amountMinor}`,
      });
    }
    this.pushEvent('RefundCompleted', escrowId, this.nextId('flw_refund'), {
      amountMinor,
      reason,
    });
    const milestones = record.milestones.map((milestone) =>
      milestone.status === 'PENDING' || milestone.status === 'PAUSED'
        ? { ...milestone, status: 'REFUNDED' as const, pausedAt: null }
        : milestone,
    );
    return this.save({
      ...record,
      milestones,
      status: 'REFUNDED',
      disputeOpen: false,
      metadata: { ...record.metadata, lastRefundReason: reason },
    });
  }

  async pause(escrowId: string, reason: string): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    const record = this.require(escrowId);
    const milestones = record.milestones.map((milestone) =>
      milestone.status === 'PENDING'
        ? { ...milestone, status: 'PAUSED' as const, pausedAt: this.stamp() }
        : milestone,
    );
    this.pushEvent('EscrowPaused', escrowId, this.nextId('flw_pause'), { reason });
    return this.save({
      ...record,
      milestones,
      disputeOpen: true,
      status: 'PAUSED',
      metadata: { ...record.metadata, pauseReason: reason },
    });
  }

  async resume(escrowId: string): Promise<EscrowRecord> {
    this.assertStrategyAllowed();
    const record = this.require(escrowId);
    const milestones = record.milestones.map((milestone) =>
      milestone.status === 'PAUSED'
        ? { ...milestone, status: 'PENDING' as const, pausedAt: null }
        : milestone,
    );
    this.pushEvent('EscrowResumed', escrowId, this.nextId('flw_resume'), {});
    return this.save({
      ...record,
      milestones,
      disputeOpen: false,
      status: deriveStatus(milestones, false),
    });
  }

  async openDispute(escrowId: string, evidence: DisputeEvidence): Promise<EscrowRecord> {
    this.pushEvent('DisputeOpened', escrowId, this.nextId('flw_dispute'), {
      claimId: evidence.claimId,
      summary: evidence.summary,
    });
    return this.pause(escrowId, evidence.summary);
  }

  async getStatus(escrowId: string): Promise<EscrowRecord> {
    return this.require(escrowId);
  }

  async verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    void rawBody;
    const secretHash = this.client.secretHash;
    if (!secretHash) {
      return { ok: false, reason: 'FLW_SECRET_HASH is not configured.' };
    }
    const raw = headers['verif-hash'] ?? headers['Verif-Hash'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (!provided) {
      return { ok: false, reason: 'Missing verif-hash header.' };
    }
    const left = Buffer.from(provided);
    const right = Buffer.from(secretHash);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return { ok: false, reason: 'Invalid verif-hash.' };
    }
    return { ok: true };
  }

  async parseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<ParsedWebhook> {
    const verified = await this.verifyWebhookSignature(rawBody, headers);
    if (!verified.ok) {
      return { kind: 'ignored', reason: verified.reason };
    }
    let payload: {
      event?: string;
      data?: {
        id?: number;
        tx_ref?: string;
        status?: string;
        amount?: number;
        meta?: { escrowId?: string };
      };
    };
    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      return { kind: 'ignored', reason: 'Invalid JSON body.' };
    }

    const eventName = payload.event ?? '';
    if (eventName !== 'charge.completed') {
      return { kind: 'ignored', reason: `Noise event: ${eventName || 'unknown'}` };
    }
    if (payload.data?.status !== 'successful') {
      return { kind: 'ignored', reason: 'charge.completed without successful status.' };
    }

    const escrowId =
      payload.data.meta?.escrowId ??
      [...this.store.escrows.values()].find(
        (item) => item.externalRefs.txRef === payload.data?.tx_ref,
      )?.id;
    if (!escrowId) {
      return { kind: 'ignored', reason: 'No escrow matched webhook tx_ref.' };
    }

    const providerEventId = `flw_${payload.data.id ?? createHash('sha256').update(rawBody).digest('hex').slice(0, 16)}`;
    if (this.store.seenEvents.has(providerEventId)) {
      return { kind: 'ignored', reason: `Duplicate provider event id: ${providerEventId}` };
    }

    const record = this.require(escrowId);
    this.save({
      ...record,
      externalRefs: {
        ...record.externalRefs,
        providerTxnId: String(payload.data.id ?? ''),
        txRef: payload.data.tx_ref ?? record.externalRefs.txRef ?? '',
      },
    });

    await this.onFunded(escrowId, providerEventId);
    const last = this.store.events[this.store.events.length - 1];
    if (!last) {
      return { kind: 'ignored', reason: 'No event recorded.' };
    }
    return { kind: 'event', event: last };
  }
}

export function adminLedgerHoldWarning(): string {
  return (
    'WARNING: ledger_hold collects payment through Flutterwave and pays vendors later via transfers. ' +
    'Holding customer funds for third parties may be regulated. Enable only with written Flutterwave confirmation ' +
    'and a Nigerian fintech legal opinion. User-facing wording must be lawyer-approved.'
  );
}
