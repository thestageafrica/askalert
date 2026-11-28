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
  'types',
  'services',
  'rate_cards',
  'areas',
  'availability',
  'documents',
  'payout',
  'review',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export type VendorEntityType = 'individual' | 'business';

/** Legacy per-category rate card (v1 onboarding). */
export type RateCard = {
  categorySlug: string;
  startingPriceMinor: number;
  minPriceMinor: number;
  maxPriceMinor: number;
  unit: string;
  notes: string;
};

export type ServiceRateCardBand = {
  dimMin: number;
  dimMax: number;
  basis: 'per_unit' | 'total';
  priceMinor: number;
  currency: 'NGN';
  label?: string;
};

export type ServiceRateCardPackage = {
  slug: string;
  name: string;
  priceMinor: number;
  inclusions: string[];
};

export type ServiceRateCardAddon = {
  id: string;
  name: string;
  priceMinor: number;
  basis: 'per_unit' | 'total' | 'flat';
};

export type ServiceRateCard = {
  categorySlug: string;
  serviceSlug: string;
  appliesToTypeSlugs: string[] | 'all';
  bands: ServiceRateCardBand[];
  priceMinor?: number;
  minChargeMinor?: number;
  packages: ServiceRateCardPackage[];
  allowCustomQuoteLarger: boolean;
  addons: ServiceRateCardAddon[];
  minNoticeHours: number;
  depositPct: number;
  inclusions: string[];
  exclusions: string[];
  notes: string;
  status: 'draft' | 'active' | 'paused';
  updatedAt: string;
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
  | 'id_selfie'
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
  /** Full name exactly as it appears on the government ID. */
  legalName: string;
  dateOfBirth: string;
  /** Residential address for individual vendors. */
  address: string;
  businessName: string;
  /** Registered / operating address for business vendors. */
  businessAddress: string;
  /** 11-digit NIN or BVN (digits only in validation). */
  ninOrBvn: string;
  categorySlugs: string[];
  typeSlugsByCategory: Record<string, string[]>;
  serviceSlugsByCategory: Record<string, string[]>;
  serviceRateCards: ServiceRateCard[];
  areaSlugs: string[];
  /** Legacy v1 rate cards — kept for migration display only. */
  rateCards?: RateCard[];
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

export const DEFAULT_WEEKLY_HOURS: DayHours[] = [
  { day: 'mon', open: true, start: '09:00', end: '18:00' },
  { day: 'tue', open: true, start: '09:00', end: '18:00' },
  { day: 'wed', open: true, start: '09:00', end: '18:00' },
  { day: 'thu', open: true, start: '09:00', end: '18:00' },
  { day: 'fri', open: true, start: '09:00', end: '18:00' },
  { day: 'sat', open: true, start: '10:00', end: '16:00' },
  { day: 'sun', open: false, start: '10:00', end: '16:00' },
];