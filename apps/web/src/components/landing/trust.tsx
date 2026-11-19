import { Card, Section } from '@askalert/ui';

const items = [
  {
    title: 'Verified vendors',
    body: 'We check who we alert so you are not starting from strangers every time.',
  },
  {
    title: 'Protected payments',
    body: 'You choose how much AskAlert holds until you confirm the job.',
  },
  {
    title: 'Private contact details',
    body: 'Your number stays private until you book. No open broadcasts.',
  },
  {
    title: 'Real reviews',
    body: 'Reviews come from completed jobs, not empty promises.',
  },
] as const;

export function Trust() {
  return (
    <Section title="Trust built in" description="Clear rules. Your choice. Less guessing.">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title} className="h-full">
            <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
