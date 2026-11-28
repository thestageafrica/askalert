import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_CATERING_120_GUESTS_KOBO,
  EXAMPLE_CATERING_RATE_100_150_KOBO_PER_GUEST,
  buildRequestSchema,
  buildSnapshotFromSeed,
  computeQuote,
  flattenSnapshotAliases,
  listCatalogSeeds,
  matchAlias,
  resolveCatalogTree,
  validateRateCard,
} from './index';
import { findCatalogSeedBySlug } from './seeds/index';

describe('validateRateCard', () => {
  it('accepts ascending non-overlapping bands and warns on gaps', () => {
    const result = validateRateCard(
      [
        {
          dimMin: 50,
          dimMax: 99,
          basis: 'per_unit',
          priceMinor: 650_000,
          currency: 'NGN',
        },
        {
          dimMin: 100,
          dimMax: 150,
          basis: 'per_unit',
          priceMinor: 600_000,
          currency: 'NGN',
        },
        {
          dimMin: 160,
          dimMax: 200,
          basis: 'per_unit',
          priceMinor: 300_000,
          currency: 'NGN',
        },
      ],
      { minValue: 50, maxValue: 250 },
    );
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('Gap'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('Large price jump'))).toBe(true);
  });

  it('rejects overlapping bands', () => {
    const result = validateRateCard([
      {
        dimMin: 50,
        dimMax: 120,
        basis: 'per_unit',
        priceMinor: 600_000,
        currency: 'NGN',
      },
      {
        dimMin: 100,
        dimMax: 150,
        basis: 'per_unit',
        priceMinor: 550_000,
        currency: 'NGN',
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('overlap'))).toBe(true);
  });
});

describe('computeQuote', () => {
  /**
   * Maths (documented):
   * - Band 100-150 guests at N6,000 per guest (per_unit basis).
   * - N6,000 = 600_000 kobo per guest.
   * - Quantity 120 guests → 120 × 600_000 = 72_000_000 kobo (= N720,000).
   */
  it('quotes 120 guests in the 100-150 catering band', () => {
    const events = findCatalogSeedBySlug('events');
    expect(events).toBeDefined();
    const catering = events!.services.find((s) => s.slug === 'catering');
    expect(catering).toBeDefined();

    const quote = computeQuote(
      {
        service: catering!,
        rates: catering!.default_bands.map((band) => ({ ...band })),
      },
      { serviceSlug: 'catering', quantity: 120 },
    );

    expect(quote.customQuoteNeeded).toBe(false);
    expect(quote.instantQuote).toBe(true);
    expect(quote.currency).toBe('NGN');
    expect(quote.amountMinor).toBe(EXAMPLE_CATERING_120_GUESTS_KOBO);
    expect(quote.amountMinor).toBe(120 * EXAMPLE_CATERING_RATE_100_150_KOBO_PER_GUEST);
    expect(quote.breakdown[0]?.amountMinor).toBe(72_000_000);
  });
});

describe('matchAlias', () => {
  it('matches Pidgin and Yoruba samples', () => {
    const events = findCatalogSeedBySlug('events');
    const snapshot = buildSnapshotFromSeed(events!);
    const aliases = flattenSnapshotAliases(snapshot.aliases, events!.category_slug);

    const chops = matchAlias('I need small chops for my party', aliases);
    expect(chops?.alias).toBe('small chops');
    expect(chops?.language).toBe('en');
    expect(chops?.confidence).toBeGreaterThanOrEqual(0.9);

    const gele = matchAlias('e help me find gele person', aliases);
    expect(gele?.alias).toBe('gele');
    expect(gele?.language).toBe('yo');

    const jollof = matchAlias('na jollof we want', aliases);
    expect(jollof?.alias).toBe('jollof');
    expect(jollof?.language).toBe('pcm');
  });
});

describe('catalog seeds', () => {
  it('loads and validates all nine categories', () => {
    const seeds = listCatalogSeeds();
    expect(seeds).toHaveLength(9);
    for (const seed of seeds) {
      const tree = resolveCatalogTree(buildSnapshotFromSeed(seed));
      expect(tree.types.length).toBeGreaterThan(0);
      expect(tree.types.some((t) => t.services.length > 0)).toBe(true);
    }
    const security = findCatalogSeedBySlug('security');
    const armed = security?.services.find((s) => s.slug === 'armed-escort');
    expect(armed?.regulated).toBe(true);
    expect(armed?.required_documents.length).toBeGreaterThan(0);
  });
});

describe('buildRequestSchema', () => {
  it('builds dimension questions for multi-service wedding asks', () => {
    const events = findCatalogSeedBySlug('events');
    const snapshot = buildSnapshotFromSeed(events!);
    const schema = buildRequestSchema(snapshot, 'wedding', ['catering', 'dj']);
    expect(schema.dimensionQuestions.map((q) => q.scopeSlug).sort()).toEqual(['catering', 'dj']);
    expect(schema.dimensionQuestions.every((q) => q.type === 'number')).toBe(true);
    expect(schema.allQuestions.length).toBeGreaterThanOrEqual(2);
  });
});