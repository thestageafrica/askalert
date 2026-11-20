'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { listSeedCategories } from '@askalert/category-engine';
import { Button, Sheet, cn } from '@askalert/ui';

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
  const liveCategories = listSeedCategories().filter(
    (category) => category.status === 'pilot' || category.status === 'live',
  );

  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <>
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))]"
      >
        <div className="relative mx-auto max-w-lg">
          <div className="flex items-end justify-between rounded-[1.75rem] border border-surface/10 bg-navy-950/92 px-1.5 pb-2 pt-2 shadow-[0_-8px_32px_rgba(10,15,51,0.35)] backdrop-blur-xl">
            {left.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}

            {/* Spacer for the raised Ask button */}
            <div className="w-[4.75rem] shrink-0" aria-hidden />

            {right.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 -top-7 flex justify-center">
            <button
              type="button"
              aria-label="Ask AskAlert"
              onClick={() => setAskOpen(true)}
              className={cn(
                'pointer-events-auto flex size-[3.85rem] items-center justify-center rounded-full',
                'bg-gradient-to-br from-orange-400 to-orange-500 text-navy-900',
                'shadow-[0_12px_28px_var(--glow-orange-strong)]',
                // Halo matches the navy nav (semi-transparent), like the sample cutout gap
                'ring-[6px] ring-navy-950/75',
                'transition hover:-translate-y-0.5 hover:brightness-105',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950',
              )}
            >
              <AskIcon />
            </button>
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
              className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-border bg-card-muted px-4 text-left text-sm font-bold text-foreground"
              onClick={() => {
                setAskOpen(false);
                router.push(`/app/new/${category.slug}`);
              }}
            >
              <span>{category.name}</span>
              <span className="text-xs font-semibold text-orange-600">Start</span>
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
        'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold tracking-wide',
        active ? 'text-orange-500' : 'text-surface/70 hover:text-surface',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {item.icon(active)}
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
