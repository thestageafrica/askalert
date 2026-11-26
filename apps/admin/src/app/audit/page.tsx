'use client';

import { useMemo, useState } from 'react';
import { Button, Input } from '@askalert/ui';
import { useAdminStore } from '../../lib/admin-store';
import { useOpsStore } from '../../lib/ops-store';
import { canViewAuditLog } from '../../lib/roles';

export default function AuditPage() {
  const { audit } = useOpsStore();
  const { role } = useAdminStore();
  const [action, setAction] = useState('');
  const [tableName, setTableName] = useState('');

  const filtered = useMemo(() => {
    return audit.filter((row) => {
      if (action && !row.action.toLowerCase().includes(action.toLowerCase())) {
        return false;
      }
      if (tableName && row.tableName !== tableName) {
        return false;
      }
      return true;
    });
  }, [action, audit, tableName]);

  if (!canViewAuditLog(role)) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm">
        Your role cannot view the audit log.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Audit log</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every admin invite, vendor review and user status change.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Filter action"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="vendor.approve"
        />
        <Input
          label="Filter table"
          value={tableName}
          onChange={(event) => setTableName(event.target.value)}
          placeholder="vendor_profiles"
        />
      </div>
      <ul className="space-y-3">
        {filtered.map((row) => (
          <li
            key={row.id}
            className="rounded-[1.25rem] border border-border/70 bg-card p-4 text-sm shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-extrabold text-foreground">{row.action}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(row.createdAt).toLocaleString('en-NG')}
              </p>
            </div>
            <p className="mt-1 text-muted-foreground">
              {row.actor} · {row.tableName}
              {row.recordId ? ` · ${row.recordId}` : ''}
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-surface-subtle p-2 text-xs">
              {JSON.stringify(row.payload, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
      <Button href="/" variant="secondary">
        Back to dashboard
      </Button>
    </div>
  );
}
