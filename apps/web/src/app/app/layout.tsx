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
      <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(120%_70%_at_50%_-8%,_color-mix(in_srgb,var(--orange-500)_14%,transparent),_transparent_52%),radial-gradient(80%_50%_at_100%_30%,_color-mix(in_srgb,var(--navy-700)_8%,transparent),_transparent_55%),var(--surface-subtle)]">
        <div className="mx-auto min-h-screen w-full max-w-lg pb-28">{children}</div>
        <BottomNav />
      </div>
    </MockStoreProvider>
  );
}
