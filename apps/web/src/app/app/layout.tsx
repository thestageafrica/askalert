import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RequireAuth } from '../../components/auth/require-auth';
import { BuyerAppShell } from '../../components/app/buyer-app-shell';
import { InstallPromptProvider } from '../../components/pwa/install-prompt';
import { MockStoreProvider } from '../../lib/app/mock-store';
import { NotificationsStoreProvider } from '../../lib/app/notifications-store';
import { PlanStoreProvider } from '../../lib/app/plan-store';

export const metadata: Metadata = {
  title: 'AskAlert app',
  description: 'Ask verified vendors in Lagos Nigeria. Compare offers. Book with confidence.',
};

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <InstallPromptProvider>
      <MockStoreProvider>
        <PlanStoreProvider>
          <NotificationsStoreProvider>
            <RequireAuth>
              <BuyerAppShell>{children}</BuyerAppShell>
            </RequireAuth>
          </NotificationsStoreProvider>
        </PlanStoreProvider>
      </MockStoreProvider>
    </InstallPromptProvider>
  );
}
