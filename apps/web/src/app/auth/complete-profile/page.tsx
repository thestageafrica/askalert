'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Input } from '@askalert/ui';
import { AuthShell } from '../../../components/auth/auth-shell';
import { useAuth } from '../../../lib/auth/auth-provider';
import { phoneHintError } from '../../../lib/auth/phone';

export default function CompleteProfilePage() {
  const { ready, user, profile, completePhone, supabaseConfigured } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!supabaseConfigured || !user) {
      router.replace('/auth/sign-in/');
      return;
    }
    if (profile?.phoneE164) {
      router.replace('/app/');
    }
  }, [profile?.phoneE164, ready, router, supabaseConfigured, user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/80">
        Loading…
      </div>
    );
  }

  return (
    <AuthShell
      title="Add your WhatsApp number"
      subtitle="Google sign-in does not collect a phone. We need it to reach you about orders."
    >
      <div className="space-y-4">
        <Input
          label="WhatsApp number"
          type="tel"
          autoComplete="tel"
          placeholder="0803 123 4567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        {error ? (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full"
          loading={loading}
          loadingText="Saving…"
          onClick={() => {
            const hint = phoneHintError(phone);
            if (hint) {
              setError(hint);
              return;
            }
            setLoading(true);
            setError(null);
            void completePhone(phone).then((result) => {
              setLoading(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              router.replace('/app/');
            });
          }}
        >
          Save and continue
        </Button>
      </div>
    </AuthShell>
  );
}
