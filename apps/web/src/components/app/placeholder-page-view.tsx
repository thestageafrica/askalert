'use client';

import { Button } from '@askalert/ui';
import { EmptyState } from './empty-state';

export function PlaceholderPageView({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  actionHref = '/app/',
  actionLabel = 'Back home',
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div>
      <div className="px-4 pt-3 lg:hidden">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="hidden px-0 pb-4 pt-2 lg:block">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="px-4 pt-3 lg:px-0">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={<Button href={actionHref}>{actionLabel}</Button>}
        />
      </div>
    </div>
  );
}
