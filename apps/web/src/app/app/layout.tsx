import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BottomNav } from '../../components/app/bottom-nav';
import { MockStoreProvider } from '../../lib/app/mock-store';

export const metadata: Metadata = {
  title: 'AskAlert app',
  description: 'Ask verified vendors in Lagos. Compare offers. Protect your payment.',
};

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <MockStoreProvider>
      <div className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_-10%,_color-mix(in_srgb,var(--orange-500)_10%,transparent),_transparent_55%),var(--background)]">
        <div className="mx-auto min-h-screen w-full max-w-lg pb-28">{children}</div>
        <BottomNav />
      </div>
    </MockStoreProvider>
  );
}
