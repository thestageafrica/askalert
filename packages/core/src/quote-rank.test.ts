import { describe, expect, it } from 'vitest';
import { acceptOffer, rankOffers, type VendorOfferInput } from './quote-rank';

const offers: VendorOfferInput[] = [
  {
    id: 'o1',
    vendorProfileId: 'v1',
    vendorUserId: 'u1',
    amountMinor: 900_000,
    currency: 'NGN',
    message: 'We can do it.',
    status: 'pending',
    vendorRating: 4.5,
    responseMinutes: 10,
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'o2',
    vendorProfileId: 'v2',
    vendorUserId: 'u2',
    amountMinor: 1_500_000,
    currency: 'NGN',
    message: 'Premium package.',
    status: 'pending',
    vendorRating: 3,
    responseMinutes: 90,
    createdAt: '2026-11-01T10:05:00.000Z',
  },
];

describe('quote rank', () => {
  it('ranks cheaper in-budget offers higher', () => {
    const ranked = rankOffers(offers, {
      budgetMinMinor: 500_000,
      budgetMaxMinor: 1_200_000,
    });
    expect(ranked[0]?.offer.id).toBe('o1');
    expect(ranked[0]?.reason.length).toBeGreaterThan(0);
  });

  it('creates booking awaiting payment on accept', () => {
    const result = acceptOffer(offers[0]!, 'm1', 'buyer-1', offers);
    expect('booking' in result).toBe(true);
    if ('booking' in result) {
      expect(result.booking.status).toBe('awaiting_payment');
      expect(result.userFacingStatus.toLowerCase()).toMatch(/payment/);
      expect(result.userFacingStatus.toLowerCase()).not.toMatch(/escrow/);
      expect(result.declinedOtherOfferIds).toEqual(['o2']);
    }
  });
});