'use client';

import { ThemeProvider, ToastProvider, type Theme } from '@askalert/ui';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/auth-provider';
import { ModeProvider } from '../lib/auth/mode-provider';

export function Providers({
  children,
  defaultTheme = 'light',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>
        <AuthProvider>
          <ModeProvider>{children}</ModeProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
