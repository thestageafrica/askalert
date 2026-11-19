'use client';

import { ThemeProvider, ToastProvider, type Theme } from '@askalert/ui';
import type { ReactNode } from 'react';
import { InstallPromptProvider } from './pwa/install-prompt';

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
        <InstallPromptProvider>{children}</InstallPromptProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
