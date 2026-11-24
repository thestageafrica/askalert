'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '../lib/admin-auth';

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/sign-in/?next=${next}`);
    }
  }, [pathname, ready, router, user]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/70">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/70">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
