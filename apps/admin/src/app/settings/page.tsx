'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@askalert/ui';
import { uiRoleToDb } from '@askalert/db';
import { useAdminStore } from '../../lib/admin-store';
import { useOpsStore } from '../../lib/ops-store';
import { canInviteAdmins, canManageSettings, roleLabels, type AdminRole } from '../../lib/roles';

export default function SettingsPage() {
  const { role } = useAdminStore();
  const { inviteStaff } = useOpsStore();
  const locked = !canManageSettings(role);
  const canInvite = canInviteAdmins(role);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('operations');
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Staff invites and admin security checklist.
        </p>
      </div>

      {canInvite ? (
        <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-extrabold">Invite admin staff</h2>
          <p className="text-sm text-muted-foreground">
            Creates an invitation row. Create the Auth user in Supabase (invite email), then they
            sign in at admin.askalert.com — acceptance grants their role automatically.
          </p>
          <Input
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Select
            label="Role"
            value={inviteRole}
            options={(Object.keys(roleLabels) as AdminRole[]).map((value) => ({
              value,
              label: roleLabels[value],
            }))}
            onChange={(event) => setInviteRole(event.target.value as AdminRole)}
          />
          <Input
            label="Note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          {notice ? <p className="text-sm font-medium">{notice}</p> : null}
          <Button
            onClick={() => {
              void inviteStaff({
                email,
                role: uiRoleToDb(inviteRole),
                note,
              }).then((result) => {
                setNotice(
                  result.ok
                    ? `Invitation saved (${result.id}). Create/invite the Auth user in Supabase next.`
                    : result.error,
                );
              });
            }}
          >
            Save invitation
          </Button>
        </section>
      ) : null}

      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-foreground">Admin security checklist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Admin hostname is admin.askalert.com (not the buyer site).</li>
          <li>Staff sign in with email/password + TOTP when MFA is enabled in Supabase.</li>
          <li>Only invited admin roles can enter; buyer accounts are rejected.</li>
          <li>30-minute idle timeout; use “Sign out everywhere” on shared devices.</li>
          <li>Optional but recommended: Cloudflare Access on admin.askalert.com.</li>
          <li>Never put SUPABASE_SERVICE_ROLE_KEY in Pages env.</li>
          <li>Apply migration 20260330000001_admin_ops.sql before relying on RPCs.</li>
        </ul>
      </section>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Cloudflare Access</p>
        <p className="mt-2">
          Keep Access as defence in depth on{' '}
          <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-foreground">
            admin.askalert.com
          </code>
          . See <code className="text-xs">DEPLOY.md</code>.
        </p>
      </div>

      {locked ? (
        <p className="text-sm font-semibold text-orange-700">
          Some settings are locked for your role.
        </p>
      ) : null}
    </div>
  );
}
