import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  COMING_SOON_COPY,
  MockEscrowProvider,
  PartnerEscrowProvider,
  assertEscrowCopyAllowed,
  canUseEscrowWording,
  lintEscrowCopy,
  loadEscrowRuntimeConfig,
  mapBuyerShareToMilestones,
  mirrorEscrowEventToLedger,
  presentCheckoutEscrow,
  summariseLedger,
} from '../index';

const parties = [
  { role: 'buyer' as const, partyId: 'buyer_1', displayName: 'Ada' },
  { role: 'vendor' as const, partyId: 'vendor_1', displayName: 'Lekki Catering' },
  { role: 'platform' as const, partyId: 'askalert' },
];

describe('mapBuyerShareToMilestones', () => {
  it('maps a 40% later-release share into pay_now and confirm_later', () => {
    const mapped = mapBuyerShareToMilestones({
      totalMinor: 12_850_000,
      holdPct: 40,
      bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
      commissionPct: 12,
      feeModel: { flatFeeMinor: 160_000, percentFee: 0, feeBearer: 'vendor' },
      autoReleaseHours: 72,
    });

    expect(mapped.split.releasedNowMinor).toBe(6_688_800);
    expect(mapped.split.heldMinor).toBe(4_459_200);
    expect(mapped.milestones).toHaveLength(2);
    expect(mapped.milestones[0]?.kind).toBe('pay_now');
    expect(mapped.milestones[1]?.kind).toBe('confirm_later');
    expect(mapped.milestones[1]?.autoReleaseHours).toBe(72);
  });
});

describe('MockEscrowProvider state machine', () => {
  it('runs create → fund → partial release → dispute pause → refund', async () => {
    const provider = new MockEscrowProvider({ delayMs: 0 });
    const mapped = mapBuyerShareToMilestones({
      totalMinor: 1_000_000,
      holdPct: 50,
      bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
      commissionPct: 10,
      feeModel: { flatFeeMinor: 0, percentFee: 0, feeBearer: 'platform' },
      autoReleaseHours: 48,
    });

    const created = await provider.createEscrow({
      bookingId: 'book_1',
      parties,
      amountMinor: 1_000_000,
      currency: 'NGN',
      milestones: mapped.milestones,
    });
    expect(created.status).toBe('AWAITING_FUNDS');
    expect(created.sandbox).toBe(true);
    expect(created.externalRefs.sandboxLabel).toBe('SANDBOX');

    const funding = await provider.getFundingInstructions(created.id);
    expect(funding.label).toBe('SANDBOX');
    expect(funding.paymentLink).toContain(created.id);

    const funded = await provider.onFunded(created.id, 'evt_fund_1');
    expect(funded.status).toBe('PARTIALLY_RELEASED');
    expect(funded.milestones.find((item) => item.kind === 'pay_now')?.status).toBe('RELEASED');
    expect(funded.milestones.find((item) => item.kind === 'confirm_later')?.status).toBe(
      'PENDING',
    );

    const disputed = await provider.openDispute(created.id, {
      claimId: 'claim_1',
      summary: 'Food was late',
    });
    expect(disputed.status).toBe('PAUSED');
    await expect(provider.releaseMilestone(created.id, 'confirm_later')).rejects.toThrow(
      /claim is open/i,
    );

    const refunded = await provider.refund(created.id, 500_000, 'claim_upheld');
    expect(refunded.status).toBe('REFUNDED');
  });

  it('is idempotent for duplicate funded webhooks', async () => {
    const provider = new MockEscrowProvider({ delayMs: 0 });
    const mapped = mapBuyerShareToMilestones({
      totalMinor: 500_000,
      holdPct: 0,
      bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
      commissionPct: 10,
      feeModel: { flatFeeMinor: 0, percentFee: 0, feeBearer: 'platform' },
      autoReleaseHours: null,
    });

    const created = await provider.createEscrow({
      bookingId: 'book_2',
      parties,
      amountMinor: 500_000,
      currency: 'NGN',
      milestones: mapped.milestones,
    });

    const body = JSON.stringify({
      type: 'funded',
      escrowId: created.id,
      providerEventId: 'dup_1',
    });
    const signature = provider.signWebhookBody(body);
    const headers = { 'x-mock-escrow-signature': signature };

    const first = await provider.parseWebhook(body, headers);
    expect(first.kind).toBe('event');

    const second = await provider.parseWebhook(body, headers);
    expect(second.kind).toBe('ignored');
    if (second.kind === 'ignored') {
      expect(second.reason).toMatch(/duplicate/i);
    }

    const status = await provider.getStatus(created.id);
    expect(status.status).toBe('RELEASED');
  });

  it('rejects invalid webhook signatures', async () => {
    const provider = new MockEscrowProvider({ delayMs: 0 });
    const result = await provider.verifyWebhookSignature('{}', {
      'x-mock-escrow-signature': 'nope',
    });
    expect(result.ok).toBe(false);
  });
});

describe('ledger mirroring', () => {
  it('keeps debits equal to credits and never books AskAlert cash', async () => {
    const provider = new MockEscrowProvider({ delayMs: 0 });
    const mapped = mapBuyerShareToMilestones({
      totalMinor: 200_000,
      holdPct: 50,
      bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
      commissionPct: 0,
      feeModel: { flatFeeMinor: 0, percentFee: 0, feeBearer: 'platform' },
      autoReleaseHours: 24,
    });
    const created = await provider.createEscrow({
      bookingId: 'book_3',
      parties,
      amountMinor: 200_000,
      currency: 'NGN',
      milestones: mapped.milestones,
    });
    await provider.onFunded(created.id, 'fund_led');
    const record = await provider.getStatus(created.id);
    const events = provider.listEvents().filter((event) => event.escrowId === record.id);
    const entries = events.flatMap((event) => mirrorEscrowEventToLedger(record, event));
    const snapshot = summariseLedger(entries);
    expect(snapshot.balanceMinor).toBe(0);
    expect(entries.every((entry) => entry.account !== ('askalert_cash' as never))).toBe(true);
  });
});

describe('feature flag and copy rules', () => {
  it('defaults escrow to off and shows coming soon', () => {
    const config = loadEscrowRuntimeConfig({
      escrowEnabled: false,
      sandbox: true,
      partner: {
        legalName: '',
        licenceNumber: '',
        licenceIssuer: '',
        institutionName: '',
      },
    });
    expect(canUseEscrowWording(config)).toBe(false);
    const presentation = presentCheckoutEscrow(config);
    expect(presentation.mode).toBe('coming_soon');
    expect(presentation.title).toBe(COMING_SOON_COPY);
    expect(presentation.acceptPayment).toBe(false);
  });

  it('shows SANDBOX when enabled in sandbox', () => {
    const presentation = presentCheckoutEscrow(
      loadEscrowRuntimeConfig({
        escrowEnabled: true,
        sandbox: true,
        providerKey: 'mock',
      }),
    );
    expect(presentation.mode).toBe('sandbox');
    expect(presentation.banner).toBe('SANDBOX');
    expect(presentation.acceptPayment).toBe(true);
  });

  it('fails copy-lint for banned hold claims while the flag is off', () => {
    const config = loadEscrowRuntimeConfig({ escrowEnabled: false });
    const bad = lintEscrowCopy('AskAlert holds your money in safekeeping.', config);
    expect(bad.ok).toBe(false);
    expect(() =>
      assertEscrowCopyAllowed('Protected by AskAlert while we hold payment.', config),
    ).toThrow(/copy lint failed/i);

    const ok = lintEscrowCopy(COMING_SOON_COPY, config);
    expect(ok.ok).toBe(true);
  });

  it('allows escrow wording only with live flag and complete partner details', () => {
    const config = loadEscrowRuntimeConfig({
      escrowEnabled: true,
      sandbox: false,
      partner: {
        legalName: 'Example Escrow Ltd',
        licenceNumber: 'LIC-1',
        licenceIssuer: 'CBN',
        institutionName: 'Example MFB',
      },
    });
    expect(canUseEscrowWording(config)).toBe(true);
    expect(lintEscrowCopy('Escrow via Example Escrow Ltd.', config).ok).toBe(true);
  });
});

describe('PartnerEscrowProvider skeleton', () => {
  it('throws clear TODOs until the partner API is wired', async () => {
    const partner = new PartnerEscrowProvider({ apiKey: undefined });
    await expect(
      partner.createEscrow({
        bookingId: 'x',
        parties,
        amountMinor: 100,
        currency: 'NGN',
        milestones: [
          {
            id: 'pay_now',
            kind: 'pay_now',
            amountMinor: 100,
            currency: 'NGN',
            label: 'Pay now',
          },
        ],
      }),
    ).rejects.toThrow(/not implemented/i);
  });
});

describe('webhook signature helper', () => {
  it('matches sha256(secret.body)', () => {
    const secret = 'mock-escrow-webhook-secret';
    const body = '{"ok":true}';
    const provider = new MockEscrowProvider({ webhookSecret: secret, delayMs: 0 });
    const expected = createHash('sha256').update(`${secret}.${body}`).digest('hex');
    expect(provider.signWebhookBody(body)).toBe(expected);
  });
});
