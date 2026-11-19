import type { Metadata } from 'next';
import { Container, Section } from '@askalert/ui';

export const metadata: Metadata = {
  title: 'Privacy | AskAlert',
  description: 'AskAlert privacy policy placeholder.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-16">
      <Container width="md">
        <Section
          title="Privacy"
          description="Placeholder page. We keep contact details private until you book."
        >
          <p className="text-muted-foreground">
            AskAlert only uses your information to match requests and complete bookings.
          </p>
        </Section>
      </Container>
    </main>
  );
}
