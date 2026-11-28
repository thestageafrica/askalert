import { createHash, timingSafeEqual } from 'node:crypto';
import { MOCK_ESCROW_CAPABILITIES, type EscrowCapabilities } from './capabilities';
import type { EscrowProvider } from './provider';
import {
  createEscrowInputSchema,
  type CreateEscrowInput,
  type DisputeEvidence,
  type EscrowEvent,
  type EscrowMilestone,
  type EscrowRecord,
  type EscrowStatus,
  type FundingInstructions,
  type ParsedWebhook,
  type WebhookVerificationResult,
} from './types';

export type MockEscrowProviderOptions = {
  /** Simulated delay before async partner actions settle (ms). Default 25 for tests. */
  delayMs?: number;
  webhookSecret?: string;
  now?: () => Date;
};

type MockStore = {
  escrows: Map<string, EscrowRecord>;
  seenEvents: Set<string>;
  events: EscrowEvent[];
};

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function deriveStatus(milestones: EscrowMilestone[], disputeOpen: boolean): EscrowStatus {
  if (disputeOpen) {
    return 'PAUSED';
  }
  const pending = milestones.filter((item) => item.status === 'PENDING' || item.status === 'PAUSED');
  const released = milestones.filter((item) => item.status === 'RELEASED');
  const refunded = milestones.filter((item) => item.status === 'REFUNDED');
  if (refunded.length === milestones.length) {
    return 'REFUNDED';
  }
  if (released.length === milestones.length) {
    return 'RELEASED';
  }
  if (released.length > 0 && pending.length > 0) {
    return 'PARTIALLY_RELEASED';
  }
  return 'FUNDED';
}

/**
 * In-memory sandbox escrow partner. Every surface should show the SANDBOX label.
 */
export class MockEscrowProvider implements EscrowProvider {
  readonly key = 'mock';
  readonly sandbox = true;

  private readonly delayMs: number;
  private readonly webhookSecret: string;
  private readonly now: () => Date;
  private readonly store: MockStore = {
    escrows: new Map(),
    seenEvents: new Set(),
    events: [],
  };
  private seq = 0;

  constructor(options: MockEscrowProviderOptions = {}) {
    this.delayMs = options.delayMs ?? 25;
    this.webhookSecret = options.webhookSecret ?? 'mock-escrow-webhook-secret';
    this.now = options.now ?? (() => new Date());
  }

  /** Test helper: inspect recorded normalised events. */
  listEvents(): EscrowEvent[] {
    return [...this.store.events];
  }

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}_${this.now().getTime()}`;
  }

  private stamp(): string {
    return this.now().toISOString();
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

  capabilities(): EscrowCapabilities {
    return MOCK_ESCROW_CAPABILITIES;
  }

  async createEscrow(input: CreateEscrowInput): Promise<EscrowRecord> {
    const parsed = createEscrowInputSchema.parse(input);
    const milestoneSum = parsed.milestones.reduce((sum, item) => sum + item.amountMinor, 0);
    if (milestoneSum > parsed.amountMinor) {
      throw new Error('Milestone amounts cannot exceed the escrow total.');
    }

    await sleep(this.delayMs);

    const createdAt = this.stamp();
    const record: EscrowRecord = {
      id: this.nextId('esc_mock'),
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
      sandbox: true,
      providerKey: this.key,
      createdAt,
      updatedAt: createdAt,
      fundedAt: null,
      disputeOpen: false,
      externalRefs: {
        sandboxLabel: 'SANDBOX',
      },
      metadata: parsed.metadata ?? {},
    };

    this.pushEvent('EscrowCreated', record.id, `mock_create_${record.id}`, {
      bookingId: record.bookingId,
      amountMinor: record.amountMinor,
    });

    return this.save(record);
  }

  async getFundingInstructions(escrowId: string): Promise<FundingInstructions> {
    const record = this.require(escrowId);
    if (record.status !== 'AWAITING_FUNDS' && record.status !== 'CREATED') {
      throw new Error(`Funding instructions unavailable for status ${record.status}.`);
    }
    await sleep(this.delayMs);
    return {
      escrowId: record.id,
      sandbox: true,
      label: 'SANDBOX',
      method: 'payment_link',
      reference: `SANDBOX-${record.id}`,
      paymentLink: `https://sandbox.askalert.local/pay/${record.id}`,
      accountName: 'AskAlert SANDBOX Mock Partner',
      accountNumber: '0000000000',
      bankName: 'Sandbox Test Bank',
      currency: record.currency,
      amountMinor: record.amountMinor,
      expiresAt: new Date(this.now().getTime() + 30 * 60 * 1000).toISOString(),
    };
  }

  async onFunded(escrowId: string, providerEventId: string): Promise<EscrowRecord> {
    const record = this.require(escrowId);
    await sleep(this.delayMs);

    if (record.status === 'FUNDED' || record.status === 'PARTIALLY_RELEASED' || record.status === 'RELEASED') {
      return record;
    }
    if (record.status !== 'AWAITING_FUNDS' && record.status !== 'CREATED') {
      throw new Error(`Cannot fund escrow in status ${record.status}.`);
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

    // Auto-release the pay_now share when funding is confirmed.
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
    if (record.status === 'AWAITING_FUNDS' || record.status === 'CREATED') {
      throw new Error('Cannot release before funding.');
    }

    const milestones = record.milestones.map((milestone) => {
      if (milestone.id !== milestoneId) {
        return milestone;
      }
      if (milestone.status === 'RELEASED') {
        return milestone;
      }
      if (milestone.status === 'PAUSED') {
        throw new Error(`Milestone ${milestoneId} is paused.`);
      }
      return {
        ...milestone,
        status: 'RELEASED' as const,
        releasedAt: this.stamp(),
        pausedAt: null,
      };
    });

    const target = milestones.find((item) => item.id === milestoneId);
    if (!target) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }

    this.pushEvent('MilestoneReleased', record.id, providerEventId, {
      milestoneId,
      amountMinor: target.amountMinor,
    });

    return {
      ...record,
      milestones,
      status: deriveStatus(milestones, false),
      disputeOpen: false,
    };
  }

  async releaseMilestone(escrowId: string, milestoneId: string): Promise<EscrowRecord> {
    const record = this.require(escrowId);
    await sleep(this.delayMs);
    const next = await this.releaseMilestoneInternal(
      record,
      milestoneId,
      this.nextId(`mock_release_${milestoneId}`),
    );
    return this.save(next);
  }

  async releaseAll(escrowId: string): Promise<EscrowRecord> {
    let record = this.require(escrowId);
    await sleep(this.delayMs);
    for (const milestone of record.milestones) {
      if (milestone.status === 'PENDING') {
        record = await this.releaseMilestoneInternal(
          record,
          milestone.id,
          this.nextId(`mock_release_all_${milestone.id}`),
        );
      }
    }
    return this.save(record);
  }

  async refund(escrowId: string, amountMinor: number, reason: string): Promise<EscrowRecord> {
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new Error('Refund amount must be a positive integer in kobo.');
    }
    const record = this.require(escrowId);
    await sleep(this.delayMs);

    if (amountMinor > record.amountMinor) {
      throw new Error('Refund cannot exceed the escrow total.');
    }

    this.pushEvent('RefundCompleted', escrowId, this.nextId('mock_refund'), {
      amountMinor,
      reason,
    });

    const milestones = record.milestones.map((milestone) =>
      milestone.status === 'PENDING' || milestone.status === 'PAUSED'
        ? {
            ...milestone,
            status: 'REFUNDED' as const,
            pausedAt: null,
          }
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
    const record = this.require(escrowId);
    await sleep(this.delayMs);
    const milestones = record.milestones.map((milestone) =>
      milestone.status === 'PENDING'
        ? {
            ...milestone,
            status: 'PAUSED' as const,
            pausedAt: this.stamp(),
          }
        : milestone,
    );
    this.pushEvent('EscrowPaused', escrowId, this.nextId('mock_pause'), { reason });
    return this.save({
      ...record,
      milestones,
      disputeOpen: true,
      status: 'PAUSED',
      metadata: { ...record.metadata, pauseReason: reason },
    });
  }

  async resume(escrowId: string): Promise<EscrowRecord> {
    const record = this.require(escrowId);
    await sleep(this.delayMs);
    const milestones = record.milestones.map((milestone) =>
      milestone.status === 'PAUSED'
        ? {
            ...milestone,
            status: 'PENDING' as const,
            pausedAt: null,
          }
        : milestone,
    );
    this.pushEvent('EscrowResumed', escrowId, this.nextId('mock_resume'), {});
    return this.save({
      ...record,
      milestones,
      disputeOpen: false,
      status: deriveStatus(milestones, false),
      metadata: { ...record.metadata, pauseReason: '' },
    });
  }

  async openDispute(escrowId: string, evidence: DisputeEvidence): Promise<EscrowRecord> {
    this.pushEvent('DisputeOpened', escrowId, this.nextId('mock_dispute'), {
      claimId: evidence.claimId,
      summary: evidence.summary,
    });
    const paused = await this.pause(escrowId, evidence.summary);
    return this.save({
      ...paused,
      metadata: {
        ...paused.metadata,
        openClaimId: evidence.claimId,
      },
    });
  }

  async getStatus(escrowId: string): Promise<EscrowRecord> {
    return this.require(escrowId);
  }

  async verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    const signature = headerValue(headers, 'x-mock-escrow-signature');
    if (!signature) {
      return { ok: false, reason: 'Missing x-mock-escrow-signature header.' };
    }
    const expected = createHash('sha256')
      .update(`${this.webhookSecret}.${rawBody}`)
      .digest('hex');
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return { ok: false, reason: 'Invalid webhook signature.' };
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
      type?: string;
      escrowId?: string;
      providerEventId?: string;
      milestoneId?: string;
      amountMinor?: number;
      reason?: string;
    };
    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      return { kind: 'ignored', reason: 'Invalid JSON body.' };
    }

    if (!payload.type || !payload.escrowId || !payload.providerEventId) {
      return { kind: 'ignored', reason: 'Missing type, escrowId or providerEventId.' };
    }

    if (this.store.seenEvents.has(payload.providerEventId)) {
      return { kind: 'ignored', reason: `Duplicate provider event id: ${payload.providerEventId}` };
    }

    switch (payload.type) {
      case 'funded':
        await this.onFunded(payload.escrowId, payload.providerEventId);
        break;
      case 'release_milestone':
        if (!payload.milestoneId) {
          return { kind: 'ignored', reason: 'milestoneId required.' };
        }
        await this.releaseMilestone(payload.escrowId, payload.milestoneId);
        break;
      case 'refund':
        await this.refund(
          payload.escrowId,
          payload.amountMinor ?? 0,
          payload.reason ?? 'webhook_refund',
        );
        break;
      default:
        return { kind: 'ignored', reason: `Unknown webhook type: ${payload.type}` };
    }

    const last = this.store.events[this.store.events.length - 1];
    if (!last) {
      return { kind: 'ignored', reason: 'No event recorded.' };
    }
    return { kind: 'event', event: last };
  }

  /** Helper for tests and the sandbox UI: sign a mock webhook body. */
  signWebhookBody(rawBody: string): string {
    return createHash('sha256').update(`${this.webhookSecret}.${rawBody}`).digest('hex');
  }
}
