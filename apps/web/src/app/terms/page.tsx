import type { Metadata } from 'next';
import { Container, Section } from '@askalert/ui';

export const metadata: Metadata = {
  title: 'Terms | AskAlert',
  description: 'AskAlert terms of use placeholder.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background py-16">
      <Container width="md">
        <Section title="Terms" description="Placeholder page. Full terms will be published before launch.">
          <p className="text-muted-foreground">
            By using AskAlert you agree to fair use of the marketplace and honest requests.
          </p>
        </Section>
      </Container>
    </main>
  );
}
