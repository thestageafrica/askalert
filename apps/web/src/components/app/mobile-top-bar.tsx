'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo, cn } from '@askalert/ui';
import { useAuth } from '../../lib/auth/auth-provider';
import { useNotificationsStore } from '../../lib/app/notifications-store';

const TITLES: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (path) => path === '/app' || path === '/app/', title: '' },
  { match: (path) => path.startsWith('/app/menu'), title: 'Menu' },
  { match: (path) => path.startsWith('/app/requests') || path.startsWith('/app/request'), title: 'Requests' },
  { match: (path) => path.startsWith('/app/chat'), title: 'Messages' },
  { match: (path) => path.startsWith('/app/notifications'), title: 'Notifications' },
  { match: (path) => path.startsWith('/app/account'), title: 'Account' },
  { match: (path) => path.startsWith('/app/plan'), title: 'Plan' },
  { match: (path) => path.startsWith('/app/invoices'), title: 'Invoices' },
  { match: (path) => path.startsWith('/app/disputes'), title: 'Disputes' },
  { match: (path) => path.startsWith('/app/help'), title: 'Help' },
  { match: (path) => path.startsWith('/app/saved'), title: 'Saved vendors' },
  { match: (path) => path.startsWith('/app/new'), title: 'New ask' },
];

export function MobileTopBar() {
  const pathname = usePathname() || '/app/';
  const { profile, user } = useAuth();
  const { unreadCount } = useNotificationsStore();
  const title = TITLES.find((item) => item.match(pathname))?.title ?? 'AskAlert';

  const initials =
    (profile?.displayName || user?.email || 'A')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-md',
        'pt-[max(0.35rem,env(safe-area-inset-top))]',
      )}
    >
      <div className="mx-auto flex h-12 max-w-lg items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          {title ? (
            <p className="truncate text-sm font-extrabold text-foreground">{title}</p>
          ) : (
            <Link
              href="/app/"
              className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Logo className="h-7 w-auto" />
            </Link>
          )}
        </div>

        <Link
          href="/app/notifications/"
          className="relative inline-flex size-11 items-center justify-center rounded-full text-foreground transition hover:bg-navy-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <BellGlyph />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-extrabold text-navy-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/app/menu/"
          className="inline-flex size-11 items-center justify-center rounded-full bg-navy-950 text-[11px] font-extrabold text-surface transition hover:bg-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label="Open menu"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}

function BellGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
