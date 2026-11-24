'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth/supabase-auth';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const client = authClient();
    if (!client) {
      router.replace('/auth/sign-in/');
      return;
    }
    void client.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/app/' : '/auth/sign-in/');
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/80">
      Finishing sign-in…
    </div>
  );
}
