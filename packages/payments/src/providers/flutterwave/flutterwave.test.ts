import { describe, expect, it, vi } from 'vitest';
import {
  EscrowProviderRegistry,
  FlutterwaveClient,
  FlutterwaveDirectProvider,
  FlutterwaveEscrowProvider,
  MockEscrowProvider,
  ProviderOutbox,
  adminLedgerHoldWarning,
  flutterwaveMajorToMinor,
  minorToFlutterwaveMajor,
  runEscrowProviderContract,
  verifyFlutterwaveVerifHash,
} from '../../index';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Flutterwave money boundary', () => {
  it('converts kobo to major units for the v3 API', () => {
    expect(minorToFlutterwaveMajor(12_850_000, 'NGN')).toBe(128_500);
    expect(flutterwaveMajorToMinor(128_500, 'NGN')).toBe(12_850_000);
  });
});

describe('FlutterwaveDirectProvider', () => {
  it('initiates checkout and verifies before treating as paid', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/payments') && init?.method === 'POST') {
        return jsonResponse({
          status: 'success',
          message: 'ok',
          data: { link: 'https://checkout.flutterwave.com/v3/hosted/pay/test' },
        });
      }
      if (url.includes('/transactions/') && url.endsWith('/verify')) {
        return jsonResponse({
          status: 'success',
          message: 'ok',
          data: {
            id: 42,
            tx_ref: 'tx_1',
            flw_ref: 'FLW_REF',
            status: 'successful',
            amount: 1000,
            currency: 'NGN',
            charged_amount: 1000,
            customer: { email: 'buyer@example.com' },
            payment_type: 'card',
          },
        });
      }
      return jsonResponse({ status: 'error', message: `unexpected ${url}` }, 500);
    });

    const client = new FlutterwaveClient({
      secretKey: 'FLWSECK_TEST-fake',
      fetchImpl: fetchImpl as typeof fetch,
    });
    const provider = new FlutterwaveDirectProvider(client);

    const checkout = await provider.initiateCheckout({
      amount: { amountMinor: 100_000, currency: 'NGN' },
      txRef: 'tx_1',
      redirectUrl: 'https://www.askalert.com/app/',
      customer: { email: 'buyer@example.com' },
      subaccounts: [{ subaccountId: 'RS_TEST' }],
    });
    expect(checkout.checkoutUrl).toContain('flutterwave.com');
    expect(checkout.sandbox).toBe(true);

    const verified = await provider.verifyTransaction({
      providerTxnId: '42',
      expectedTxRef: 'tx_1',
      expectedAmountMinor: 100_000,
      expectedCurrency: 'NGN',
    });
    expect(verified.verified).toBe(true);
    expect(verified.amount.amountMinor).toBe(100_000);
  });

  it('rejects USD when not enabled', async () => {
    const client = new FlutterwaveClient({
      secretKey: 'FLWSECK_TEST-fake',
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const provider = new FlutterwaveDirectProvider(client, { usdEnabled: false });
    await expect(
      provider.initiateCheckout({
        amount: { amountMinor: 100, currency: 'USD' },
        txRef: 'usd_1',
        redirectUrl: 'https://www.askalert.com/',
        customer: { email: 'a@b.com' },
      }),
    ).rejects.toThrow(/USD is not enabled/i);
  });
});

describe('FlutterwaveEscrowProvider gates', () => {
  it('keeps ledger_hold off without confirmation + legal opinion', async () => {
    const client = new FlutterwaveClient({
      secretKey: 'FLWSECK_TEST-fake',
      secretHash: 'hash',
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const direct = new FlutterwaveDirectProvider(client);
    const escrow = new FlutterwaveEscrowProvider({
      strategy: 'ledger_hold',
      strategyEnabled: true,
      gates: { flutterwaveHoldConfirmed: false, legalOpinionOnFile: false },
      direct,
      client,
    });
    await expect(
      escrow.createEscrow({
        bookingId: 'b',
        parties: [
          { role: 'buyer', partyId: 'b1' },
          { role: 'vendor', partyId: 'v1' },
        ],
        amountMinor: 1000,
        currency: 'NGN',
        milestones: [
          {
            id: 'pay_now',
            kind: 'pay_now',
            amountMinor: 1000,
            currency: 'NGN',
            label: 'now',
          },
        ],
      }),
    ).rejects.toThrow(/flutterwave_hold_confirmed/i);
    expect(adminLedgerHoldWarning()).toMatch(/WARNING/i);
  });

  it('refuses native strategy until Flutterwave docs are pasted', async () => {
    const client = new FlutterwaveClient({
      secretKey: 'FLWSECK_TEST-fake',
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const escrow = new FlutterwaveEscrowProvider({
      strategy: 'native',
      strategyEnabled: true,
      gates: { flutterwaveHoldConfirmed: true, legalOpinionOnFile: true },
      direct: new FlutterwaveDirectProvider(client),
      client,
    });
    await expect(
      escrow.createEscrow({
        bookingId: 'b',
        parties: [
          { role: 'buyer', partyId: 'b1' },
          { role: 'vendor', partyId: 'v1' },
        ],
        amountMinor: 1000,
        currency: 'NGN',
        milestones: [
          {
            id: 'pay_now',
            kind: 'pay_now',
            amountMinor: 1000,
            currency: 'NGN',
            label: 'now',
          },
        ],
      }),
    ).rejects.toThrow(/native hold/i);
  });
});

describe('registry routing', () => {
  it('pins in-flight escrows and respects kill switch for new ones', () => {
    const registry = new EscrowProviderRegistry();
    registry.registerFactory('mock', () => new MockEscrowProvider({ delayMs: 0 }));
    const first = registry.resolveForNewEscrow('events');
    expect(first.key).toBe('mock');

    registry.updateConfig({
      providers: registry.listProviders().map((item) =>
        item.key === 'mock' ? { ...item, killSwitch: true } : item,
      ),
    });
    expect(() => registry.resolveForNewEscrow('events')).toThrow(/kill switch/i);
    expect(registry.getPinnedProvider('mock').key).toBe('mock');
  });
});

describe('webhook verif-hash', () => {
  it('accepts matching secret hash', () => {
    expect(verifyFlutterwaveVerifHash('secret', 'secret')).toBe(true);
    expect(verifyFlutterwaveVerifHash('secret', 'nope')).toBe(false);
  });
});

describe('outbox', () => {
  it('retries then dead-letters', () => {
    const outbox = new ProviderOutbox();
    const item = outbox.enqueue({
      providerKey: 'flutterwave',
      idempotencyKey: 'idem_1',
      operation: 'transfer',
      payload: { amountMinor: 100 },
    });
    for (let i = 0; i < 5; i += 1) {
      outbox.markFailure(item.id, 'upstream');
    }
    expect(outbox.listDeadLetters()).toHaveLength(1);
  });
});

runEscrowProviderContract('mock', () => new MockEscrowProvider({ delayMs: 0 }));

runEscrowProviderContract('flutterwave ledger_hold (sandbox, gated on)', () => {
  const client = new FlutterwaveClient({
    secretKey: 'FLWSECK_TEST-fake',
    secretHash: 'hash',
    fetchImpl: vi.fn(async () =>
      jsonResponse({ status: 'success', message: 'ok', data: {} }),
    ) as unknown as typeof fetch,
  });
  return new FlutterwaveEscrowProvider({
    strategy: 'ledger_hold',
    strategyEnabled: true,
    gates: {
      flutterwaveHoldConfirmed: true,
      legalOpinionOnFile: true,
      flutterwaveHoldConfirmedAt: '2026-11-28',
      flutterwaveHoldConfirmedRef: 'TEST-ONLY',
    },
    direct: new FlutterwaveDirectProvider(client),
    client,
  });
});
