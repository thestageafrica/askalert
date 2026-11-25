'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-provider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user, profile, supabaseConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/app/';

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!supabaseConfigured) {
      return;
    }
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth/sign-in/?next=${next}`);
      return;
    }
    // Google (and any OAuth) signup skips the phone field — collect it before /app.
    if (profile && !profile.phoneE164) {
      router.replace('/auth/complete-profile/');
    }
  }, [pathname, profile, ready, router, supabaseConfigured, user]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  if (supabaseConfigured && !user) {
    return null;
  }

  if (supabaseConfigured && profile && !profile.phoneE164) {
    return null;
  }

  return <>{children}</>;
}
