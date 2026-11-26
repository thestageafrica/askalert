'use client';

import { useState } from 'react';
import { useToast } from '@askalert/ui';
import { LegalPageEditor } from '../../../components/public-pages/legal-page-editor';
import { useAdminStore } from '../../../lib/admin-store';
import { canEditPublicPages } from '../../../lib/roles';
import { useSitePagesAdmin } from '../../../lib/site-pages-admin-store';

export default function PrivacyAdminPage() {
  const { role } = useAdminStore();
  const locked = !canEditPublicPages(role);
  const { toast } = useToast();
  const { ready, privacy, setPrivacy, savePage, resetAndSavePage } = useSitePagesAdmin();
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
          if (result.ok) {
            setNotice('Privacy Policy saved to the server.');
            toast({
              title: 'Saved to server',
              description: 'Privacy Policy is live for the public site.',
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
        void resetAndSavePage('privacy').then((result) => {
          setBusy(false);
          if (result.ok) {
            setNotice('Privacy Policy reset to seed and saved to the server.');
            toast({
              title: 'Reset and saved',
              description: 'Privacy Policy seed is now on the server.',
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
