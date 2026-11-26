'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Input, Select } from '@askalert/ui';
import { useAdminStore } from '../lib/admin-store';
import { useOpsStore } from '../lib/ops-store';
import { canSuspendUsers } from '../lib/roles';

export function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { users, setUserRoleStatus } = useOpsStore();
  const { role } = useAdminStore();
  const user = users.find((item) => item.userId === id);
  const [targetRole, setTargetRole] = useState('buyer');
  const [status, setStatus] = useState('suspended');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const canSuspend = canSuspendUsers(role);

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6">
        <p className="font-semibold">User not found in this static build.</p>
        <Button href="/users/" className="mt-4" variant="secondary">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {user.displayName || user.email}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user.email} · {user.phoneE164 || 'No phone'}
        </p>
      </div>
      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Roles</h2>
        <p className="mt-2 text-sm text-foreground">{user.roles.join(', ') || 'None'}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Joined {user.createdAt ? new Date(user.createdAt).toLocaleString('en-NG') : '—'}
        </p>
      </section>
      {canSuspend ? (
        <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-extrabold">Suspend / unsuspend</h2>
          <Select
            label="Role"
            value={targetRole}
            options={['buyer', 'vendor', 'admin_support', 'admin_operations'].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(event) => setTargetRole(event.target.value)}
          />
          <Select
            label="Status"
            value={status}
            options={['active', 'pending', 'suspended'].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(event) => setStatus(event.target.value)}
          />
          <Input
            label="Reason (required)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          {notice ? <p className="text-sm font-medium">{notice}</p> : null}
          <Button
            onClick={() => {
              void setUserRoleStatus({
                userId: user.userId,
                role: targetRole,
                status,
                reason,
              }).then((result) => {
                setNotice(result.ok ? 'Updated.' : result.error);
              });
            }}
          >
            Save status
          </Button>
        </section>
      ) : null}
      <Button href="/users/" variant="secondary">
        Back to users
      </Button>
    </div>
  );
}
