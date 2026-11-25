import { z } from 'zod';
import {
  ONBOARDING_STEPS,
  VERIFICATION_TIERS,
  VENDOR_STATUSES,
  type OnboardingStepId,
} from './types';

export const vendorStatusSchema = z.enum(VENDOR_STATUSES);
export const verificationTierSchema = z.enum(VERIFICATION_TIERS);
export const onboardingStepSchema = z.enum(ONBOARDING_STEPS);

export const whoYouAreSchema = z
  .object({
    entityType: z.enum(['individual', 'business']),
    displayName: z.string().trim().min(2, 'Enter your display name.').max(80),
    businessName: z.string().trim().max(120).optional().or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    if (value.entityType === 'business' && !value.businessName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Business name is required for a business profile.',
        path: ['businessName'],
      });
    }
  });

export const categoriesStepSchema = z.object({
  categorySlugs: z.array(z.string().min(1)).min(1, 'Pick at least one category.'),
});

export const areasStepSchema = z.object({
  areaSlugs: z.array(z.string().min(1)).min(1, 'Pick at least one service area.'),
});

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

export const documentKindSchema = z.enum(['id', 'business_proof', 'licence', 'portfolio']);

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
    .min(1, 'Upload at least one ID or portfolio document.'),
});

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
