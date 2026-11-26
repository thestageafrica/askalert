import { z } from 'zod';

export const offerStatusSchema = z.enum(['pending', 'accepted', 'declined', 'expired']);
export type OfferStatus = z.infer<typeof offerStatusSchema>;

export const bookingStatusSchema = z.enum([
  'awaiting_payment',
  'paid',
  'cancelled',
  'completed',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export type VendorOfferInput = {
  id: string;
  vendorProfileId: string;
  vendorUserId: string;
  amountMinor: number;
  currency: 'NGN';
  message: string;
  status: OfferStatus;
  /** 0–5 vendor rating when known. */
  vendorRating?: number | null;
  responseMinutes?: number | null;
  createdAt: string;
};

export type QuoteRankContext = {
  budgetMinMinor?: number | null;
  budgetMaxMinor?: number | null;
};

export type RankedOffer = {
  offer: VendorOfferInput;
  rankScore: number;
  reason: string;
};

export function rankOffers(
  offers: VendorOfferInput[],
  context: QuoteRankContext = {},
): RankedOffer[] {
  const pending = offers.filter((offer) => offer.status === 'pending');
  const buyerMin = context.budgetMinMinor ?? 0;
  const buyerMax = context.budgetMaxMinor ?? Number.MAX_SAFE_INTEGER;

  return pending
    .map((offer) => {
      const priceScore = scoreOfferPrice(offer.amountMinor, buyerMin, buyerMax);
      const ratingScore = normalizeRating(offer.vendorRating);
      const speedScore = scoreResponseSpeed(offer.responseMinutes);
      const rankScore = priceScore * 0.45 + ratingScore * 0.35 + speedScore * 0.2;
      const reason = buildReason(offer, priceScore, ratingScore, speedScore);
      return { offer, rankScore, reason };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
}

function scoreOfferPrice(amountMinor: number, min: number, max: number): number {
  if (amountMinor >= min && amountMinor <= max) {
    return 1;
  }
  const distance = amountMinor < min ? min - amountMinor : amountMinor - max;
  const span = Math.max(max - min, 1);
  return Math.max(0, 1 - distance / span);
}

function normalizeRating(rating: number | null | undefined): number {
  if (rating == null || Number.isNaN(rating)) {
    return 0.55;
  }
  return Math.min(1, Math.max(0, rating / 5));
}

function scoreResponseSpeed(responseMinutes: number | null | undefined): number {
  if (responseMinutes == null) {
    return 0.5;
  }
  if (responseMinutes <= 15) {
    return 1;
  }
  if (responseMinutes <= 60) {
    return 0.75;
  }
  if (responseMinutes <= 180) {
    return 0.5;
  }
  return 0.25;
}

function buildReason(
  offer: VendorOfferInput,
  priceScore: number,
  ratingScore: number,
  speedScore: number,
): string {
  if (priceScore >= 0.95 && ratingScore >= 0.7) {
    return 'Strong price and trusted vendor rating.';
  }
  if (priceScore >= 0.9) {
    return 'Best fit for your budget.';
  }
  if (speedScore >= 0.9) {
    return 'Fast reply with a competitive quote.';
  }
  if (ratingScore >= 0.8) {
    return 'Highly rated vendor.';
  }
  return offer.message.trim().slice(0, 80) || 'Solid quote for your request.';
}

export type AcceptOfferInput = {
  offer: VendorOfferInput;
  missionId: string;
  buyerUserId: string;
  now?: Date;
};

export type AcceptOfferResult = {
  booking: {
    missionId: string;
    offerId: string;
    buyerUserId: string;
    vendorProfileId: string;
    vendorUserId: string;
    status: BookingStatus;
    totalMinor: number;
    currency: 'NGN';
    createdAt: string;
  };
  declinedOtherOfferIds: string[];
  userFacingStatus: string;
};

export function acceptOffer(
  offer: VendorOfferInput,
  missionId: string,
  buyerUserId: string,
  allOffers: VendorOfferInput[],
  now: Date = new Date(),
): AcceptOfferResult | { error: string } {
  if (offer.status !== 'pending') {
    return { error: 'Only pending offers can be accepted.' };
  }
  if (offer.currency !== 'NGN') {
    return { error: 'Only NGN offers are supported.' };
  }
  if (!Number.isInteger(offer.amountMinor) || offer.amountMinor < 0) {
    return { error: 'Offer amount must be a non-negative integer in kobo.' };
  }

  const declinedOtherOfferIds = allOffers
    .filter((row) => row.id !== offer.id && row.status === 'pending')
    .map((row) => row.id);

  return {
    booking: {
      missionId,
      offerId: offer.id,
      buyerUserId,
      vendorProfileId: offer.vendorProfileId,
      vendorUserId: offer.vendorUserId,
      status: 'awaiting_payment',
      totalMinor: offer.amountMinor,
      currency: 'NGN',
      createdAt: now.toISOString(),
    },
    declinedOtherOfferIds,
    userFacingStatus: 'Booking created. Complete your staged payment when you are ready.',
  };
}