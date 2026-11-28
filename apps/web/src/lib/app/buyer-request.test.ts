import { describe, expect, it } from 'vitest';
import {
  emptyBuyerRequestDraft,
  nextBuyerStep,
  previousBuyerStep,
  validateBuyerStep,
} from './buyer-request';
import {
  buildDemoMatchVendors,
  matchBuyerRequest,
  MIN_TYPICAL_PRICE_VENDORS,
} from './buyer-matching';
import {
  buildSnapshotFromSeed,
  findCatalogSeedBySlug,
  resolveCatalogTree,
} from '@askalert/catalog';
import { listGeoSeedNodes } from '@askalert/geo';

describe('buyer request steps', () => {
  it('orders category through review', () => {
    expect(nextBuyerStep('category')).toBe('type');
    expect(nextBuyerStep('review')).toBeNull();
    expect(previousBuyerStep('type')).toBe('category');
  });

  it('validates multi-service details and location', () => {
    const draft = emptyBuyerRequestDraft({
      categorySlug: 'events',
      typeSlug: 'wedding',
      items: [
        { serviceSlug: 'catering', quantity: 120, attributes: {} },
        { serviceSlug: 'dj', quantity: 1, attributes: {} },
      ],
      startDate: '2026-12-20',
      stateSlug: 'lagos',
      locationSlug: 'lekki-phase-1',
    });
    expect(validateBuyerStep('services', draft)).toBeNull();
    expect(validateBuyerStep('details', draft)).toBeNull();
    expect(validateBuyerStep('location', { ...draft, locationSlug: '' })).toMatch(/location/i);
  });
});

describe('buyer matching', () => {
  it('matches by type, location and service quantity and logs unmet when thin', () => {
    const seed = findCatalogSeedBySlug('events');
    expect(seed).toBeDefined();
    const tree = resolveCatalogTree(buildSnapshotFromSeed(seed!));
    const catering = tree.types
      .flatMap((type) => type.services)
      .find((service) => service.slug === 'catering');
    expect(catering).toBeDefined();

    const draft = emptyBuyerRequestDraft({
      categorySlug: 'events',
      typeSlug: 'wedding',
      items: [{ serviceSlug: 'catering', quantity: 120, attributes: {} }],
      startDate: '2026-12-20',
      locationSlug: 'lekki-phase-1',
    });

    const vendors = buildDemoMatchVendors({
      categorySlug: 'events',
      typeSlug: 'wedding',
      items: draft.items,
      services: [catering!],
      locationSlug: 'lekki-phase-1',
    });

    const result = matchBuyerRequest({
      draft,
      vendors,
      nodes: listGeoSeedNodes(),
      minVendors: MIN_TYPICAL_PRICE_VENDORS,
    });

    expect(result.vendorsCovering).toBeGreaterThanOrEqual(MIN_TYPICAL_PRICE_VENDORS);
    expect(result.typicalPrice.showEstimate).toBe(true);
    expect(result.typicalPrice.minMinor).toBeGreaterThan(0);
    expect(result.matches.some((row) => row.instantQuote)).toBe(true);

    const thin = matchBuyerRequest({
      draft,
      vendors: vendors.slice(0, 1),
      nodes: listGeoSeedNodes(),
      minVendors: MIN_TYPICAL_PRICE_VENDORS,
    });
    expect(thin.unmetDemand.length).toBe(1);
    expect(thin.unmetDemand[0]?.serviceSlug).toBe('catering');
    expect(thin.unmetDemand[0]?.typeSlug).toBe('wedding');
    expect(thin.unmetDemand[0]?.locationSlug).toBe('lekki-phase-1');
  });

  it('rejects vendors that do not cover the location', () => {
    const seed = findCatalogSeedBySlug('events');
    const tree = resolveCatalogTree(buildSnapshotFromSeed(seed!));
    const catering = tree.types
      .flatMap((type) => type.services)
      .find((service) => service.slug === 'catering')!;

    const draft = emptyBuyerRequestDraft({
      categorySlug: 'events',
      typeSlug: 'wedding',
      items: [{ serviceSlug: 'catering', quantity: 100, attributes: {} }],
      locationSlug: 'lekki-phase-1',
    });

    const vendors = buildDemoMatchVendors({
      categorySlug: 'events',
      typeSlug: 'wedding',
      items: draft.items,
      services: [catering],
      locationSlug: 'ikeja',
    }).map((vendor) => ({
      ...vendor,
      coverageSlugs: ['ikeja'],
    }));

    const result = matchBuyerRequest({
      draft,
      vendors,
      nodes: listGeoSeedNodes(),
    });
    expect(result.vendorsCovering).toBe(0);
  });
});
