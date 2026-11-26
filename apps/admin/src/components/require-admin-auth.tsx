'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '../lib/admin-auth';

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { ready, user, role, mfaRequired, mfaVerified, supabaseConfigured } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!supabaseConfigured) {
      // Local/mock mode: allow shell without Supabase (role defaults in store).
      return;
    }
    if (!user || !role) {
      const next = encodeURIComponent(pathname);
      router.replace(`/sign-in/?next=${next}`);
      return;
    }
    if (mfaRequired && !mfaVerified) {
      const next = encodeURIComponent(pathname);
      router.replace(`/sign-in/?next=${next}`);
    }
  }, [mfaRequired, mfaVerified, pathname, ready, role, router, supabaseConfigured, user]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/70">
        Checking your session…
      </div>
    );
  }

  if (supabaseConfigured && (!user || !role || (mfaRequired && !mfaVerified))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/70">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
