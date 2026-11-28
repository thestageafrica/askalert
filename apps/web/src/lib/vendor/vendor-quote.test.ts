import { describe, expect, it } from 'vitest';
import { EXAMPLE_CATERING_120_GUESTS_KOBO } from '@askalert/catalog';
import {
  DEFAULT_MAX_VENDOR_SERVICES,
  stableCateringQuoteMinor,
  validateServicesStep,
} from './schemas';
import { createServiceRateCardFromSeed, findCatalogService } from './vendor-catalog';
import type { ServiceRateCard } from './types';

describe('vendor service plan caps', () => {
  it('blocks selecting more than the plan service cap', () => {
    const serviceSlugsByCategory: Record<string, string[]> = {
      events: Array.from({ length: DEFAULT_MAX_VENDOR_SERVICES + 1 }, (_, index) => `svc-${index}`),
    };
    const message = validateServicesStep(['events'], serviceSlugsByCategory, 5);
    expect(message).toMatch(/allows up to 5 services/i);
  });
});

describe('vendor quote stability', () => {
  it('matches catalog catering example for 120 guests', () => {
    const catalog = findCatalogService('events', 'catering');
    expect(catalog).toBeDefined();
    const card = createServiceRateCardFromSeed('events', catalog!);
    expect(stableCateringQuoteMinor(card)).toBe(EXAMPLE_CATERING_120_GUESTS_KOBO);
  });

  it('keeps banded totals stable after percent tweak round-trip', () => {
    const catalog = findCatalogService('events', 'catering');
    expect(catalog).toBeDefined();
    const card = createServiceRateCardFromSeed('events', catalog!);
    const bumped: ServiceRateCard = {
      ...card,
      bands: card.bands.map((band) => ({
        ...band,
        priceMinor: Math.round(band.priceMinor * 1.1),
      })),
    };
    const before = stableCateringQuoteMinor(card);
    const after = stableCateringQuoteMinor(bumped);
    expect(after).toBeGreaterThan(before);
    expect(after).toBe(Math.round(before * 1.1));
  });
});