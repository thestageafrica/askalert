'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button, Sheet, cn } from '@askalert/ui';
import { useCategories } from '../../lib/use-categories';

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: (active: boolean) => ReactNode;
};

const items: NavItem[] = [
  {
    href: '/app',
    label: 'Home',
    match: (path) => path === '/app',
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    href: '/app/requests',
    label: 'Requests',
    match: (path) => path.startsWith('/app/requests') || path.startsWith('/app/request'),
    icon: (active) => <BellIcon active={active} />,
  },
  {
    href: '/app/chats',
    label: 'Chats',
    match: (path) => path.startsWith('/app/chat'),
    icon: (active) => <ChatIcon active={active} />,
  },
  {
    href: '/app/account',
    label: 'Account',
    match: (path) => path.startsWith('/app/account'),
    icon: (active) => <PersonIcon active={active} />,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [askOpen, setAskOpen] = useState(false);
  const { categories } = useCategories();
  const liveCategories = askOpen
    ? categories.filter(
        (category) => category.status === 'pilot' || category.status === 'live',
      )
    : [];

  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <>
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))]"
      >
        <div className="relative mx-auto max-w-lg">
          <div className="flex items-end justify-between rounded-[1.75rem] border border-surface/10 bg-navy-950 px-1.5 pb-2 pt-2 shadow-[0_-8px_32px_color-mix(in_srgb,var(--navy-950)_35%,transparent)]">
            {left.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}

            <button
              type="button"
              onClick={() => setAskOpen(true)}
              className={cn(
                'relative flex min-h-14 w-[5.25rem] shrink-0 flex-col items-center justify-end gap-1 px-1',
                'text-[10px] font-semibold tracking-wide text-orange-400',
                'focus-visible:outline-none',
              )}
            >
              <span
                className={cn(
                  'absolute -top-7 flex size-[3.85rem] items-center justify-center rounded-full',
                  'bg-gradient-to-br from-orange-400 to-orange-500 text-navy-900',
                  'shadow-[0_12px_28px_var(--glow-orange-strong)]',
                  'ring-[6px] ring-navy-950/75',
                  'transition hover:-translate-y-0.5 hover:brightness-105',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950',
                )}
              >
                <AskIcon />
              </span>
              Start Ask
            </button>

            {right.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      <Sheet open={askOpen} onOpenChange={setAskOpen} title="What do you need?">
        <p className="text-sm text-muted-foreground">
          Pick a live category. AskAlert will chase verified vendors for you.
        </p>
        <div className="mt-5 space-y-2">
          {liveCategories.map((category) => (
            <button
              key={category.slug}
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 text-left shadow-sm transition hover:border-orange-500/40 hover:bg-orange-500/5"
              onClick={() => {
                setAskOpen(false);
                router.push(`/app/new/${category.slug}`);
              }}
            >
              <span className="text-sm font-extrabold text-foreground">{category.name}</span>
              <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-navy-900">
                Start
              </span>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-4 w-full" onClick={() => setAskOpen(false)}>
          Cancel
        </Button>
      </Sheet>
    </>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold tracking-wide transition',
        active ? 'text-orange-400' : 'text-surface/65 hover:text-surface',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl transition',
          active && 'bg-orange-500/15',
        )}
      >
        {item.icon(active)}
      </span>
      {item.label}
    </Link>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="8"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
      <path
        d="M5.5 19.5c1.7-3 4-4.5 6.5-4.5s4.8 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Diagonal ask arrow — matches the elevated CTA in the mobile sample. */
function AskIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 17 17 7M10 7h7v7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
