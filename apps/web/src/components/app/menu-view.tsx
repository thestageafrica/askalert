'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { cn } from '@askalert/ui';
import { useAuth } from '../../lib/auth/auth-provider';
import { useMode } from '../../lib/auth/mode-provider';
import { useMockStore } from '../../lib/app/mock-store';
import { useNotificationsStore } from '../../lib/app/notifications-store';

type MenuItem = {
  href: string;
  label: string;
  badge?: number;
};

export function MenuView() {
  const { profile, user, signOut } = useAuth();
  const { mode, switchTo, vendorCta } = useMode();
  const { chats, account } = useMockStore();
  const { unreadCount } = useNotificationsStore();

  const unreadMessages = useMemo(
    () => chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    [chats],
  );
  const openDisputes = 0;
  const pendingActions = unreadCount > 0 ? 1 : 0;

  const buyerSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Activity',
      items: [
        { href: '/app/requests/', label: 'My requests' },
        { href: '/app/requests/', label: 'Bookings' },
        { href: '/app/chats/', label: 'Messages', badge: unreadMessages },
        { href: '/app/invoices/', label: 'Invoices and receipts' },
        { href: '/app/disputes/', label: 'Disputes', badge: openDisputes || undefined },
        { href: '/app/notifications/', label: 'Notifications', badge: unreadCount || undefined },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/app/plan/', label: 'Plans and credits' },
        { href: '/app/saved/', label: 'Saved vendors' },
        { href: '/app/help/', label: 'Help and support' },
        { href: '/app/account/', label: 'Settings' },
        { href: '/terms/', label: 'Legal' },
      ],
    },
  ];

  const vendorSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Work',
      items: [
        { href: '/vendor/leads/', label: 'Leads', badge: pendingActions || undefined },
        { href: '/vendor/leads/', label: 'Quotes' },
        { href: '/vendor/bookings/', label: 'Bookings' },
        { href: '/vendor/earnings/', label: 'Earnings' },
        { href: '/vendor/availability/', label: 'Availability' },
        { href: '/vendor/rate-cards/', label: 'Rate cards' },
        { href: '/vendor/profile/', label: 'Reviews' },
        { href: '/vendor/profile/', label: 'Verification status' },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/app/plan/', label: 'Plans' },
        { href: '/app/help/', label: 'Help' },
        { href: '/app/account/', label: 'Settings' },
      ],
    },
  ];

  const sections = mode === 'vendor' ? vendorSections : buyerSections;
  const phone = profile?.phoneE164 || account.phone || 'Add phone';
  const name = profile?.displayName || user?.email || 'Your account';

  return (
    <div className="px-4 pb-6 pt-3">
      <section className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-[0_12px_28px_color-mix(in_srgb,var(--navy-950)_7%,transparent)]">
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 px-4 py-5 text-surface">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
            {mode === 'vendor' ? 'Vendor' : 'Buyer'}
          </p>
          <p className="mt-1 truncate text-lg font-extrabold">{name}</p>
          <p className="mt-0.5 text-sm text-surface/70">{phone}</p>
        </div>
        <div className="flex gap-1 p-2">
          <ModeButton
            active={mode === 'buyer'}
            label="Buyer"
            onClick={() => switchTo('buyer')}
          />
          <ModeButton
            active={mode === 'vendor'}
            label="Vendor"
            onClick={() => {
              switchTo('vendor');
              if (vendorCta.kind === 'become') {
                window.location.href = vendorCta.href;
              }
            }}
          />
        </div>
      </section>

      {(unreadMessages > 0 || openDisputes > 0 || pendingActions > 0) && mode === 'buyer' ? (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          {[
            unreadMessages > 0 ? `${unreadMessages} unread messages` : null,
            openDisputes > 0 ? `${openDisputes} open disputes` : null,
            pendingActions > 0 ? `${pendingActions} pending action` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}

      <div className="mt-4 space-y-5">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h2>
            <ul className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-card">
              {section.items.map((item, index) => (
                <li key={`${section.title}-${item.label}`}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex min-h-11 items-center justify-between gap-3 px-4 text-sm font-semibold text-foreground transition hover:bg-navy-950/5',
                      index > 0 && 'border-t border-border/60',
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-extrabold text-navy-900">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : (
                      <Chevron />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <button
        type="button"
        className="mt-5 flex min-h-11 w-full items-center justify-center rounded-[1.25rem] border border-border/70 bg-card text-sm font-bold text-danger transition hover:bg-danger/5"
        onClick={() => void signOut(false)}
      >
        Sign out
      </button>
    </div>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'min-h-11 flex-1 rounded-xl text-sm font-bold transition',
        active ? 'bg-navy-950 text-surface' : 'text-muted-foreground hover:bg-card-muted',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Chevron(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
