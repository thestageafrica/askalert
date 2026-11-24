'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-provider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user, supabaseConfigured } = useAuth();
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
    }
  }, [pathname, ready, router, supabaseConfigured, user]);

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

  return <>{children}</>;
}
