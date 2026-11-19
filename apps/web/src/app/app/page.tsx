import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button, Card, Container, Section, Skeleton } from '@askalert/ui';
import { AppShell } from './app-shell';

export const metadata: Metadata = {
  title: 'Open AskAlert in your browser',
  description: 'Use AskAlert in your browser while the apps are on the way.',
};

function AppShellFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading AskAlert">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-3/4 max-w-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-11 w-40 rounded-full" />
    </div>
  );
}

export default function BrowserAppPage() {
  return (
    <main className="min-h-screen bg-background py-16">
      <Container width="md">
        <Section
          title="Browser app"
          description="The full AskAlert flow will live here. For now, start on WhatsApp or return home."
        >
          <Suspense fallback={<AppShellFallback />}>
            <AppShell />
          </Suspense>
          <Card className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Button href="/">Back to home</Button>
            <Link
              href="/design-system"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            >
              Design system
            </Link>
          </Card>
        </Section>
      </Container>
    </main>
  );
}
