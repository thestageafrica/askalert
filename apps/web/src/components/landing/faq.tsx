import { Accordion, Section } from '@askalert/ui';
import { plansFaqItems } from '../../lib/plan-marketing';

const items = [
  {
    id: 'free',
    title: 'Is it free?',
    content:
      'Yes for buyers to ask. Vendors can join free. If a booking uses staged payout, clear fees show before you pay.',
  },
  {
    id: 'whatsapp',
    title: 'Can I use WhatsApp?',
    content:
      'Message us on WhatsApp and we will send you a link to continue in the app. WhatsApp chat is part of Starter.',
  },
  {
    id: 'negotiate',
    title: 'How does AskAlert negotiate for me?',
    content:
      'We message verified vendors with your request, collect offers, and can push for a better price or terms based on what you want.',
  },
  {
    id: 'hold',
    title: 'When is the vendor paid in full?',
    content:
      'You pay once through our payment partner. You choose how much goes to the vendor now, and how much is paid after you confirm the job is complete. AskAlert is not a bank and does not keep customer funds.',
  },
  {
    id: 'phone',
    title: 'Is my phone number shared?',
    content:
      'Not by default. Your contact stays private until you book. After that, only what you need to complete the job is shared.',
  },
  {
    id: 'areas',
    title: 'Which areas do you cover?',
    content: 'We are launching in Lagos. More areas will follow as we grow carefully.',
  },
  {
    id: 'self',
    title: 'Can I negotiate myself instead?',
    content:
      'Yes. AskAlert can do the chasing for you, or you can take an offer and continue the conversation yourself.',
  },
  plansFaqItems[0],
  plansFaqItems[1],
  plansFaqItems[2],
] as const;

export function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="Questions"
      title="FAQ"
      description="Short answers. Plain English."
      className="scroll-mt-24"
    >
      <Accordion items={[...items]} />
    </Section>
  );
}
