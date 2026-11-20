'use client';

import { ThemeProvider, ToastProvider, type Theme } from '@askalert/ui';
import type { ReactNode } from 'react';
import { AdminStoreProvider } from '../lib/admin-store';
import { AdminShell } from './admin-shell';

export function Providers({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>
        <AdminStoreProvider>
          <AdminShell>{children}</AdminShell>
        </AdminStoreProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
