'use client';

import Link from 'next/link';
import { Button } from '@askalert/ui';
import { AppHeader } from './app-header';
import { EmptyState } from './empty-state';
import { StatusPill } from './status-pill';
import { useMockStore } from '../../lib/app/mock-store';

export function RequestsListView() {
  const { requests } = useMockStore();

  return (
    <div>
      <AppHeader title="Requests" subtitle="Everything AskAlert is chasing for you." />
      <div className="space-y-3 px-4 pt-2">
        {requests.length === 0 ? (
          <EmptyState
            title="No asks yet"
            description="Start with shortlets, events or home care."
            action={
              <Button href="/app">Go home</Button>
            }
          />
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/app/request/${request.id}`}
              className="block rounded-[1.4rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)] transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    {request.categoryName}
                  </p>
                  <p className="mt-1 font-extrabold text-foreground">{request.title}</p>
                </div>
                <StatusPill status={request.status} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {request.quotes.length} quote{request.quotes.length === 1 ? '' : 's'} · tap to open
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
