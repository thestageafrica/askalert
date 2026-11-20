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
    <main className="flex min-h-screen items-center bg-[radial-gradient(90%_60%_at_50%_0%,_color-mix(in_srgb,var(--orange-500)_12%,transparent),_transparent_55%),var(--background)]">
      <Container width="sm" className="py-16 text-center">
        <p className="text-sm font-semibold text-orange-600">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          AskAlert hit a snag
        </h1>
        <p className="mt-3 text-muted-foreground">
          Try again. If it keeps happening, message us on WhatsApp from Contact.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button href="/" variant="secondary">
            Back home
          </Button>
        </div>
      </Container>
    </main>
  );
}
