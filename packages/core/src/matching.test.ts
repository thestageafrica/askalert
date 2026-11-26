import { describe, expect, it } from 'vitest';
import {
  matchVendors,
  minimumVendorsRequired,
  passesHardFilters,
  type BuyerMatchRequest,
  type CategoryMatchingConfig,
  type VendorMatchProfile,
} from './matching';

const category: CategoryMatchingConfig = {
  slug: 'events',
  max_vendors_per_mission: 5,
  response_deadline_minutes: 180,
  ranking_weights: {
    price: 0.3,
    rating: 0.25,
    response_speed: 0.2,
    proximity: 0.15,
    fit: 0.1,
  },
};

const request: BuyerMatchRequest = {
  categorySlug: 'events',
  areaSlug: 'lekki-phase-1',
  serviceDate: '2026-12-20',
  budgetMinMinor: 500_000,
  budgetMaxMinor: 2_000_000,
  minVerificationTier: 'phone',
};

function vendor(id: string, overrides: Partial<VendorMatchProfile> = {}): VendorMatchProfile {
  return {
    vendorProfileId: id,
    vendorUserId: `user-${id}`,
    status: 'approved',
    categorySlugs: ['events'],
    areaSlugs: ['lekki-phase-1'],
    verificationTiers: ['phone'],
    blackoutDates: [],
    rating: 4.2,
    responseSpeedScore: 0.8,
    proximityScore: 0.9,
    fitScore: 0.7,
    rateCard: {
      categorySlug: 'events',
      startingPriceMinor: 800_000,
      minPriceMinor: 600_000,
      maxPriceMinor: 3_000_000,
    },
    ...overrides,
  };
}

describe('hard filters', () => {
  it('rejects wrong category and unapproved vendors', () => {
    expect(passesHardFilters(vendor('a'), request)).toBe(true);
    expect(passesHardFilters(vendor('b', { categorySlugs: ['tutors'] }), request)).toBe(false);
    expect(passesHardFilters(vendor('c', { status: 'draft' }), request)).toBe(false);
    expect(
      passesHardFilters(vendor('d', { blackoutDates: ['2026-12-20'] }), request),
    ).toBe(false);
  });

  it('requires budget overlap', () => {
    expect(
      passesHardFilters(
        vendor('e', {
          rateCard: {
            categorySlug: 'events',
            startingPriceMinor: 5_000_000,
            minPriceMinor: 4_000_000,
            maxPriceMinor: 6_000_000,
          },
        }),
        request,
      ),
    ).toBe(false);
  });
});

describe('matchVendors', () => {
  it('returns top N capped by plan and category', () => {
    const result = matchVendors({
      vendors: [
        vendor('1', { responseSpeedScore: 0.95 }),
        vendor('2', { responseSpeedScore: 0.5 }),
        vendor('3', { responseSpeedScore: 0.7 }),
        vendor('4', { responseSpeedScore: 0.6 }),
      ],
      request,
      category,
      vendorsPerRequest: 2,
    });
    expect(result.topN).toBe(2);
    expect(result.ranked).toHaveLength(2);
    expect(result.ranked[0]?.vendor.vendorProfileId).toBe('1');
  });

  it('flags unmet demand below minimum', () => {
    const result = matchVendors({
      vendors: [vendor('only')],
      request,
      category,
      vendorsPerRequest: 4,
    });
    expect(minimumVendorsRequired(4)).toBe(3);
    expect(result.unmetDemand).toBe(true);
  });
});