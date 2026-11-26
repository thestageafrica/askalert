'use client';

import { useState } from 'react';
import { useToast } from '@askalert/ui';
import { LegalPageEditor } from '../../../components/public-pages/legal-page-editor';
import { useAdminStore } from '../../../lib/admin-store';
import { canEditPublicPages } from '../../../lib/roles';
import { useSitePagesAdmin } from '../../../lib/site-pages-admin-store';

export default function TermsAdminPage() {
  const { role } = useAdminStore();
  const locked = !canEditPublicPages(role);
  const { toast } = useToast();
  const { ready, terms, setTerms, savePage, resetAndSavePage } = useSitePagesAdmin();
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
          if (result.ok) {
            setNotice('Terms of Use saved to the server.');
            toast({
              title: 'Saved to server',
              description: 'Terms of Use is live for the public site.',
              tone: 'success',
            });
            return;
          }
          setNotice(result.error);
          toast({ title: 'Save failed', description: result.error, tone: 'danger' });
        });
      }}
      onReset={() => {
        setBusy(true);
        void resetAndSavePage('terms').then((result) => {
          setBusy(false);
          if (result.ok) {
            setNotice('Terms of Use reset to seed and saved to the server.');
            toast({
              title: 'Reset and saved',
              description: 'Terms of Use seed is now on the server.',
              tone: 'success',
            });
            return;
          }
          setNotice(`Reset failed to save: ${result.error}`);
          toast({ title: 'Reset save failed', description: result.error, tone: 'danger' });
        });
      }}
    />
  );
}
