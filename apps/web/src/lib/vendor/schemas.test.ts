import { describe, expect, it } from 'vitest';
import { createServiceRateCardFromSeed, findCatalogService } from './vendor-catalog';
import {
  areasStepSchema,
  areasStepSchemaWithLimit,
  categoriesStepSchema,
  documentsStepSchema,
  listServiceRateCardIssues,
  payoutStepSchema,
  rateCardSchema,
  validateCoverageRows,
  validateServiceRateCard,
  validateTypesStep,
  whoYouAreSchema,
} from './schemas';

describe('vendor onboarding validation', () => {
  it('requires business name for business entity', () => {
    const result = whoYouAreSchema.safeParse({
      entityType: 'business',
      displayName: 'Ada',
      businessName: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts individual without business name', () => {
    const result = whoYouAreSchema.safeParse({
      entityType: 'individual',
      displayName: 'Ada Okoro',
      businessName: '',
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one category and area', () => {
    expect(categoriesStepSchema.safeParse({ categorySlugs: [] }).success).toBe(false);
    expect(areasStepSchema.safeParse({ areaSlugs: ['lekki'] }).success).toBe(true);
  });

  it('enforces plan max on service areas', () => {
    const limited = areasStepSchemaWithLimit(2);
    expect(
      limited.safeParse({ areaSlugs: ['lekki', 'ikorodu', 'ikeja'] }).success,
    ).toBe(false);
    expect(limited.safeParse({ areaSlugs: ['lekki', 'ikorodu'] }).success).toBe(true);
  });

  it('blocks mixing All of Lagos with specific Lagos places', () => {
    expect(
      validateCoverageRows(
        [
          { stateSlug: 'lagos', locationSlug: 'lekki' },
          { stateSlug: 'lagos', locationSlug: 'lekki' },
        ],
        2,
      ),
    ).toMatch(/already added/i);
    expect(
      validateCoverageRows(
        [
          { stateSlug: 'lagos', locationSlug: 'lagos-all' },
          { stateSlug: 'lagos', locationSlug: 'lekki' },
        ],
        2,
      ),
    ).toMatch(/already covers/i);
    expect(
      validateCoverageRows([{ stateSlug: 'lagos', locationSlug: 'lekki' }], 2),
    ).toBeNull();
  });

  it('validates rate card bounds', () => {
    const bad = rateCardSchema.safeParse({
      categorySlug: 'shortlets',
      startingPriceMinor: 50_000_00,
      minPriceMinor: 80_000_00,
      maxPriceMinor: 40_000_00,
      unit: 'night',
      notes: '',
    });
    expect(bad.success).toBe(false);

    const good = rateCardSchema.safeParse({
      categorySlug: 'shortlets',
      startingPriceMinor: 50_000_00,
      minPriceMinor: 40_000_00,
      maxPriceMinor: 90_000_00,
      unit: 'night',
      notes: '',
    });
    expect(good.success).toBe(true);
  });

  it('requires at least one type per category', () => {
    expect(
      validateTypesStep(['events'], { events: [] }),
    ).toMatch(/at least one type/i);
    expect(validateTypesStep(['events'], { events: ['wedding'] })).toBeNull();
  });

  it('validates catalog-backed service rate cards', () => {
    const catalog = findCatalogService('events', 'catering');
    expect(catalog).toBeDefined();
    const card = createServiceRateCardFromSeed('events', catalog!);
    expect(validateServiceRateCard(card)).toBeNull();
  });

  it('lists per-service rate card issues with names', () => {
    const issues = listServiceRateCardIssues({
      entityType: 'individual',
      displayName: 'Ada',
      businessName: '',
      categorySlugs: ['events'],
      typeSlugsByCategory: { events: ['wedding'] },
      serviceSlugsByCategory: { events: ['catering', 'dj'] },
      serviceRateCards: [],
      rateCards: [],
      areaSlugs: [],
      weeklyHours: [],
      blackoutDates: [],
      documents: [],
      payout: { bankName: '', accountName: '', accountNumber: '' },
      status: 'draft',
      verificationTiers: ['phone'],
      currentStep: 'rate_cards',
      submittedAt: null,
      updatedAt: new Date().toISOString(),
    });
    expect(issues.length).toBe(2);
    expect(issues[0]?.serviceName.length).toBeGreaterThan(0);
    expect(issues[0]?.error).toMatch(/pricing not saved/i);
  });

  it('requires 10-digit account number and at least one document', () => {
    expect(
      payoutStepSchema.safeParse({
        bankName: 'GTBank',
        accountName: 'Ada Okoro',
        accountNumber: '12345',
      }).success,
    ).toBe(false);
    expect(
      payoutStepSchema.safeParse({
        bankName: 'GTBank',
        accountName: 'Ada Okoro',
        accountNumber: '0123456789',
      }).success,
    ).toBe(true);
    expect(documentsStepSchema.safeParse({ documents: [] }).success).toBe(false);
  });
});
