import { listCategories } from '@askalert/category-engine';
import { Button, Container, Logo, Section } from '@askalert/ui';

export default function AdminHomePage() {
  const categories = listCategories();

  return (
    <main>
      <Container>
        <Section
          title="Admin shell"
          description="Manage categories and marketplace operations."
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <Logo />
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              AskAlert Admin
            </p>
          </div>
          <ul className="mb-6 list-disc pl-5 text-muted-foreground">
            {categories.map((category) => (
              <li key={category.slug}>
                {category.name}{' '}
                <span className="text-xs uppercase tracking-wide">({category.slug})</span>
              </li>
            ))}
          </ul>
          <Button>Open queue</Button>
        </Section>
      </Container>
    </main>
  );
}
