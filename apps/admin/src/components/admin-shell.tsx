'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo, cn } from '@askalert/ui';
import { useAdminStore } from '../lib/admin-store';
import { roleLabels, type AdminRole } from '../lib/roles';

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/categories', label: 'Categories' },
  { href: '/areas', label: 'Areas' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/requests', label: 'Requests' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/settings', label: 'Settings' },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useAdminStore();

  return (
    <div className="min-h-screen bg-surface-subtle lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-navy-950 text-surface lg:min-h-screen lg:border-b-0 lg:border-r lg:border-navy-700">
        <div className="flex items-center gap-3 px-4 py-4">
          <Logo variant="reversed" className="h-7 w-auto" />
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible lg:px-3">
          {nav.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold',
                  active
                    ? 'bg-orange-500 text-navy-900'
                    : 'text-surface/75 hover:bg-surface/10 hover:text-surface',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              AskAlert Admin
            </p>
            <p className="text-sm text-muted-foreground">Lagos operations console</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Role</span>
              <select
                className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold"
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
              >
                {(Object.keys(roleLabels) as AdminRole[]).map((value) => (
                  <option key={value} value={value}>
                    {roleLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-full bg-navy-950 px-3 py-2 text-xs font-bold text-surface">
              Ada · {roleLabels[role]}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
