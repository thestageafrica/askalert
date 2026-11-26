'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Input } from '@askalert/ui';
import { useAdminStore } from '../../lib/admin-store';
import { useOpsStore } from '../../lib/ops-store';
import { canManageUsers } from '../../lib/roles';

export default function UsersPage() {
  const { users } = useOpsStore();
  const { role } = useAdminStore();
  const [query, setQuery] = useState('');
  const canManage = canManageUsers(role);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return users;
    }
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        user.displayName.toLowerCase().includes(q) ||
        user.phoneE164.toLowerCase().includes(q),
    );
  }, [query, users]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search profiles, roles and suspend with a required reason.
        </p>
      </div>
      {!canManage ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Read-only for your role. You can browse, not suspend.
        </p>
      ) : null}
      <Input
        label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Email, name or phone"
      />
      <ul className="space-y-3">
        {filtered.map((user) => (
          <li key={user.userId}>
            <Link
              href={`/users/${user.userId}/`}
              className="block rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-sm transition hover:border-orange-500/40"
            >
              <p className="font-extrabold text-foreground">
                {user.displayName || user.email || user.userId}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.email} · {user.phoneE164 || 'No phone'} · {user.roles.join(', ') || 'No roles'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <Button href="/" variant="secondary">
        Back to dashboard
      </Button>
    </div>
  );
}
