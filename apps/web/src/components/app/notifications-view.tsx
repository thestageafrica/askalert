'use client';

import Link from 'next/link';
import { Button, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useNotificationsStore } from '../../lib/app/notifications-store';

export function NotificationsView() {
  const { items, unreadCount, markRead, markAllRead } = useNotificationsStore();

  return (
    <div>
      <AppHeader
        title="Notifications"
        subtitle="Same updates as push — stored in the app."
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              className="rounded-full border border-surface/20 px-3 py-2 text-xs font-bold text-surface"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          ) : null
        }
      />
      <div className="space-y-3 px-4 pt-2">
        {items.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
            <Button href="/app" className="mt-4">
              Back home
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => markRead(item.id)}
              className={cn(
                'block rounded-[1.4rem] border p-4 transition hover:-translate-y-0.5',
                item.readAt
                  ? 'border-border/60 bg-card'
                  : 'border-orange-500/30 bg-orange-500/10',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-extrabold text-foreground">{item.title}</p>
                {!item.readAt ? (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-orange-500" />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString('en-NG')}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
