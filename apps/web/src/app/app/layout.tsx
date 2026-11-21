import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BottomNav } from '../../components/app/bottom-nav';
import { InstallPromptProvider } from '../../components/pwa/install-prompt';
import { MockStoreProvider } from '../../lib/app/mock-store';

export const metadata: Metadata = {
  title: 'AskAlert app',
  description: 'Ask verified vendors in Lagos. Compare offers. Protect your payment.',
};

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <InstallPromptProvider>
      <MockStoreProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-surface-subtle">
          <div className="mx-auto min-h-screen w-full max-w-lg pb-28">{children}</div>
          <BottomNav />
        </div>
      </MockStoreProvider>
    </InstallPromptProvider>
  );
}
