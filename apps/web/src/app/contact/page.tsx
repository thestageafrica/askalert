import type { Metadata } from 'next';
import { Button, Container, Section } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Contact | AskAlert',
  description: 'Contact AskAlert on WhatsApp.',
};

export default function ContactPage() {
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I have a question.');

  return (
    <main className="min-h-screen bg-background py-16">
      <Container width="md">
        <Section title="Contact" description="The fastest way to reach us is WhatsApp.">
          <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Message AskAlert
          </Button>
        </Section>
      </Container>
    </main>
  );
}
