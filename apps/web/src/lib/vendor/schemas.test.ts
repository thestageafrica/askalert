import { describe, expect, it } from 'vitest';
import { createServiceRateCardFromSeed, findCatalogService } from './vendor-catalog';
import {
  areasStepSchema,
  areasStepSchemaWithLimit,
  categoriesStepSchema,
  documentsStepSchema,
  computeOnboardingCompleteness,
  listServiceRateCardIssues,
  payoutStepSchema,
  rateCardSchema,
  validateCoverageRows,
  validateDocumentsStep,
  validateServiceRateCard,
  validateTypesStep,
  whoYouAreSchema,
} from './schemas';

describe('vendor onboarding validation', () => {
  it('requires business name and address for business entity', () => {
    const result = whoYouAreSchema.safeParse({
      entityType: 'business',
      displayName: 'Ada',
      legalName: 'Ada Okoro',
      dateOfBirth: '1990-05-12',
      address: '',
      businessName: '',
      businessAddress: '',
      ninOrBvn: '12345678901',
    });
    expect(result.success).toBe(false);
  });

  it('accepts individual with legal identity fields', () => {
    const result = whoYouAreSchema.safeParse({
      entityType: 'individual',
      displayName: 'Ada Okoro',
      legalName: 'Ada Okoro',
      dateOfBirth: '1990-05-12',
      address: '12 Admiralty Way, Lekki Phase 1',
      businessName: '',
      businessAddress: '',
      ninOrBvn: '12345678901',
    });
    expect(result.success).toBe(true);
  });

  it('rejects under-18 and short NIN or BVN', () => {
    expect(
      whoYouAreSchema.safeParse({
        entityType: 'individual',
        displayName: 'Ada',
        legalName: 'Ada Okoro',
        dateOfBirth: '2015-01-01',
        address: 'Lekki',
        businessName: '',
        businessAddress: '',
        ninOrBvn: '12345678901',
      }).success,
    ).toBe(false);
    expect(
      whoYouAreSchema.safeParse({
        entityType: 'individual',
        displayName: 'Ada',
        legalName: 'Ada Okoro',
        dateOfBirth: '1990-05-12',
        address: 'Lekki',
        businessName: '',
        businessAddress: '',
        ninOrBvn: '12345',
      }).success,
    ).toBe(false);
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
      legalName: 'Ada Okoro',
      dateOfBirth: '1990-05-12',
      address: 'Lekki',
      businessName: '',
      businessAddress: '',
      ninOrBvn: '12345678901',
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

  it('treats payout as optional in review completeness', () => {
    const completeness = computeOnboardingCompleteness({
      entityType: 'individual',
      displayName: 'Ada',
      legalName: 'Ada Okoro',
      dateOfBirth: '1990-05-12',
      address: 'Lekki',
      businessName: '',
      businessAddress: '',
      ninOrBvn: '12345678901',
      categorySlugs: [],
      typeSlugsByCategory: {},
      serviceSlugsByCategory: {},
      serviceRateCards: [],
      rateCards: [],
      areaSlugs: [],
      weeklyHours: [],
      blackoutDates: [],
      documents: [],
      payout: { bankName: '', accountName: '', accountNumber: '' },
      status: 'draft',
      verificationTiers: ['phone'],
      currentStep: 'review',
      submittedAt: null,
      updatedAt: new Date().toISOString(),
    });
    expect(completeness.items.find((item) => item.id === 'payout')?.optional).toBe(true);
    expect(completeness.percent).toBeLessThan(100);
  });

  it('requires photo ID, selfie with ID, and business proof for businesses', () => {
    const idDoc = {
      id: 'doc_1',
      kind: 'id' as const,
      fileName: 'nin.jpg',
      mime: 'image/jpeg',
      bytes: 1200,
      path: 'u/nin.jpg',
      ownerUserId: 'u',
      scanned: true,
      createdAt: new Date().toISOString(),
    };
    const selfieDoc = {
      ...idDoc,
      id: 'doc_selfie',
      kind: 'id_selfie' as const,
      fileName: 'selfie.jpg',
    };
    expect(
      validateDocumentsStep([], { entityType: 'individual', regulatedDocCount: 0 }),
    ).toMatch(/government ID/i);
    expect(
      validateDocumentsStep([idDoc], { entityType: 'individual', regulatedDocCount: 0 }),
    ).toMatch(/holding the same ID/i);
    expect(
      validateDocumentsStep([idDoc, selfieDoc], {
        entityType: 'individual',
        regulatedDocCount: 0,
      }),
    ).toBeNull();
    expect(
      validateDocumentsStep([idDoc, selfieDoc], {
        entityType: 'business',
        regulatedDocCount: 0,
      }),
    ).toMatch(/business proof/i);
    expect(
      validateDocumentsStep(
        [
          idDoc,
          selfieDoc,
          { ...idDoc, id: 'doc_2', kind: 'business_proof', fileName: 'cac.pdf' },
        ],
        { entityType: 'business', regulatedDocCount: 0 },
      ),
    ).toBeNull();
  });
});
