'use client';

import { useEffect } from 'react';
import { Button, Container } from '@askalert/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-navy-950 text-surface">
      <Container width="sm" className="py-16 text-center">
        <p className="text-sm font-semibold text-orange-400">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Admin hit a snag</h1>
        <p className="mt-3 text-surface/70">Try again, or go back to the dashboard.</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button
            href="/"
            variant="secondary"
            className="border-surface/25 bg-surface/10 text-surface hover:bg-surface/15"
          >
            Dashboard
          </Button>
        </div>
      </Container>
    </main>
  );
}
