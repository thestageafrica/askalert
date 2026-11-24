import { Card, Section } from '@askalert/ui';

const steps = [
  {
    step: '1',
    title: 'Tell us what you need',
    body: 'Send a short request on WhatsApp or in the browser. Keep it simple.',
  },
  {
    step: '2',
    title: 'We ask around and negotiate, as much as you want',
    body: 'AskAlert reaches verified vendors, compares offers, and can push for a better deal.',
  },
  {
    step: '3',
    title: 'You pick and pay safely',
    body: 'Choose the option you like. Pay once, then choose how much goes to the vendor now and how much is released after you confirm completion.',
  },
] as const;

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="Simple flow"
      title="How it works"
      description="Three clear steps. No long forms."
      className="scroll-mt-24"
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((item) => (
          <li key={item.step}>
            <Card className="h-full">
              <p className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-orange-500 text-sm font-extrabold text-navy-900">
                {item.step}
              </p>
              <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}
