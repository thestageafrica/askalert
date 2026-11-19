'use client';

import { ThemeProvider, ToastProvider, type Theme } from '@askalert/ui';
import type { ReactNode } from 'react';

export function Providers({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
