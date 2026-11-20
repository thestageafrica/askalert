'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@askalert/ui';

const items = [
  { href: '/app', label: 'Home', match: (path: string) => path === '/app' },
  {
    href: '/app/requests',
    label: 'Requests',
    match: (path: string) => path.startsWith('/app/requests') || path.startsWith('/app/request'),
  },
  {
    href: '/app/chats',
    label: 'Chat',
    match: (path: string) => path.startsWith('/app/chat'),
  },
  {
    href: '/app/account',
    label: 'Account',
    match: (path: string) => path.startsWith('/app/account'),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold tracking-wide',
                active ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={cn(
                  'h-1 w-6 rounded-full transition',
                  active ? 'bg-orange-500' : 'bg-transparent',
                )}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
