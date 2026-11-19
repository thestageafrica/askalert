import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card, Container, Section } from '@askalert/ui';

export const metadata: Metadata = {
  title: 'Open AskAlert in your browser',
  description: 'Use AskAlert in your browser while the apps are on the way.',
};

export default function BrowserAppPage() {
  return (
    <main className="min-h-screen bg-background py-16">
      <Container width="md">
        <Section
          title="Browser app"
          description="The full AskAlert flow will live here. For now, start on WhatsApp or return home."
        >
          <Card className="flex flex-col gap-4 sm:flex-row">
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
