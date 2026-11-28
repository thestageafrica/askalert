import { z } from 'zod';
import {
  computeQuote,
  dimensionLabel,
  validateRateCard,
  type PricingModel,
  type ServiceDefinition,
} from '@askalert/catalog';
import {
  ONBOARDING_STEPS,
  VERIFICATION_TIERS,
  VENDOR_STATUSES,
  type OnboardingStepId,
  type ServiceRateCard,
  type VendorProfileDraft,
} from './types';
import { findCatalogService } from './vendor-catalog';

function humanizeRateCardError(
  message: string | undefined,
  catalog: ServiceDefinition,
): string | undefined {
  if (!message) {
    return undefined;
  }
  const unit = dimensionLabel(catalog.dimension);
  const above = message.match(/Band ends at (\d+), above service maximum (\d+)\./);
  if (above) {
    return `A price row goes up to ${above[1]} ${unit}, but this service only allows up to ${above[2]}. Lower the “To” number (or remove that row).`;
  }
  const below = message.match(/Band starts at (\d+), below service minimum (\d+)\./);
  if (below) {
    return `A price row starts at ${below[1]} ${unit}, but this service starts at ${below[2]}. Raise the “From” number.`;
  }
  if (message.includes('overlap')) {
    return 'Two price rows overlap. Make sure each “To” is below the next “From”.';
  }
  return message;
}

export const vendorStatusSchema = z.enum(VENDOR_STATUSES);
export const verificationTierSchema = z.enum(VERIFICATION_TIERS);
export const onboardingStepSchema = z.enum(ONBOARDING_STEPS);

/** Free / starter cap on how many services a vendor can publish. */
export const DEFAULT_MAX_VENDOR_SERVICES = 12;

function isAtLeast18(isoDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return false;
  }
  const born = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(born.getTime())) {
    return false;
  }
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() - born.getDate() < 0)) {
    age -= 1;
  }
  return age >= 18;
}

export const whoYouAreSchema = z
  .object({
    entityType: z.enum(['individual', 'business']),
    displayName: z.string().trim().min(2, 'Enter your display name.').max(80),
    legalName: z
      .string()
      .trim()
      .min(2, 'Enter your legal name as it appears on your ID.')
      .max(120),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth.'),
    address: z.string().trim().max(240).optional().or(z.literal('')),
    businessName: z.string().trim().max(120).optional().or(z.literal('')),
    businessAddress: z.string().trim().max(240).optional().or(z.literal('')),
    ninOrBvn: z
      .string()
      .trim()
      .transform((value) => value.replace(/\D/g, ''))
      .pipe(z.string().length(11, 'Enter an 11-digit NIN or BVN.')),
  })
  .superRefine((value, ctx) => {
    if (!isAtLeast18(value.dateOfBirth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must be at least 18 years old.',
        path: ['dateOfBirth'],
      });
    }
    if (value.entityType === 'individual' && !value.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter your residential address.',
        path: ['address'],
      });
    }
    if (value.entityType === 'business' && !value.businessName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Business name is required for a business profile.',
        path: ['businessName'],
      });
    }
    if (value.entityType === 'business' && !value.businessAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter the business address.',
        path: ['businessAddress'],
      });
    }
  });

export const categoriesStepSchema = z.object({
  categorySlugs: z.array(z.string().min(1)).min(1, 'Pick at least one category.'),
});

export const typesStepSchema = z.object({
  categorySlugs: z.array(z.string().min(1)),
  typeSlugsByCategory: z.record(z.string(), z.array(z.string())),
});

export function validateTypesStep(
  categorySlugs: string[],
  typeSlugsByCategory: Record<string, string[]>,
): string | null {
  for (const slug of categorySlugs) {
    const types = typeSlugsByCategory[slug] ?? [];
    if (types.length === 0) {
      return 'Pick at least one type for each category.';
    }
  }
  const result = typesStepSchema.safeParse({ categorySlugs, typeSlugsByCategory });
  return result.success ? null : result.error.issues[0]?.message ?? 'Check event types.';
}

export const servicesStepSchema = z.object({
  categorySlugs: z.array(z.string().min(1)),
  serviceSlugsByCategory: z.record(z.string(), z.array(z.string())),
});

export function countSelectedServices(serviceSlugsByCategory: Record<string, string[]>): number {
  let total = 0;
  for (const slugs of Object.values(serviceSlugsByCategory)) {
    total += slugs.length;
  }
  return total;
}

export function validateServicesStep(
  categorySlugs: string[],
  serviceSlugsByCategory: Record<string, string[]>,
  maxServices = DEFAULT_MAX_VENDOR_SERVICES,
): string | null {
  for (const slug of categorySlugs) {
    const services = serviceSlugsByCategory[slug] ?? [];
    if (services.length === 0) {
      return 'Pick at least one service for each category.';
    }
  }
  const total = countSelectedServices(serviceSlugsByCategory);
  if (total > maxServices) {
    return `Your plan allows up to ${maxServices} services. Remove some to continue.`;
  }
  return null;
}

const serviceRateCardBandSchema = z.object({
  dimMin: z.number().int().nonnegative(),
  dimMax: z.number().int().positive(),
  basis: z.enum(['per_unit', 'total']),
  priceMinor: z.number().int().positive(),
  currency: z.literal('NGN'),
  label: z.string().optional(),
});

const serviceRateCardPackageSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  priceMinor: z.number().int().positive(),
  inclusions: z.array(z.string()),
});

export const serviceRateCardSchema = z.object({
  categorySlug: z.string().min(1),
  serviceSlug: z.string().min(1),
  appliesToTypeSlugs: z.union([z.literal('all'), z.array(z.string().min(1))]),
  bands: z.array(serviceRateCardBandSchema),
  priceMinor: z.number().int().positive().optional(),
  minChargeMinor: z.number().int().positive().optional(),
  packages: z.array(serviceRateCardPackageSchema),
  allowCustomQuoteLarger: z.boolean(),
  addons: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      priceMinor: z.number().int().positive(),
      basis: z.enum(['per_unit', 'total', 'flat']),
    }),
  ),
  minNoticeHours: z.number().int().nonnegative(),
  depositPct: z.number().int().min(0).max(100),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  notes: z.string().max(500),
  status: z.enum(['draft', 'active', 'paused']),
  updatedAt: z.string(),
});

export function serviceRateCardHasPricing(card: ServiceRateCard): boolean {
  const catalog = findCatalogService(card.categorySlug, card.serviceSlug);
  if (catalog?.pricing_model === 'quote_only') {
    return true;
  }
  if (card.bands.length > 0) {
    return true;
  }
  if (card.priceMinor !== undefined && card.priceMinor > 0) {
    return true;
  }
  if (card.packages.some((pkg) => pkg.priceMinor > 0)) {
    return true;
  }
  return false;
}

export function validateServiceRateCard(card: ServiceRateCard): string | null {
  const catalog = findCatalogService(card.categorySlug, card.serviceSlug);
  if (!catalog) {
    return 'Unknown service.';
  }

  const parsed = serviceRateCardSchema.safeParse(card);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Fix this rate card.';
  }

  const model = catalog.pricing_model as PricingModel;

  if (model === 'quote_only') {
    return null;
  }

  switch (model) {
    case 'banded': {
      const check = validateRateCard(card.bands, {
        minValue: catalog.min_value,
        maxValue: catalog.max_value,
        minChargeMinor: card.minChargeMinor,
      });
      if (!check.ok) {
        return humanizeRateCardError(check.errors[0], catalog) ?? 'Fix band pricing.';
      }
      break;
    }
    case 'per_unit':
    case 'flat': {
      if (!card.priceMinor || card.priceMinor < 100_00) {
        return 'Enter a price of at least ₦100.';
      }
      break;
    }
    case 'package': {
      if (!card.packages.length || card.packages.some((pkg) => pkg.priceMinor < 100_00)) {
        return 'Add at least one package priced at ₦100 or more.';
      }
      break;
    }
    default:
      break;
  }

  if (
    card.appliesToTypeSlugs !== 'all' &&
    card.appliesToTypeSlugs.length === 0
  ) {
    return 'Choose which types this rate applies to.';
  }

  return null;
}

export type ServiceRateCardIssue = {
  categorySlug: string;
  serviceSlug: string;
  serviceName: string;
  error: string;
};

export function listServiceRateCardIssues(
  draft: VendorProfileDraft,
): ServiceRateCardIssue[] {
  const issues: ServiceRateCardIssue[] = [];
  for (const categorySlug of draft.categorySlugs) {
    for (const serviceSlug of draft.serviceSlugsByCategory[categorySlug] ?? []) {
      const catalog = findCatalogService(categorySlug, serviceSlug);
      const serviceName = catalog?.name ?? serviceSlug;
      const card = draft.serviceRateCards.find(
        (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
      );
      if (!card) {
        issues.push({
          categorySlug,
          serviceSlug,
          serviceName,
          error: 'Pricing not saved yet. Open this card and confirm the prices.',
        });
        continue;
      }
      const error = validateServiceRateCard(card);
      if (error) {
        issues.push({ categorySlug, serviceSlug, serviceName, error });
      }
    }
  }
  return issues;
}

export function validateServiceRateCardsStep(draft: VendorProfileDraft): string | null {
  const hasAnyService = draft.categorySlugs.some(
    (categorySlug) => (draft.serviceSlugsByCategory[categorySlug] ?? []).length > 0,
  );
  if (!hasAnyService) {
    return 'Pick services before setting rate cards.';
  }

  const issues = listServiceRateCardIssues(draft);
  if (issues.length === 0) {
    return null;
  }
  if (issues.length === 1) {
    return `${issues[0]!.serviceName}: ${issues[0]!.error}`;
  }
  return `Fix pricing on ${issues.length} services below.`;
}

export const areasStepSchema = z.object({
  areaSlugs: z.array(z.string().min(1)).min(1, 'Add at least one service location.'),
});

/** Validate coverage rows against a plan cap (defaults to free: 2). */
export function areasStepSchemaWithLimit(maxServiceAreas: number) {
  return areasStepSchema.superRefine((value, ctx) => {
    if (value.areaSlugs.length > maxServiceAreas) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Your plan allows up to ${maxServiceAreas} service locations.`,
        path: ['areaSlugs'],
      });
    }
  });
}

export const coverageRowSchema = z.object({
  stateSlug: z.string().min(1, 'Pick a state.'),
  locationSlug: z.string().min(1, 'Pick a location.'),
});

export function validateCoverageRows(
  rows: Array<{ stateSlug: string; locationSlug: string }>,
  maxServiceAreas: number,
): string | null {
  const filled = rows.filter((row) => row.stateSlug && row.locationSlug);
  if (filled.length === 0) {
    return 'Add at least one service location.';
  }
  if (filled.length > maxServiceAreas) {
    return `Your plan allows up to ${maxServiceAreas} service locations.`;
  }
  const seen = new Set<string>();
  for (const row of filled) {
    if (seen.has(row.locationSlug)) {
      return 'This location is already added. Choose another location.';
    }
    seen.add(row.locationSlug);
    if (row.locationSlug.endsWith('-all')) {
      const statePrefix = row.locationSlug.slice(0, -'-all'.length);
      const hasSpecific = filled.some(
        (other) =>
          other.locationSlug !== row.locationSlug &&
          other.stateSlug === statePrefix,
      );
      if (hasSpecific) {
        return 'All of that state already covers every location there.';
      }
    }
  }
  return null;
}

/** Legacy v1 category rate card schema. */
export const rateCardSchema = z
  .object({
    categorySlug: z.string().min(1),
    startingPriceMinor: z.number().int().min(100_00, 'Starting price must be at least ₦100.'),
    minPriceMinor: z.number().int().min(100_00),
    maxPriceMinor: z.number().int().min(100_00),
    unit: z.string().trim().min(1).max(40),
    notes: z.string().trim().max(280).optional().or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    if (value.minPriceMinor > value.startingPriceMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Min price cannot be above starting price.',
        path: ['minPriceMinor'],
      });
    }
    if (value.maxPriceMinor < value.startingPriceMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Max price cannot be below starting price.',
        path: ['maxPriceMinor'],
      });
    }
  });

export const rateCardsStepSchema = z.object({
  rateCards: z.array(rateCardSchema).min(1, 'Add a rate card for each category.'),
});

export const dayHoursSchema = z.object({
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  open: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const availabilityStepSchema = z.object({
  weeklyHours: z.array(dayHoursSchema).length(7),
  blackoutDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const documentKindSchema = z.enum([
  'id',
  'id_selfie',
  'business_proof',
  'licence',
  'portfolio',
]);

export const vendorDocumentSchema = z.object({
  id: z.string().min(1),
  kind: documentKindSchema,
  fileName: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().int().positive().max(5 * 1024 * 1024),
  path: z.string().min(1),
  ownerUserId: z.string().min(1),
  scanned: z.boolean(),
  createdAt: z.string().min(1),
});

export const documentsStepSchema = z.object({
  documents: z
    .array(vendorDocumentSchema)
    .min(1, 'Upload a clear photo of your ID.'),
});

export function validateDocumentsStep(
  documents: VendorProfileDraft['documents'],
  options: {
    entityType: VendorProfileDraft['entityType'];
    regulatedDocCount: number;
  },
): string | null {
  const hasId = documents.some((doc) => doc.kind === 'id');
  if (!hasId) {
    return 'Upload a clear photo of your government ID.';
  }

  const hasIdSelfie = documents.some((doc) => doc.kind === 'id_selfie');
  if (!hasIdSelfie) {
    return 'Upload a photo of yourself holding the same ID.';
  }

  if (options.entityType === 'business') {
    const hasBusinessProof = documents.some((doc) => doc.kind === 'business_proof');
    if (!hasBusinessProof) {
      return 'Upload business proof (CAC or registered business name).';
    }
  }

  const licenceCount = documents.filter((doc) => doc.kind === 'licence').length;
  if (licenceCount < options.regulatedDocCount) {
    const needed = options.regulatedDocCount - licenceCount;
    return needed === 1
      ? 'Upload the required licence for your regulated service.'
      : `Upload ${needed} more licence documents for your regulated services.`;
  }

  const base = documentsStepSchema.safeParse({ documents });
  if (!base.success) {
    return base.error.issues[0]?.message ?? 'Upload documents.';
  }
  return null;
}

export const payoutStepSchema = z.object({
  bankName: z.string().trim().min(2, 'Enter your bank name.'),
  accountName: z.string().trim().min(2, 'Enter the account name.'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Account number must be 10 digits.'),
});

export const STEP_ORDER: OnboardingStepId[] = [...ONBOARDING_STEPS];

export function stepIndex(step: OnboardingStepId): number {
  return STEP_ORDER.indexOf(step);
}

export function nextStep(step: OnboardingStepId): OnboardingStepId | null {
  const index = stepIndex(step);
  return index >= 0 && index < STEP_ORDER.length - 1 ? STEP_ORDER[index + 1]! : null;
}

export function previousStep(step: OnboardingStepId): OnboardingStepId | null {
  const index = stepIndex(step);
  return index > 0 ? STEP_ORDER[index - 1]! : null;
}

/** Stable quote check used in tests — catering 120 guests. */
export function stableCateringQuoteMinor(card: ServiceRateCard): number {
  const catalog = findCatalogService(card.categorySlug, card.serviceSlug);
  if (!catalog || catalog.pricing_model !== 'banded') {
    return 0;
  }
  const result = computeQuote(
    {
      service: {
        slug: catalog.slug,
        pricing_model: catalog.pricing_model,
        dimension: catalog.dimension,
        min_value: catalog.min_value,
        max_value: catalog.max_value,
        packages: catalog.packages,
      },
      rates: card.bands,
      minChargeMinor: card.minChargeMinor,
    },
    { serviceSlug: catalog.slug, quantity: 120 },
  );
  return result.amountMinor;
}