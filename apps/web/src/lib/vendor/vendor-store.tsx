'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_WEEKLY_HOURS,
  type OnboardingStepId,
  type RateCard,
  type ServiceRateCard,
  type VendorBooking,
  type VendorLead,
  type VendorLeadStatus,
  type VendorProfileDraft,
  type VendorStatus,
} from './types';
import { SEED_VENDOR_BOOKINGS, SEED_VENDOR_LEADS } from './mock-leads';
import { submitForReview, transitionVendorStatus } from './status';
import { normalizePersistedDraft } from './migrate-draft';
import { serviceRateCardKey } from './vendor-catalog';

const STORAGE_KEY = 'askalert.vendor.v2';
const LEGACY_STORAGE_KEY = 'askalert.vendor.v1';

type Persisted = {
  draft: VendorProfileDraft;
  leads: VendorLead[];
  bookings: VendorBooking[];
};

type VendorStore = {
  ready: boolean;
  draft: VendorProfileDraft;
  leads: VendorLead[];
  bookings: VendorBooking[];
  updateDraft: (patch: Partial<VendorProfileDraft>) => void;
  setStep: (step: OnboardingStepId) => void;
  upsertRateCard: (card: RateCard) => void;
  upsertServiceRateCard: (card: ServiceRateCard) => void;
  setServiceRateCardStatus: (
    categorySlug: string,
    serviceSlug: string,
    status: ServiceRateCard['status'],
  ) => void;
  setLeadStatus: (leadId: string, status: VendorLeadStatus, chatId?: string) => void;
  submitOnboarding: () => { ok: true } | { ok: false; error: string };
  setVendorStatus: (status: VendorStatus) => { ok: true } | { ok: false; error: string };
  isOnboardingComplete: boolean;
  openLeads: number;
};

const VendorStoreContext = createContext<VendorStore | null>(null);

function emptyDraft(): VendorProfileDraft {
  const now = new Date().toISOString();
  return {
    entityType: 'individual',
    displayName: '',
    businessName: '',
    categorySlugs: [],
    typeSlugsByCategory: {},
    serviceSlugsByCategory: {},
    serviceRateCards: [],
    areaSlugs: [],
    rateCards: [],
    weeklyHours: DEFAULT_WEEKLY_HOURS,
    blackoutDates: [],
    documents: [],
    payout: { bankName: '', accountName: '', accountNumber: '' },
    status: 'draft',
    verificationTiers: ['phone'],
    currentStep: 'who',
    submittedAt: null,
    updatedAt: now,
  };
}

function readPersisted(): Persisted | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Persisted;
      if (parsed?.draft) {
        return {
          ...parsed,
          draft: normalizePersistedDraft(parsed.draft),
        };
      }
    }

    const rawV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as Persisted;
      if (parsed?.draft) {
        const migrated: Persisted = {
          leads: parsed.leads,
          bookings: parsed.bookings,
          draft: normalizePersistedDraft(parsed.draft),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function writePersisted(value: Persisted) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function VendorStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<VendorProfileDraft>(emptyDraft);
  const [leads, setLeads] = useState<VendorLead[]>(SEED_VENDOR_LEADS);
  const [bookings, setBookings] = useState<VendorBooking[]>(SEED_VENDOR_BOOKINGS);

  useEffect(() => {
    const saved = readPersisted();
    if (saved?.draft) {
      setDraft(normalizePersistedDraft(saved.draft));
      setLeads(saved.leads?.length ? saved.leads : SEED_VENDOR_LEADS);
      setBookings(saved.bookings ?? SEED_VENDOR_BOOKINGS);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writePersisted({ draft, leads, bookings });
  }, [ready, draft, leads, bookings]);

  const updateDraft = useCallback((patch: Partial<VendorProfileDraft>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setStep = useCallback((step: OnboardingStepId) => {
    setDraft((current) => ({
      ...current,
      currentStep: step,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const upsertRateCard = useCallback((card: RateCard) => {
    setDraft((current) => {
      const legacy = current.rateCards ?? [];
      const rest = legacy.filter((item) => item.categorySlug !== card.categorySlug);
      return {
        ...current,
        rateCards: [...rest, card],
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const upsertServiceRateCard = useCallback((card: ServiceRateCard) => {
    setDraft((current) => {
      const key = serviceRateCardKey(card.categorySlug, card.serviceSlug);
      const rest = current.serviceRateCards.filter(
        (item) => serviceRateCardKey(item.categorySlug, item.serviceSlug) !== key,
      );
      return {
        ...current,
        serviceRateCards: [...rest, { ...card, updatedAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const setServiceRateCardStatus = useCallback(
    (categorySlug: string, serviceSlug: string, status: ServiceRateCard['status']) => {
      setDraft((current) => {
        const key = serviceRateCardKey(categorySlug, serviceSlug);
        const found = current.serviceRateCards.find(
          (item) => serviceRateCardKey(item.categorySlug, item.serviceSlug) === key,
        );
        if (!found) {
          return current;
        }
        return {
          ...current,
          serviceRateCards: current.serviceRateCards.map((item) =>
            serviceRateCardKey(item.categorySlug, item.serviceSlug) === key
              ? { ...item, status, updatedAt: new Date().toISOString() }
              : item,
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [],
  );

  const setLeadStatus = useCallback(
    (leadId: string, status: VendorLeadStatus, chatId?: string) => {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? { ...lead, status, chatId: chatId ?? lead.chatId }
            : lead,
        ),
      );
    },
    [],
  );

  const submitOnboarding = useCallback(() => {
    const result = submitForReview(draft.status);
    if (!result.ok) {
      return result;
    }
    setDraft((current) => ({
      ...current,
      status: result.status,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 'review',
    }));
    return { ok: true as const };
  }, [draft.status]);

  const setVendorStatus = useCallback((status: VendorStatus) => {
    let error: string | null = null;
    setDraft((current) => {
      const result = transitionVendorStatus(current.status, status);
      if (!result.ok) {
        error = result.error;
        return current;
      }
      return {
        ...current,
        status: result.status,
        updatedAt: new Date().toISOString(),
      };
    });
    return error ? { ok: false as const, error } : { ok: true as const };
  }, []);

  const isOnboardingComplete =
    draft.status === 'pending_review' ||
    draft.status === 'approved' ||
    draft.status === 'suspended';

  const openLeads = leads.filter((lead) => lead.status === 'new' || lead.status === 'questioned')
    .length;

  const value = useMemo(
    () => ({
      ready,
      draft,
      leads,
      bookings,
      updateDraft,
      setStep,
      upsertRateCard,
      upsertServiceRateCard,
      setServiceRateCardStatus,
      setLeadStatus,
      submitOnboarding,
      setVendorStatus,
      isOnboardingComplete,
      openLeads,
    }),
    [
      ready,
      draft,
      leads,
      bookings,
      updateDraft,
      setStep,
      upsertRateCard,
      upsertServiceRateCard,
      setServiceRateCardStatus,
      setLeadStatus,
      submitOnboarding,
      setVendorStatus,
      isOnboardingComplete,
      openLeads,
    ],
  );

  return <VendorStoreContext.Provider value={value}>{children}</VendorStoreContext.Provider>;
}

export function useVendorStore() {
  const ctx = useContext(VendorStoreContext);
  if (!ctx) {
    throw new Error('useVendorStore must be used inside VendorStoreProvider');
  }
  return ctx;
}