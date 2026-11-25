'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@askalert/ui';
import { useMockStore } from '../../lib/app/mock-store';

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: (active: boolean) => ReactNode;
  badge?: number;
};

export function BottomNav() {
  const pathname = usePathname() || '/app/';
  const { chats } = useMockStore();
  const unreadMessages = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items: NavItem[] = [
    {
      href: '/app/',
      label: 'Home',
      match: (path) => path === '/app' || path === '/app/',
      icon: (active) => <HomeIcon active={active} />,
    },
    {
      href: '/app/requests/',
      label: 'Requests',
      match: (path) => path.startsWith('/app/requests') || path.startsWith('/app/request'),
      icon: (active) => <RequestsIcon active={active} />,
    },
    {
      href: '/app/chats/',
      label: 'Messages',
      match: (path) => path.startsWith('/app/chat'),
      icon: (active) => <ChatIcon active={active} />,
      badge: unreadMessages,
    },
    {
      href: '/app/menu/',
      label: 'Menu',
      match: (path) =>
        path.startsWith('/app/menu') ||
        path.startsWith('/app/account') ||
        path.startsWith('/app/invoices') ||
        path.startsWith('/app/disputes') ||
        path.startsWith('/app/help') ||
        path.startsWith('/app/saved') ||
        path.startsWith('/app/plan'),
      icon: (active) => <MenuIcon active={active} />,
    },
  ];

  return (
    <nav
      aria-label="App"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 px-3 transition-transform duration-300 ease-out',
        'pb-[max(0.55rem,env(safe-area-inset-bottom))]',
        hidden ? 'translate-y-[120%]' : 'translate-y-0',
      )}
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-stretch justify-between rounded-[1.75rem] border border-surface/10 bg-navy-950 px-1.5 py-1.5 shadow-[0_-8px_32px_color-mix(in_srgb,var(--navy-950)_35%,transparent)]">
          {items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-semibold tracking-wide transition',
        active ? 'text-orange-400' : 'text-surface/65 hover:text-surface',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'relative flex size-9 items-center justify-center rounded-xl transition',
          active && 'bg-orange-500/15',
        )}
      >
        {item.icon(active)}
        {item.badge && item.badge > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-extrabold text-navy-900">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        ) : null}
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

function RequestsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10a2 2 0 0 1 2 2v14l-3.5-2.2L12 20l-3.5-2.2L5 20V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
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

function MenuIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={active ? 1 : 0.95}
      />
    </svg>
  );
}
