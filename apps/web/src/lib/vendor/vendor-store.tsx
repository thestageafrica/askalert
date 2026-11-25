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
  type VendorBooking,
  type VendorLead,
  type VendorLeadStatus,
  type VendorProfileDraft,
  type VendorStatus,
} from './types';
import { SEED_VENDOR_BOOKINGS, SEED_VENDOR_LEADS } from './mock-leads';
import { submitForReview, transitionVendorStatus } from './status';

const STORAGE_KEY = 'askalert.vendor.v1';

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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as Persisted;
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
      setDraft({ ...emptyDraft(), ...saved.draft });
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
      const rest = current.rateCards.filter((item) => item.categorySlug !== card.categorySlug);
      return {
        ...current,
        rateCards: [...rest, card],
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

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
