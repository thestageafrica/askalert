import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppModeBar } from '../../components/auth/app-mode-bar';
import { RequireAuth } from '../../components/auth/require-auth';
import { BottomNav } from '../../components/app/bottom-nav';
import { PushPrompt } from '../../components/app/push-prompt';
import { InstallPromptProvider } from '../../components/pwa/install-prompt';
import { MockStoreProvider } from '../../lib/app/mock-store';
import { NotificationsStoreProvider } from '../../lib/app/notifications-store';
import { PlanStoreProvider } from '../../lib/app/plan-store';

export const metadata: Metadata = {
  title: 'AskAlert app',
  description: 'Ask verified vendors in Lagos. Compare offers. Protect your payment.',
};

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <InstallPromptProvider>
      <MockStoreProvider>
        <PlanStoreProvider>
          <NotificationsStoreProvider>
            <RequireAuth>
              <div className="relative min-h-screen overflow-x-hidden bg-surface-subtle">
                <AppModeBar />
                <div className="mx-auto min-h-screen w-full max-w-lg pb-28">{children}</div>
                <BottomNav />
                <PushPrompt />
              </div>
            </RequireAuth>
          </NotificationsStoreProvider>
        </PlanStoreProvider>
      </MockStoreProvider>
    </InstallPromptProvider>
  );
}
