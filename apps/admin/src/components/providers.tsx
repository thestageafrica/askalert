'use client';

import { ThemeProvider, ToastProvider, type Theme } from '@askalert/ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminAuthProvider } from '../lib/admin-auth';
import { AdminStoreProvider } from '../lib/admin-store';
import { BillingAdminProvider } from '../lib/billing-admin-store';
import { AdminShell } from './admin-shell';
import { RequireAdminAuth } from './require-admin-auth';

function isAuthRoute(pathname: string | null) {
  if (!pathname) {
    return false;
  }
  return pathname === '/sign-in' || pathname.startsWith('/sign-in/');
}

export function Providers({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const pathname = usePathname();
  const authRoute = isAuthRoute(pathname);

  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>
        <AdminAuthProvider>
          {authRoute ? (
            children
          ) : (
            <RequireAdminAuth>
              <AdminStoreProvider>
                <BillingAdminProvider>
                  <AdminShell>{children}</AdminShell>
                </BillingAdminProvider>
              </AdminStoreProvider>
            </RequireAdminAuth>
          )}
        </AdminAuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
