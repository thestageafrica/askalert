export const VENDOR_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'suspended',
] as const;

export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const VERIFICATION_TIERS = ['phone', 'id', 'business', 'trusted'] as const;
export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

export const ONBOARDING_STEPS = [
  'who',
  'categories',
  'areas',
  'rate_cards',
  'availability',
  'documents',
  'payout',
  'review',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export type VendorEntityType = 'individual' | 'business';

export type RateCard = {
  categorySlug: string;
  startingPriceMinor: number;
  minPriceMinor: number;
  maxPriceMinor: number;
  unit: string;
  notes: string;
};

export type WeekDay =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun';

export type DayHours = {
  day: WeekDay;
  open: boolean;
  start: string;
  end: string;
};

export type VendorDocumentKind =
  | 'id'
  | 'business_proof'
  | 'licence'
  | 'portfolio';

export type VendorDocument = {
  id: string;
  kind: VendorDocumentKind;
  fileName: string;
  mime: string;
  bytes: number;
  /** Local object URL or storage path. */
  path: string;
  ownerUserId: string;
  scanned: boolean;
  createdAt: string;
};

export type PayoutDetails = {
  bankName: string;
  accountName: string;
  /** Full number kept in memory for draft; masked for display. */
  accountNumber: string;
};

export type VendorProfileDraft = {
  entityType: VendorEntityType;
  displayName: string;
  businessName: string;
  categorySlugs: string[];
  areaSlugs: string[];
  rateCards: RateCard[];
  weeklyHours: DayHours[];
  blackoutDates: string[];
  documents: VendorDocument[];
  payout: PayoutDetails;
  status: VendorStatus;
  verificationTiers: VerificationTier[];
  currentStep: OnboardingStepId;
  submittedAt: string | null;
  updatedAt: string;
};

export type VendorLeadStatus = 'new' | 'quoted' | 'declined' | 'questioned' | 'booked';

export type VendorLead = {
  id: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  area: string;
  budgetMinor: number;
  summary: string;
  status: VendorLeadStatus;
  createdAt: string;
  chatId?: string;
};

export type VendorBooking = {
  id: string;
  leadId: string;
  title: string;
  amountMinor: number;
  when: string;
  status: 'upcoming' | 'done' | 'cancelled';
};

export const SERVICE_AREA_LEAVES = [
  { slug: 'lekki-phase-1', name: 'Lekki Phase 1' },
  { slug: 'lekki', name: 'Lekki' },
  { slug: 'victoria-island', name: 'Victoria Island' },
  { slug: 'ikoyi', name: 'Ikoyi' },
  { slug: 'ajah', name: 'Ajah' },
  { slug: 'oniru', name: 'Oniru' },
] as const;

export const DEFAULT_WEEKLY_HOURS: DayHours[] = [
  { day: 'mon', open: true, start: '09:00', end: '18:00' },
  { day: 'tue', open: true, start: '09:00', end: '18:00' },
  { day: 'wed', open: true, start: '09:00', end: '18:00' },
  { day: 'thu', open: true, start: '09:00', end: '18:00' },
  { day: 'fri', open: true, start: '09:00', end: '18:00' },
  { day: 'sat', open: true, start: '10:00', end: '16:00' },
  { day: 'sun', open: false, start: '10:00', end: '16:00' },
];
