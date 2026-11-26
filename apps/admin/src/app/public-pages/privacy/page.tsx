'use client';

import { useState } from 'react';
import { LegalPageEditor } from '../../../components/public-pages/legal-page-editor';
import { useAdminStore } from '../../../lib/admin-store';
import { canEditPublicPages } from '../../../lib/roles';
import { useSitePagesAdmin } from '../../../lib/site-pages-admin-store';

export default function PrivacyAdminPage() {
  const { role } = useAdminStore();
  const locked = !canEditPublicPages(role);
  const { ready, privacy, setPrivacy, savePage, resetPage } = useSitePagesAdmin();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!ready) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading privacy editor"
      />
    );
  }

  return (
    <LegalPageEditor
      title="Privacy Policy"
      subtitle="Every field and section on /privacy is editable here. Seeded from the legal draft."
      value={privacy}
      locked={locked}
      notice={notice}
      busy={busy}
      onChange={setPrivacy}
      onSave={() => {
        setBusy(true);
        void savePage('privacy').then((result) => {
          setBusy(false);
          setNotice(result.ok ? 'Privacy Policy saved.' : result.error);
        });
      }}
      onReset={() => {
        resetPage('privacy');
        setNotice('Reset to seed Privacy Policy.');
      }}
    />
  );
}
