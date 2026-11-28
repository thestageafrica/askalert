import { z } from 'zod';
import type { InvolvementMode } from './types';

export const BUYER_REQUEST_STEPS = [
  'category',
  'type',
  'services',
  'details',
  'date',
  'location',
  'budget',
  'involvement',
  'review',
] as const;

export type BuyerRequestStepId = (typeof BUYER_REQUEST_STEPS)[number];

export type BuyerRequestItem = {
  serviceSlug: string;
  quantity: number;
  attributes: Record<string, string | number | boolean>;
};

export type BuyerRequestDraft = {
  catalogVersion: number;
  categorySlug: string;
  typeSlug: string;
  items: BuyerRequestItem[];
  /** Shared attribute answers from buildRequestSchema (non-dimension). */
  attributes: Record<string, string | number | boolean>;
  startDate: string;
  endDate: string;
  startTime: string;
  stateSlug: string;
  locationSlug: string;
  /** Private until booking. */
  venueText: string;
  budgetMinMinor: number | null;
  budgetMaxMinor: number | null;
  involvement: InvolvementMode;
  currentStep: BuyerRequestStepId;
  updatedAt: string;
};

export const buyerRequestItemSchema = z.object({
  serviceSlug: z.string().min(1),
  quantity: z.number().positive('Enter a quantity.'),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export const buyerRequestDraftSchema = z.object({
  catalogVersion: z.number().int().nonnegative(),
  categorySlug: z.string().min(1, 'Pick a category.'),
  typeSlug: z.string().min(1, 'Pick a type.'),
  items: z.array(buyerRequestItemSchema).min(1, 'Pick at least one service.'),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  startTime: z.string().max(8).optional().or(z.literal('')),
  stateSlug: z.string().min(1, 'Pick a state.'),
  locationSlug: z.string().min(1, 'Pick a location.'),
  venueText: z.string().max(240).optional().or(z.literal('')),
  budgetMinMinor: z.number().int().nonnegative().nullable(),
  budgetMaxMinor: z.number().int().nonnegative().nullable(),
  involvement: z.enum(['match', 'relay', 'assist', 'autopilot']),
  currentStep: z.enum(BUYER_REQUEST_STEPS),
  updatedAt: z.string().min(1),
});

export function emptyBuyerRequestDraft(
  partial?: Partial<BuyerRequestDraft>,
): BuyerRequestDraft {
  const now = new Date().toISOString();
  return {
    catalogVersion: 0,
    categorySlug: '',
    typeSlug: '',
    items: [],
    attributes: {},
    startDate: '',
    endDate: '',
    startTime: '',
    stateSlug: '',
    locationSlug: '',
    venueText: '',
    budgetMinMinor: null,
    budgetMaxMinor: null,
    involvement: 'assist',
    currentStep: 'category',
    updatedAt: now,
    ...partial,
  };
}

export function stepIndex(step: BuyerRequestStepId): number {
  return BUYER_REQUEST_STEPS.indexOf(step);
}

export function nextBuyerStep(step: BuyerRequestStepId): BuyerRequestStepId | null {
  const index = stepIndex(step);
  return index >= 0 && index < BUYER_REQUEST_STEPS.length - 1
    ? BUYER_REQUEST_STEPS[index + 1]!
    : null;
}

export function previousBuyerStep(step: BuyerRequestStepId): BuyerRequestStepId | null {
  const index = stepIndex(step);
  return index > 0 ? BUYER_REQUEST_STEPS[index - 1]! : null;
}

export function validateBuyerStep(
  step: BuyerRequestStepId,
  draft: BuyerRequestDraft,
  options?: { locationRequired?: boolean },
): string | null {
  const locationRequired = options?.locationRequired ?? true;

  switch (step) {
    case 'category':
      return draft.categorySlug ? null : 'Pick a category.';
    case 'type':
      return draft.typeSlug ? null : 'Pick a type.';
    case 'services':
      return draft.items.length > 0 ? null : 'Pick at least one service.';
    case 'details': {
      for (const item of draft.items) {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
          return 'Enter a quantity for each service.';
        }
      }
      return null;
    }
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) {
        return 'Pick a date.';
      }
      if (draft.endDate && draft.endDate < draft.startDate) {
        return 'End date must be on or after the start date.';
      }
      return null;
    case 'location':
      if (!locationRequired) {
        return null;
      }
      if (!draft.stateSlug) {
        return 'Pick a state.';
      }
      if (!draft.locationSlug) {
        return 'Pick a location.';
      }
      return null;
    case 'budget': {
      if (
        draft.budgetMinMinor !== null &&
        draft.budgetMaxMinor !== null &&
        draft.budgetMinMinor > draft.budgetMaxMinor
      ) {
        return 'Minimum budget cannot be above maximum.';
      }
      return null;
    }
    case 'involvement':
      return draft.involvement ? null : 'Pick how involved AskAlert should be.';
    case 'review':
      return null;
    default:
      return null;
  }
}

const DRAFT_KEY_PREFIX = 'askalert.buyer-request.draft.v1:';

export function buyerDraftStorageKey(categorySlug: string): string {
  return `${DRAFT_KEY_PREFIX}${categorySlug || 'any'}`;
}

export function readBuyerDraft(categorySlug: string): BuyerRequestDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(buyerDraftStorageKey(categorySlug));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as BuyerRequestDraft;
    return emptyBuyerRequestDraft(parsed);
  } catch {
    return null;
  }
}

export function writeBuyerDraft(draft: BuyerRequestDraft): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(
      buyerDraftStorageKey(draft.categorySlug || 'any'),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Ignore quota failures.
  }
}

export function clearBuyerDraft(categorySlug: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.removeItem(buyerDraftStorageKey(categorySlug));
  } catch {
    // Ignore.
  }
}
