import { Accordion, Section } from '@askalert/ui';

const items = [
  {
    id: 'free',
    title: 'Is it free?',
    content:
      'Yes for buyers to ask. Vendors can join free. If AskAlert holds money for protection, clear fees show before you pay.',
  },
  {
    id: 'negotiate',
    title: 'How does AskAlert negotiate for me?',
    content:
      'We message verified vendors with your request, collect offers, and can push for a better price or terms based on what you want.',
  },
  {
    id: 'hold',
    title: "What does 'hold' mean?",
    content:
      'A hold is money AskAlert keeps until you confirm the job went well. You choose the hold percentage. The rest can go to the vendor sooner.',
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
    content: 'We are launching in Lekki, Lagos. More areas will follow as we grow carefully.',
  },
  {
    id: 'self',
    title: 'Can I negotiate myself instead?',
    content:
      'Yes. AskAlert can do the chasing for you, or you can take an offer and continue the conversation yourself.',
  },
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
