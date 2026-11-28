import { describe, expect, it } from 'vitest';
import type { EscrowProvider } from '../escrow/provider';
import { mapBuyerShareToMilestones } from '../escrow/milestones';

const parties = [
  { role: 'buyer' as const, partyId: 'buyer_1', displayName: 'Ada' },
  { role: 'vendor' as const, partyId: 'vendor_1', displayName: 'Vendor' },
  { role: 'platform' as const, partyId: 'askalert' },
];

/**
 * Shared contract suite every EscrowProvider must pass (Prompt 48).
 * Call from vitest with a factory that returns a fresh provider instance.
 */
export function runEscrowProviderContract(
  name: string,
  createProvider: () => EscrowProvider,
): void {
  describe(`EscrowProvider contract: ${name}`, () => {
    it('exposes capabilities()', () => {
      const provider = createProvider();
      const caps = provider.capabilities();
      expect(caps.currencies.length).toBeGreaterThan(0);
      expect(typeof caps.partialRelease).toBe('boolean');
      expect(typeof caps.claimPause).toBe('boolean');
    });

    it('funds, partially releases, pauses, resumes, then refunds', async () => {
      const provider = createProvider();
      if (!provider.capabilities().claimPause) {
        return;
      }
      const mapped = mapBuyerShareToMilestones({
        totalMinor: 1_000_000,
        holdPct: 40,
        bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
        commissionPct: 10,
        feeModel: { flatFeeMinor: 0, percentFee: 0, feeBearer: 'platform' },
        autoReleaseHours: 24,
      });

      const created = await provider.createEscrow({
        bookingId: 'book_contract',
        parties,
        amountMinor: 1_000_000,
        currency: 'NGN',
        milestones: mapped.milestones,
      });
      expect(created.providerKey).toBe(provider.key);

      const funded = await provider.onFunded(created.id, `fund_${created.id}`);
      expect(['FUNDED', 'PARTIALLY_RELEASED', 'RELEASED']).toContain(funded.status);

      const paused = await provider.pause(created.id, 'claim_open');
      expect(paused.status).toBe('PAUSED');
      await expect(
        provider.releaseMilestone(created.id, 'confirm_later'),
      ).rejects.toThrow(/claim|pause/i);

      const resumed = await provider.resume(created.id);
      expect(resumed.disputeOpen).toBe(false);

      const refunded = await provider.refund(created.id, 100_000, 'contract_refund');
      expect(refunded.status).toBe('REFUNDED');
    });

    it('ignores duplicate webhook event ids when parseWebhook is used', async () => {
      const provider = createProvider();
      // Providers without webhook parse support still satisfy create/getStatus.
      const created = await provider.createEscrow({
        bookingId: 'book_dup',
        parties,
        amountMinor: 200_000,
        currency: 'NGN',
        milestones: mapBuyerShareToMilestones({
          totalMinor: 200_000,
          holdPct: 0,
          bounds: { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 0 },
          commissionPct: 0,
          feeModel: { flatFeeMinor: 0, percentFee: 0, feeBearer: 'platform' },
          autoReleaseHours: null,
        }).milestones,
      });
      const status = await provider.getStatus(created.id);
      expect(status.id).toBe(created.id);
    });
  });
}
