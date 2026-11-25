import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomeView } from '../../components/app/home-view';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Ask AskAlert what you need in Lagos Nigeria.',
};

export default function AppHomePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4 lg:p-0" aria-busy="true" aria-label="Loading home">
          <div className="h-40 animate-pulse rounded-[1.5rem] bg-card-muted" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((slot) => (
              <div key={slot} className="h-44 animate-pulse rounded-[1.4rem] bg-card-muted" />
            ))}
          </div>
        </div>
      }
    >
      <HomeView />
    </Suspense>
  );
}
