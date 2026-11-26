import { z } from 'zod';

export const MIN_MATCHED_VENDORS = 2;

export const rankingWeightsSchema = z
  .object({
    price: z.number().min(0).max(1),
    rating: z.number().min(0).max(1),
    response_speed: z.number().min(0).max(1),
    proximity: z.number().min(0).max(1),
    fit: z.number().min(0).max(1),
  })
  .strict();

export type RankingWeights = z.infer<typeof rankingWeightsSchema>;

export const vendorVerificationTierSchema = z.enum(['phone', 'id', 'business', 'trusted']);
export type VendorVerificationTier = z.infer<typeof vendorVerificationTierSchema>;

export const vendorProfileStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'suspended',
]);
export type VendorProfileStatus = z.infer<typeof vendorProfileStatusSchema>;

export type VendorRateCardSlice = {
  categorySlug: string;
  startingPriceMinor: number;
  minPriceMinor: number;
  maxPriceMinor: number;
};

export type VendorMatchProfile = {
  vendorProfileId: string;
  vendorUserId: string;
  status: VendorProfileStatus;
  categorySlugs: string[];
  areaSlugs: string[];
  verificationTiers: VendorVerificationTier[];
  blackoutDates: string[];
  /** 0–5 when known. */
  rating: number | null;
  /** 0–1 response speed score from lead history. */
  responseSpeedScore: number;
  /** 0–1 proximity (precomputed for the request area). */
  proximityScore: number;
  /** 0–1 optional attribute fit. */
  fitScore: number;
  rateCard: VendorRateCardSlice | null;
};

export type BuyerMatchRequest = {
  categorySlug: string;
  areaSlug: string;
  /** ISO date (YYYY-MM-DD) when the service is needed. */
  serviceDate?: string | null;
  capacity?: number | null;
  budgetMinMinor?: number | null;
  budgetMaxMinor?: number | null;
  minVerificationTier?: VendorVerificationTier | null;
};

export type CategoryMatchingConfig = {
  slug: string;
  max_vendors_per_mission: number;
  response_deadline_minutes: number;
  ranking_weights: RankingWeights;
};

export type MatchScoreBreakdown = {
  price: number;
  rating: number;
  response_speed: number;
  proximity: number;
  fit: number;
  total: number;
};

export type RankedVendorMatch = {
  vendor: VendorMatchProfile;
  score: MatchScoreBreakdown;
};

const TIER_RANK: Record<VendorVerificationTier, number> = {
  phone: 1,
  id: 2,
  business: 3,
  trusted: 4,
};

export function minimumVendorsRequired(topN: number): number {
  if (topN >= MIN_MATCHED_VENDORS) {
    return Math.min(3, topN);
  }
  return MIN_MATCHED_VENDORS;
}

export function resolveTopN(
  vendorsPerRequest: number | undefined,
  categoryMax: number,
): number {
  const planCap = vendorsPerRequest ?? categoryMax;
  return Math.max(1, Math.min(planCap, categoryMax));
}

export function passesHardFilters(
  vendor: VendorMatchProfile,
  request: BuyerMatchRequest,
): boolean {
  if (vendor.status !== 'approved') {
    return false;
  }
  if (!vendor.categorySlugs.includes(request.categorySlug)) {
    return false;
  }
  if (!vendor.areaSlugs.includes(request.areaSlug)) {
    return false;
  }
  if (request.minVerificationTier && !meetsVerificationTier(vendor, request.minVerificationTier)) {
    return false;
  }
  if (request.serviceDate && vendor.blackoutDates.includes(request.serviceDate)) {
    return false;
  }
  if (!budgetOverlaps(vendor.rateCard, request)) {
    return false;
  }
  return true;
}

function meetsVerificationTier(
  vendor: VendorMatchProfile,
  required: VendorVerificationTier,
): boolean {
  const need = TIER_RANK[required];
  return vendor.verificationTiers.some((tier) => TIER_RANK[tier] >= need);
}

function budgetOverlaps(
  rateCard: VendorRateCardSlice | null,
  request: BuyerMatchRequest,
): boolean {
  const buyerMin = request.budgetMinMinor ?? 0;
  const buyerMax = request.budgetMaxMinor ?? Number.MAX_SAFE_INTEGER;
  if (buyerMax < buyerMin) {
    return false;
  }
  if (!rateCard) {
    return buyerMax > 0;
  }
  return rateCard.maxPriceMinor >= buyerMin && rateCard.minPriceMinor <= buyerMax;
}

export function scoreVendorMatch(
  vendor: VendorMatchProfile,
  request: BuyerMatchRequest,
  weights: RankingWeights,
): MatchScoreBreakdown {
  const price = scorePriceFit(vendor.rateCard, request);
  const rating = normalizeRating(vendor.rating);
  const response_speed = clamp01(vendor.responseSpeedScore);
  const proximity = clamp01(vendor.proximityScore);
  const fit = clamp01(vendor.fitScore);

  const total =
    weights.price * price +
    weights.rating * rating +
    weights.response_speed * response_speed +
    weights.proximity * proximity +
    weights.fit * fit;

  return { price, rating, response_speed, proximity, fit, total };
}

function scorePriceFit(
  rateCard: VendorRateCardSlice | null,
  request: BuyerMatchRequest,
): number {
  if (!rateCard) {
    return 0.5;
  }
  const buyerMin = request.budgetMinMinor ?? rateCard.minPriceMinor;
  const buyerMax = request.budgetMaxMinor ?? rateCard.maxPriceMinor;
  const target = Math.round((buyerMin + buyerMax) / 2);
  const quote = rateCard.startingPriceMinor;
  if (quote <= buyerMax && quote >= buyerMin) {
    return 1;
  }
  const span = Math.max(buyerMax - buyerMin, rateCard.maxPriceMinor - rateCard.minPriceMinor, 1);
  const distance = quote < buyerMin ? buyerMin - quote : quote - buyerMax;
  return clamp01(1 - distance / span);
}

function normalizeRating(rating: number | null): number {
  if (rating == null || Number.isNaN(rating)) {
    return 0.6;
  }
  return clamp01(rating / 5);
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export type MatchVendorsInput = {
  vendors: VendorMatchProfile[];
  request: BuyerMatchRequest;
  category: CategoryMatchingConfig;
  vendorsPerRequest?: number;
};

export type MatchVendorsResult = {
  topN: number;
  minimumRequired: number;
  ranked: RankedVendorMatch[];
  filteredCount: number;
  unmetDemand: boolean;
};

export function matchVendors(input: MatchVendorsInput): MatchVendorsResult {
  const topN = resolveTopN(input.vendorsPerRequest, input.category.max_vendors_per_mission);
  const minimumRequired = minimumVendorsRequired(topN);
  const weights = rankingWeightsSchema.parse(input.category.ranking_weights);

  const eligible = input.vendors.filter((vendor) =>
    passesHardFilters(vendor, input.request),
  );

  const ranked = eligible
    .map((vendor) => ({
      vendor,
      score: scoreVendorMatch(vendor, input.request, weights),
    }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, topN);

  return {
    topN,
    minimumRequired,
    ranked,
    filteredCount: eligible.length,
    unmetDemand: ranked.length < minimumRequired,
  };
}