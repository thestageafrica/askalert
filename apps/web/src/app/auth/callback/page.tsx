'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth/supabase-auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    const client = authClient();
    if (!client) {
      router.replace('/auth/sign-in/');
      return;
    }

    let cancelled = false;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const type = params.get('type');

      if (code) {
        const { error } = await client!.auth.exchangeCodeForSession(code);
        if (cancelled) {
          return;
        }
        if (error) {
          setMessage('That link is invalid or expired. Sign in again.');
          router.replace('/auth/sign-in/');
          return;
        }
      }

      const { data } = await client!.auth.getSession();
      if (cancelled) {
        return;
      }

      if (type === 'recovery') {
        router.replace('/auth/reset-password/');
        return;
      }

      router.replace(data.session ? '/app/' : '/auth/sign-in/');
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/80">
      {message}
    </div>
  );
}
