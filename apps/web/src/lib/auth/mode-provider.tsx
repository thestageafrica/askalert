'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  homePathForMode,
  modeFromPathname,
  vendorModeCta,
  type AppMode,
} from '@askalert/db';
import { useAuth } from './auth-provider';

type ModeContextValue = {
  mode: AppMode;
  switchTo: (mode: AppMode) => void;
  vendorCta: ReturnType<typeof vendorModeCta>;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { roles, setLastMode, ready } = useAuth();
  const mode = modeFromPathname(pathname);
  const vendorCta = vendorModeCta(roles);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!pathname.startsWith('/app') && !pathname.startsWith('/vendor')) {
      return;
    }
    void setLastMode(mode);
  }, [mode, pathname, ready, setLastMode]);

  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      vendorCta,
      switchTo(next) {
        if (next === 'vendor' && vendorCta.kind === 'become') {
          router.push(vendorCta.href);
          return;
        }
        router.push(homePathForMode(next));
      },
    }),
    [mode, router, vendorCta],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return ctx;
}
