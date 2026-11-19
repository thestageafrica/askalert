import Link from 'next/link';
import { listCategories } from '@askalert/category-engine';
import { createMoney, formatNaira } from '@askalert/payments';
import { Button, Container, Logo, Section } from '@askalert/ui';

export default function HomePage() {
  const categories = listCategories();
  const samplePrice = formatNaira(createMoney(250000));

  return (
    <main>
      <Container>
        <Section
          title="AskAlert"
          description="An AI agent finds vendors or buyers, negotiates, and recommends the best options in Lekki."
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <Logo />
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Ask. Alert. Delivered.
            </p>
          </div>
          <p className="mb-4 text-foreground">Sample price: {samplePrice}</p>
          <ul className="mb-6 list-disc pl-5 text-muted-foreground">
            {categories.map((category) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button>Get started</Button>
            <Link
              href="/design-system"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-navy-900/20 bg-surface/10 px-5 text-sm font-semibold text-foreground backdrop-blur-sm dark:border-surface/35"
            >
              View design system
            </Link>
          </div>
        </Section>
      </Container>
    </main>
  );
}
