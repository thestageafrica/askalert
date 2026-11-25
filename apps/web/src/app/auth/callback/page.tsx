'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth/supabase-auth';

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

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
      const errorDescription = params.get('error_description') || params.get('error');

      if (errorDescription) {
        setMessage(errorDescription);
        await wait(1200);
        if (!cancelled) {
          router.replace('/auth/sign-in/');
        }
        return;
      }

      // Prefer the session from detectSessionInUrl (single exchange).
      for (let attempt = 0; attempt < 25; attempt += 1) {
        if (cancelled) {
          return;
        }
        const { data } = await client!.auth.getSession();
        if (data.session) {
          if (type === 'recovery') {
            router.replace('/auth/reset-password/');
            return;
          }
          router.replace('/app/');
          return;
        }
        await wait(120);
      }

      // Fallback if init did not consume the code yet.
      if (code) {
        const { error } = await client!.auth.exchangeCodeForSession(code);
        if (cancelled) {
          return;
        }
        if (error) {
          setMessage(
            'That link is invalid, expired, or was opened in a different browser. Request a new one and open it here.',
          );
          await wait(1800);
          if (!cancelled) {
            router.replace('/auth/sign-in/');
          }
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
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 text-center text-sm text-surface/80">
      {message}
    </div>
  );
}
