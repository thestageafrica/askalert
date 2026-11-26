'use client';

import { useState } from 'react';
import { LegalPageEditor } from '../../../components/public-pages/legal-page-editor';
import { useAdminStore } from '../../../lib/admin-store';
import { canEditPublicPages } from '../../../lib/roles';
import { useSitePagesAdmin } from '../../../lib/site-pages-admin-store';

export default function TermsAdminPage() {
  const { role } = useAdminStore();
  const locked = !canEditPublicPages(role);
  const { ready, terms, setTerms, savePage, resetPage } = useSitePagesAdmin();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!ready) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading terms editor"
      />
    );
  }

  return (
    <LegalPageEditor
      title="Terms of Use"
      subtitle="Edit Terms, Vendor Terms, and annexes for /terms. Seeded from the legal draft (standard payments wording)."
      value={terms}
      locked={locked}
      notice={notice}
      busy={busy}
      onChange={setTerms}
      onSave={() => {
        setBusy(true);
        void savePage('terms').then((result) => {
          setBusy(false);
          setNotice(result.ok ? 'Terms of Use saved.' : result.error);
        });
      }}
      onReset={() => {
        resetPage('terms');
        setNotice('Reset to seed Terms of Use.');
      }}
    />
  );
}
