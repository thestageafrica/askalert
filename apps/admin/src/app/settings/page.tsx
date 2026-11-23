'use client';

import { PlaceholderPage } from '../../components/placeholder-page';
import { useAdminStore } from '../../lib/admin-store';
import { canManageSettings } from '../../lib/roles';

export default function SettingsPage() {
  const { role } = useAdminStore();
  const locked = !canManageSettings(role);

  return (
    <div className="space-y-4">
      <PlaceholderPage
        title="Settings"
        description="Workspace preferences, auth and feature flags."
      />
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Access control</p>
        <p className="mt-2">
          This admin app is a static export. HTTP Basic Auth middleware is removed. Protect{' '}
          <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-foreground">
            admin.askalert.com
          </code>{' '}
          with <strong className="text-foreground">Cloudflare Access</strong> so only your team
          emails can open it. See <code className="text-xs">DEPLOY.md</code>.
        </p>
      </div>
      {locked ? (
        <p className="text-sm font-semibold text-orange-700">
          Settings are locked for your role. Switch to Super admin to change them.
        </p>
      ) : null}
    </div>
  );
}
