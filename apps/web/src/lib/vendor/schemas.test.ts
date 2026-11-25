import { describe, expect, it } from 'vitest';
import {
  areasStepSchema,
  categoriesStepSchema,
  documentsStepSchema,
  payoutStepSchema,
  rateCardSchema,
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
