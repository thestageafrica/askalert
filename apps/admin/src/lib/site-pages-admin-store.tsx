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
  getSeedSitePage,
  loadSitePage,
  saveSitePage,
  type ContactPageContent,
  type LegalPageContent,
  type PublicPageHeader,
  type SitePageContentMap,
  type SitePageSlug,
} from '@askalert/db';
import { adminBrowserClient, adminSupabaseEnabled } from './supabase-browser';

const STORAGE_KEY = 'askalert.admin.site-pages.v1';

type LocalBundle = Partial<SitePageContentMap>;

function loadLocal(): LocalBundle {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as LocalBundle;
  } catch {
    return {};
  }
}

function persistLocal(bundle: LocalBundle) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
}

type SitePagesAdminStore = {
  ready: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
  header: PublicPageHeader;
  privacy: LegalPageContent;
  terms: LegalPageContent;
  contact: ContactPageContent;
  setHeader: (next: PublicPageHeader) => void;
  setPrivacy: (next: LegalPageContent) => void;
  setTerms: (next: LegalPageContent) => void;
  setContact: (next: ContactPageContent) => void;
  savePage: (
    slug: SitePageSlug,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  resetPage: (slug: SitePageSlug) => void;
  uploadHeaderImage: (
    file: File,
  ) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
};

const SitePagesAdminContext = createContext<SitePagesAdminStore | null>(null);

export function SitePagesAdminProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [header, setHeaderState] = useState<PublicPageHeader>(() => getSeedSitePage('header'));
  const [privacy, setPrivacyState] = useState<LegalPageContent>(() => getSeedSitePage('privacy'));
  const [terms, setTermsState] = useState<LegalPageContent>(() => getSeedSitePage('terms'));
  const [contact, setContactState] = useState<ContactPageContent>(() => getSeedSitePage('contact'));

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const local = loadLocal();
      if (!cancelled) {
        if (local.header) setHeaderState(local.header);
        if (local.privacy) setPrivacyState(local.privacy);
        if (local.terms) setTermsState(local.terms);
        if (local.contact) setContactState(local.contact);
        setReady(true);
      }

      if (!adminSupabaseEnabled()) {
        return;
      }
      const client = adminBrowserClient();
      if (!client) {
        return;
      }

      const [remoteHeader, remotePrivacy, remoteTerms, remoteContact] = await Promise.all([
        loadSitePage('header', client),
        loadSitePage('privacy', client),
        loadSitePage('terms', client),
        loadSitePage('contact', client),
      ]);

      if (cancelled) {
        return;
      }

      const next: LocalBundle = {
        header: remoteHeader,
        privacy: remotePrivacy,
        terms: remoteTerms,
        contact: remoteContact,
      };
      setHeaderState(remoteHeader);
      setPrivacyState(remotePrivacy);
      setTermsState(remoteTerms);
      setContactState(remoteContact);
      persistLocal(next);
      setLastSyncedAt(new Date().toISOString());
      setSyncError(null);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((patch: LocalBundle) => {
    const current = loadLocal();
    persistLocal({ ...current, ...patch });
  }, []);

  const setHeader = useCallback(
    (next: PublicPageHeader) => {
      setHeaderState(next);
      persist({ header: next });
    },
    [persist],
  );

  const setPrivacy = useCallback(
    (next: LegalPageContent) => {
      setPrivacyState(next);
      persist({ privacy: next });
    },
    [persist],
  );

  const setTerms = useCallback(
    (next: LegalPageContent) => {
      setTermsState(next);
      persist({ terms: next });
    },
    [persist],
  );

  const setContact = useCallback(
    (next: ContactPageContent) => {
      setContactState(next);
      persist({ contact: next });
    },
    [persist],
  );

  const savePage = useCallback(
    async (slug: SitePageSlug) => {
      const contentMap: SitePageContentMap = { header, privacy, terms, contact };
      const content = contentMap[slug];

      if (!adminSupabaseEnabled()) {
        persist({ [slug]: content });
        setLastSyncedAt(new Date().toISOString());
        return { ok: true as const };
      }

      const client = adminBrowserClient();
      if (!client) {
        return { ok: false as const, error: 'Could not create Supabase client.' };
      }

      const result = await saveSitePage(slug, content as never, client);
      if (!result.ok) {
        setSyncError(result.error);
        return result;
      }

      persist({ [slug]: content });
      setLastSyncedAt(new Date().toISOString());
      setSyncError(null);
      return { ok: true as const };
    },
    [contact, header, persist, privacy, terms],
  );

  const resetPage = useCallback(
    (slug: SitePageSlug) => {
      if (slug === 'header') setHeader(getSeedSitePage('header'));
      if (slug === 'privacy') setPrivacy(getSeedSitePage('privacy'));
      if (slug === 'terms') setTerms(getSeedSitePage('terms'));
      if (slug === 'contact') setContact(getSeedSitePage('contact'));
    },
    [setContact, setHeader, setPrivacy, setTerms],
  );

  const uploadHeaderImage = useCallback(async (file: File) => {
    if (!adminSupabaseEnabled()) {
      return {
        ok: false as const,
        error: 'Supabase is not configured. Paste an image URL instead.',
      };
    }
    const client = adminBrowserClient();
    if (!client) {
      return { ok: false as const, error: 'Could not create Supabase client.' };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `public-pages/header-${Date.now()}.${ext}`;
    const { error } = await client.storage.from('site-assets').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (error) {
      return { ok: false as const, error: error.message };
    }

    const { data } = client.storage.from('site-assets').getPublicUrl(path);
    return { ok: true as const, url: data.publicUrl };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      syncError,
      lastSyncedAt,
      header,
      privacy,
      terms,
      contact,
      setHeader,
      setPrivacy,
      setTerms,
      setContact,
      savePage,
      resetPage,
      uploadHeaderImage,
    }),
    [
      contact,
      header,
      lastSyncedAt,
      privacy,
      ready,
      resetPage,
      savePage,
      setContact,
      setHeader,
      setPrivacy,
      setTerms,
      syncError,
      terms,
      uploadHeaderImage,
    ],
  );

  return (
    <SitePagesAdminContext.Provider value={value}>{children}</SitePagesAdminContext.Provider>
  );
}

export function useSitePagesAdmin() {
  const ctx = useContext(SitePagesAdminContext);
  if (!ctx) {
    throw new Error('useSitePagesAdmin must be used inside SitePagesAdminProvider');
  }
  return ctx;
}
