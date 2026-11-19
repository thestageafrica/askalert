import { Card, Section } from '@askalert/ui';

const live = ['Events', 'Shortlets', 'Home care'] as const;
const comingSoon = [
  'Car hire with driver',
  'Beauty at home',
  'Auto services',
  'Business services',
  'Tutors',
  'Real estate',
] as const;

export function Categories() {
  return (
    <Section
      id="categories"
      title="Categories"
      description="Start with what is live in Lekki. More categories are on the way."
      className="scroll-mt-24"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {live.map((name) => (
          <Card
            key={name}
            className="min-h-28 border-orange-500/25 bg-linear-to-br from-card to-orange-500/5"
          >
            <p className="text-lg font-bold text-foreground">{name}</p>
            <p className="mt-2 text-sm font-medium text-orange-700 dark:text-orange-400">Live</p>
          </Card>
        ))}
        {comingSoon.map((name) => (
          <Card key={name} className="min-h-28 border-dashed border-border bg-transparent opacity-90">
            <p className="text-lg font-bold text-foreground">{name}</p>
            <p className="mt-2 text-sm text-muted-foreground">Coming soon</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
