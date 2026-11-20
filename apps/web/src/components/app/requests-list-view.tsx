'use client';

import Link from 'next/link';
import { Button } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useMockStore } from '../../lib/app/mock-store';

export function RequestsListView() {
  const { requests } = useMockStore();

  return (
    <div>
      <AppHeader title="Requests" subtitle="Everything AskAlert is chasing for you." />
      <div className="space-y-3 px-4 pt-5">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="font-semibold text-foreground">No asks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with shortlets, events or home care.
            </p>
            <Button href="/app" className="mt-4">
              Go home
            </Button>
          </div>
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/app/request/${request.id}`}
              className="block rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-sm transition hover:-translate-y-0.5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                {request.categoryName}
              </p>
              <p className="mt-1 font-extrabold text-foreground">{request.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.status.replaceAll('_', ' ')} · {request.quotes.length} quotes
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
