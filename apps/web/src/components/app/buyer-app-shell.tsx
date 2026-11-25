'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Logo, cn } from '@askalert/ui';
import { useAuth } from '../../lib/auth/auth-provider';
import { useMode } from '../../lib/auth/mode-provider';
import { useNotificationsStore } from '../../lib/app/notifications-store';
import { usePlanStore } from '../../lib/app/plan-store';
import { AppModeBar } from '../auth/app-mode-bar';
import { BottomNav } from './bottom-nav';
import { PushPrompt } from './push-prompt';

const PRIMARY_LINKS = [
  { href: '/app/', label: 'Home', match: (path: string) => path === '/app' || path === '/app/' },
  {
    href: '/app/requests/',
    label: 'Requests',
    match: (path: string) => path.startsWith('/app/requests') || path.startsWith('/app/request'),
  },
  {
    href: '/app/chats/',
    label: 'Messages',
    match: (path: string) => path.startsWith('/app/chat'),
  },
  {
    href: '/app/requests/',
    label: 'Bookings',
    match: (path: string) => path.includes('/done') || path.includes('/success'),
  },
] as const;

export function BuyerAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface-subtle lg:bg-[radial-gradient(90%_50%_at_50%_-10%,_color-mix(in_srgb,var(--orange-500)_10%,transparent),_transparent_55%),linear-gradient(180deg,var(--surface-subtle)_0%,color-mix(in_srgb,var(--navy-950)_3%,var(--surface-subtle))_100%)]">
      {/* Mobile / tablet: keep current chrome */}
      <div className="lg:hidden">
        <AppModeBar />
      </div>

      {/* Desktop sticky header */}
      <div className="hidden lg:block">
        <DesktopBuyerHeader />
      </div>

      <div
        className={cn(
          'mx-auto min-h-screen w-full',
          'max-w-lg pb-28',
          'lg:max-w-[1280px] lg:px-8 lg:pb-16 lg:pt-8',
        )}
      >
        {children}
      </div>

      <div className="lg:hidden">
        <BottomNav />
        <PushPrompt />
      </div>

      <DesktopBuyerFooter />
    </div>
  );
}

function DesktopBuyerHeader() {
  const pathname = usePathname() || '/app/';
  const router = useRouter();
  const searchId = useId();
  const { profile, user, signOut } = useAuth();
  const { mode, switchTo, vendorCta } = useMode();
  const { unreadCount } = useNotificationsStore();
  const { planName, check } = usePlanStore();
  const remaining = check('start_request').remaining ?? 0;
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const onSearch = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const q = query.trim();
      if (q) {
        router.push(`/app/?q=${encodeURIComponent(q)}`);
      } else {
        router.push('/app/');
      }
    },
    [query, router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
          return;
        }
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
  }, [menuOpen]);

  const initials =
    (profile?.displayName || user?.email || 'A')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 shadow-[0_10px_40px_color-mix(in_srgb,var(--navy-950)_6%,transparent)] backdrop-blur-xl">
      <div className="h-0.5 w-full bg-gradient-to-r from-navy-950 via-orange-500 to-orange-400" aria-hidden />
      <div className="mx-auto flex h-[4.25rem] max-w-[1280px] items-center gap-6 px-8">
        <Link
          href="/app/"
          className="shrink-0 rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Logo className="h-8 w-auto" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
          {PRIMARY_LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-bold transition duration-200',
                  active
                    ? 'bg-navy-950 text-surface shadow-sm'
                    : 'text-muted-foreground hover:bg-navy-950/5 hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={onSearch} className="relative ml-auto min-w-0 flex-1 max-w-md">
          <label htmlFor={searchId} className="sr-only">
            Search AskAlert
          </label>
          <input
            ref={searchRef}
            id={searchId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What do you need?  Press /"
            className={cn(
              'h-11 w-full rounded-full border border-border/70 bg-surface-subtle/90 px-4 pr-12 text-sm text-foreground shadow-inner',
              'placeholder:text-muted-foreground/80',
              'transition duration-200 focus:border-orange-500/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-orange-500/30',
            )}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            /
          </kbd>
        </form>

        <Link
          href="/app/plan/"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-800 transition hover:bg-orange-500/15 xl:inline-flex"
        >
          <span>{planName}</span>
          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] text-navy-900">
            {remaining} left
          </span>
        </Link>

        <Link
          href="/app/notifications/"
          className="relative inline-flex size-11 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition hover:border-orange-500/40 hover:bg-orange-500/5"
          aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <BellGlyph />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-extrabold text-navy-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full bg-navy-950 text-xs font-extrabold text-surface transition hover:bg-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {initials}
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_color-mix(in_srgb,var(--navy-950)_18%,transparent)]"
            >
              <div className="border-b border-border/70 px-4 py-3">
                <p className="truncate text-sm font-bold text-foreground">
                  {profile?.displayName || user?.email}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Buyer app</p>
              </div>
              <div className="p-2">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Mode
                </p>
                <div className="mb-2 flex gap-1 rounded-xl bg-surface-subtle p-1">
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      'min-h-9 flex-1 rounded-lg text-xs font-bold',
                      mode === 'buyer' ? 'bg-navy-950 text-surface' : 'text-muted-foreground',
                    )}
                    onClick={() => {
                      switchTo('buyer');
                      setMenuOpen(false);
                    }}
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      'min-h-9 flex-1 rounded-lg text-xs font-bold',
                      mode === 'vendor' ? 'bg-navy-950 text-surface' : 'text-muted-foreground',
                    )}
                    onClick={() => {
                      switchTo('vendor');
                      setMenuOpen(false);
                      if (vendorCta.kind === 'become') {
                        router.push(vendorCta.href);
                      }
                    }}
                  >
                    Vendor
                  </button>
                </div>
                <MenuLink href="/app/account/" onClick={() => setMenuOpen(false)}>
                  Account
                </MenuLink>
                <MenuLink href="/app/account/#settings" onClick={() => setMenuOpen(false)}>
                  Settings
                </MenuLink>
                <MenuLink href="/contact/" onClick={() => setMenuOpen(false)}>
                  Help
                </MenuLink>
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-danger hover:bg-danger/5"
                  onClick={() => {
                    setMenuOpen(false);
                    void signOut(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-navy-950/5"
      onClick={onClick}
    >
      {children}
    </Link>
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

function DesktopBuyerFooter() {
  return (
    <footer className="mt-auto hidden border-t border-border/70 bg-card lg:block">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-8 py-8">
        <div>
          <Logo className="h-7 w-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Ask. Alert. Delivered. · Lagos Nigeria</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
          <Link href="/plans/" className="hover:text-foreground">
            Plans
          </Link>
          <Link href="/terms/" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy/" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/contact/" className="hover:text-foreground">
            Help
          </Link>
        </div>
      </div>
    </footer>
  );
}
