import { DEFAULT_WEEKLY_HOURS, ONBOARDING_STEPS, type OnboardingStepId, type VendorProfileDraft } from './types';
import { serviceRateCardHasPricing } from './schemas';

const LEGACY_STEP_ORDER = [
  'who',
  'categories',
  'areas',
  'rate_cards',
  'availability',
  'documents',
  'payout',
  'review',
] as const;

function hasTypesFilled(draft: VendorProfileDraft): boolean {
  return draft.categorySlugs.every(
    (slug) => (draft.typeSlugsByCategory[slug] ?? []).length > 0,
  );
}

function hasServicesFilled(draft: VendorProfileDraft): boolean {
  return draft.categorySlugs.every(
    (slug) => (draft.serviceSlugsByCategory[slug] ?? []).length > 0,
  );
}

function rateCardConfigured(card: VendorProfileDraft['serviceRateCards'][number]): boolean {
  return serviceRateCardHasPricing(card);
}

function hasRateCardsFilled(draft: VendorProfileDraft): boolean {
  for (const categorySlug of draft.categorySlugs) {
    for (const serviceSlug of draft.serviceSlugsByCategory[categorySlug] ?? []) {
      const card = draft.serviceRateCards.find(
        (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
      );
      if (!card || !rateCardConfigured(card)) {
        return false;
      }
    }
  }
  const totalServices = draft.categorySlugs.flatMap(
    (slug) => draft.serviceSlugsByCategory[slug] ?? [],
  ).length;
  return totalServices > 0;
}

/** Pick the first incomplete step for v2 onboarding. */
export function suggestResumeStep(draft: VendorProfileDraft): OnboardingStepId {
  if (
    !draft.displayName.trim() ||
    !draft.legalName.trim() ||
    !draft.dateOfBirth ||
    !draft.ninOrBvn.trim() ||
    (draft.entityType === 'individual' && !draft.address.trim()) ||
    (draft.entityType === 'business' &&
      (!draft.businessName.trim() || !draft.businessAddress.trim()))
  ) {
    return 'who';
  }
  if (draft.categorySlugs.length === 0) {
    return 'categories';
  }
  if (!hasTypesFilled(draft)) {
    return 'types';
  }
  if (!hasServicesFilled(draft)) {
    return 'services';
  }
  if (!hasRateCardsFilled(draft)) {
    return 'rate_cards';
  }
  if (draft.areaSlugs.length === 0) {
    return 'areas';
  }
  if (!draft.weeklyHours.length) {
    return 'availability';
  }
  if (draft.documents.length === 0) {
    return 'documents';
  }
  if (!draft.payout.accountNumber) {
    return 'payout';
  }
  return 'review';
}

function legacyStepIndex(step: string): number {
  const index = LEGACY_STEP_ORDER.indexOf(step as (typeof LEGACY_STEP_ORDER)[number]);
  return index >= 0 ? index : 0;
}

/**
 * Map v1 saved step to v2 when new fields are empty (safe migration).
 */
export function migrateLegacyStep(
  legacyStep: string,
  draft: VendorProfileDraft,
): OnboardingStepId {
  if (!(ONBOARDING_STEPS as readonly string[]).includes(legacyStep)) {
    return suggestResumeStep(draft);
  }

  const legacyIndex = legacyStepIndex(legacyStep);
  const hadPassedCategories = legacyIndex >= legacyStepIndex('categories');

  if (hadPassedCategories && !hasTypesFilled(draft)) {
    return 'types';
  }
  if (hadPassedCategories && hasTypesFilled(draft) && !hasServicesFilled(draft)) {
    return 'services';
  }
  if (legacyIndex >= legacyStepIndex('rate_cards') && !hasRateCardsFilled(draft)) {
    return 'rate_cards';
  }

  const step = legacyStep as OnboardingStepId;
  if (step === 'areas' && !hasRateCardsFilled(draft)) {
    return 'rate_cards';
  }
  return step;
}

export function normalizePersistedDraft(
  partial: Partial<VendorProfileDraft> & { currentStep?: string },
): VendorProfileDraft {
  const now = new Date().toISOString();
  const currentStepRaw = partial.currentStep;
  const merged: VendorProfileDraft = {
    entityType: partial.entityType ?? 'individual',
    displayName: partial.displayName ?? '',
    legalName: partial.legalName ?? '',
    dateOfBirth: partial.dateOfBirth ?? '',
    address: partial.address ?? '',
    businessName: partial.businessName ?? '',
    businessAddress: partial.businessAddress ?? '',
    ninOrBvn: partial.ninOrBvn ?? '',
    categorySlugs: partial.categorySlugs ?? [],
    typeSlugsByCategory: partial.typeSlugsByCategory ?? {},
    serviceSlugsByCategory: partial.serviceSlugsByCategory ?? {},
    serviceRateCards: partial.serviceRateCards ?? [],
    areaSlugs: partial.areaSlugs ?? [],
    rateCards: partial.rateCards ?? [],
    weeklyHours:
      partial.weeklyHours && partial.weeklyHours.length === 7
        ? partial.weeklyHours
        : DEFAULT_WEEKLY_HOURS,
    blackoutDates: partial.blackoutDates ?? [],
    documents: partial.documents ?? [],
    payout: partial.payout ?? { bankName: '', accountName: '', accountNumber: '' },
    status: partial.status ?? 'draft',
    verificationTiers: partial.verificationTiers ?? ['phone'],
    currentStep: 'who',
    submittedAt: partial.submittedAt ?? null,
    updatedAt: partial.updatedAt ?? now,
  };

  const legacyStep = typeof currentStepRaw === 'string' ? currentStepRaw : merged.currentStep;
  if ((ONBOARDING_STEPS as readonly string[]).includes(legacyStep)) {
    merged.currentStep = migrateLegacyStep(legacyStep, merged);
  } else {
    merged.currentStep = migrateLegacyStep('who', merged);
  }

  return merged;
}