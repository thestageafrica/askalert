'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button, Logo, cn } from '@askalert/ui';
import { useAdminAuth } from '../lib/admin-auth';
import { useAdminStore } from '../lib/admin-store';
import { roleLabels } from '../lib/roles';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const marketplace: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <DashIcon /> },
  { href: '/categories', label: 'Categories', icon: <GridIcon /> },
  { href: '/catalog', label: 'Catalog', icon: <CatalogIcon /> },
  { href: '/areas', label: 'Geography', icon: <MapIcon /> },
  { href: '/vendors', label: 'Vendors', icon: <UsersIcon /> },
  { href: '/public-pages', label: 'Public pages', icon: <PagesIcon /> },
];

const operations: NavItem[] = [
  { href: '/users', label: 'Users', icon: <PersonIcon /> },
  { href: '/audit', label: 'Audit log', icon: <AuditIcon /> },
  { href: '/requests', label: 'Requests', icon: <BellIcon /> },
  { href: '/simulator', label: 'Capture sim', icon: <ChatIcon /> },
  { href: '/disputes', label: 'Disputes', icon: <AlertIcon /> },
  { href: '/payouts', label: 'Payouts', icon: <CashIcon /> },
  { href: '/plans', label: 'Plans', icon: <PlansIcon /> },
  { href: '/usage', label: 'Usage', icon: <UsageIcon /> },
  { href: '/cost', label: 'Cost', icon: <CostIcon /> },
  { href: '/settings', label: 'Settings', icon: <GearIcon /> },
];

function isActive(pathname: string, href: string) {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role } = useAdminStore();
  const { user, signOut, supabaseConfigured } = useAdminAuth();
  const emailLabel = user?.email?.split('@')[0] ?? 'Admin';
  const initials = emailLabel.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(90%_60%_at_0%_0%,_color-mix(in_srgb,var(--orange-500)_10%,transparent),_transparent_50%),radial-gradient(70%_50%_at_100%_0%,_color-mix(in_srgb,var(--navy-700)_12%,transparent),_transparent_45%),var(--surface-subtle)] lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="relative overflow-hidden border-b border-navy-700/60 bg-navy-950 text-surface lg:min-h-screen lg:border-b-0 lg:border-r lg:border-navy-700/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_0%_0%,_var(--glow-orange-strong),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex items-center gap-3 px-4 py-5">
          <Logo variant="reversed" className="h-7 w-auto" />
          <span className="rounded-full border border-surface/15 bg-surface/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-400">
            Ops
          </span>
        </div>

        <nav aria-label="Admin" className="relative space-y-4 px-2 pb-4 lg:px-3">
          <NavGroup title="Marketplace" items={marketplace} pathname={pathname} />
          <NavGroup title="Operations" items={operations} pathname={pathname} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
              AskAlert Admin
            </p>
            <p className="text-sm text-muted-foreground">Lagos operations console</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-full bg-navy-950 text-[11px] font-extrabold text-orange-400">
                {initials}
              </span>
              <div className="pr-1">
                <p className="max-w-[10rem] truncate text-xs font-bold text-foreground">
                  {user?.email ?? 'Local admin'}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                  {roleLabels[role]}
                </p>
              </div>
            </div>
            {supabaseConfigured ? (
              <>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => {
                    void signOut(false).then(() => {
                      window.location.href = '/sign-in/';
                    });
                  }}
                >
                  Sign out
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => {
                    void signOut(true).then(() => {
                      window.location.href = '/sign-in/';
                    });
                  }}
                >
                  Sign out everywhere
                </Button>
              </>
            ) : null}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-1.5 hidden px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-surface/40 lg:block">
        {title}
      </p>
      <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                active
                  ? 'bg-orange-500 text-navy-900 shadow-[0_8px_20px_var(--glow-orange)]'
                  : 'text-surface/70 hover:bg-surface/10 hover:text-surface',
              )}
            >
              <span className={cn('opacity-90', active ? 'text-navy-900' : 'text-orange-400')}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h7v7H4v-7Zm9 3h7v4h-7v-4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c1.2-3 3.2-4.5 5.5-4.5S13.3 16 14.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 14.5c1.6.3 2.9 1.4 3.8 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 3 20h18L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3V20.5M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlansIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 5h14v4H5V5Zm0 5h14v4H5v-4Zm0 5h14v4H5v-4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function UsageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 15v-4M12 15V8M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CostIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v10M9.5 9.5c.6-1 1.5-1.5 2.5-1.5 1.4 0 2.5.8 2.5 2s-1.1 2-2.5 2h-1c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2c1 0 1.9-.5 2.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19c1.6-3 3.8-4.5 7-4.5s5.4 1.5 7 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-3.5-2L12 20l-3.5-2L5 20V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PagesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14.5a1.5 1.5 0 0 1-1.5 1.5H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 9h7M8.5 12h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
