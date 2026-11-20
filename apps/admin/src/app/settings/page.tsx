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
      {locked ? (
        <p className="text-sm font-semibold text-orange-700">
          Settings are locked for your role. Switch to Super admin to change them.
        </p>
      ) : null}
    </div>
  );
}
