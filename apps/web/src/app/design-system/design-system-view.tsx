'use client';

import { useState } from 'react';
import {
  Accordion,
  Badge,
  Button,
  Card,
  Chip,
  Container,
  Input,
  Logo,
  Section,
  Select,
  Sheet,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useTheme,
  useToast,
} from '@askalert/ui';

const tokens = [
  { name: '--orange-500', swatch: 'bg-orange-500', note: 'Primary' },
  { name: '--orange-400', swatch: 'bg-orange-400', note: 'Gradient end' },
  { name: '--orange-700', swatch: 'bg-orange-700', note: 'Orange text on white' },
  { name: '--navy-900', swatch: 'bg-navy-900', note: 'Brand navy' },
  { name: '--navy-950', swatch: 'bg-navy-950', note: 'Dark page bg' },
  { name: '--navy-700', swatch: 'bg-navy-700', note: 'Dark card accent' },
  { name: '--surface', swatch: 'bg-surface border border-border', note: 'Surface' },
  { name: '--surface-subtle', swatch: 'bg-surface-subtle border border-border', note: 'Subtle' },
  { name: '--border', swatch: 'bg-border', note: 'Border' },
  { name: '--success', swatch: 'bg-success', note: 'Success' },
  { name: '--warning', swatch: 'bg-warning', note: 'Warning' },
  { name: '--danger', swatch: 'bg-danger', note: 'Danger' },
] as const;

function ThemeControls() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Theme</p>
        <p className="text-sm text-muted-foreground">
          Preference: {theme}. Resolved: {resolvedTheme}.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="md"
          variant={theme === 'system' ? 'primary' : 'secondary'}
          onClick={() => setTheme('system')}
        >
          System
        </Button>
        <Button
          size="md"
          variant={theme === 'light' ? 'primary' : 'secondary'}
          onClick={() => setTheme('light')}
        >
          Light
        </Button>
        <Button
          size="md"
          variant={theme === 'dark' ? 'primary' : 'secondary'}
          onClick={() => setTheme('dark')}
        >
          Dark
        </Button>
      </div>
    </Card>
  );
}

function InteractiveDemo() {
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [budget, setBudget] = useState(50);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => toast({ title: 'Alert queued', description: 'We will notify vendors.' })}>
          Show toast
        </Button>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="What do you need?" placeholder="Plumber in Lekki" hint="Keep it short." />
        <Select
          label="Category"
          options={[
            { value: 'home', label: 'Home services' },
            { value: 'food', label: 'Food and drinks' },
          ]}
        />
      </div>

      <Slider
        label="Budget comfort"
        min={0}
        max={100}
        value={budget}
        valueLabel={`${budget}%`}
        onChange={(event) => setBudget(Number(event.target.value))}
      />

      <Tabs defaultValue="buy">
        <TabsList>
          <TabsTrigger value="buy">I want to buy</TabsTrigger>
          <TabsTrigger value="sell">I want to sell</TabsTrigger>
        </TabsList>
        <TabsContent value="buy">
          <Card>Tell AskAlert what you need. We find and negotiate for you.</Card>
        </TabsContent>
        <TabsContent value="sell">
          <Card>List your offer. Buyers reach you through protected alerts.</Card>
        </TabsContent>
      </Tabs>

      <Accordion
        items={[
          {
            id: 'how',
            title: 'How AskAlert works',
            content: 'Ask once. We alert vendors or buyers and bring back options.',
          },
          {
            id: 'pay',
            title: 'How payment works',
            content: 'Direct payment stays between you and the other party.',
          },
        ]}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Bottom sheet">
        <p className="text-sm text-muted-foreground">
          On mobile this docks to the bottom. Press Escape or Close to dismiss.
        </p>
        <div className="mt-4">
          <Button onClick={() => setSheetOpen(false)}>Done</Button>
        </div>
      </Sheet>
    </div>
  );
}

export function DesignSystemView() {
  return (
    <main className="pb-20">
      <Container width="xl">
        <Section
          title="AskAlert design system"
          description="Tokens and components for light and dark mode. Tab through to check focus rings."
        >
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <Logo />
            <div className="rounded-2xl bg-navy-900 p-4">
              <Logo variant="reversed" />
            </div>
          </div>

          <ThemeControls />
        </Section>

        <Section title="Color tokens" description="Defined as CSS variables and mapped into Tailwind.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tokens.map((token) => (
              <Card key={token.name} className="p-3">
                <div className={`mb-3 h-14 rounded-xl ${token.swatch}`} />
                <p className="font-mono text-xs text-foreground">{token.name}</p>
                <p className="text-sm text-muted-foreground">{token.note}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Typography" description="Plus Jakarta Sans, weights 400 to 800.">
          <Card className="space-y-3">
            <h1 className="text-4xl font-extrabold sm:text-5xl">Ask. Alert. Delivered.</h1>
            <h2 className="text-3xl font-bold">Large friendly headings</h2>
            <p className="text-lg font-medium">Comfortable body copy for marketplace flows.</p>
            <p className="text-sm text-muted-foreground">
              Short sentences. Plain English. Navy text on orange buttons.
            </p>
          </Card>
        </Section>

        <Section title="Buttons" description="Primary uses navy text on orange. Never white small text on orange.">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="md">Primary md</Button>
            <Button size="lg">Primary lg</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Section>

        <Section title="Chips and badges">
          <div className="flex flex-wrap gap-3">
            <Chip>Lekki</Chip>
            <Chip statusDot>Vendor online</Chip>
            <Badge variant="verified" />
            <Badge variant="protected" />
            <Badge variant="direct-payment" />
          </div>
        </Section>

        <Section title="Interactive components">
          <InteractiveDemo />
        </Section>
      </Container>
    </main>
  );
}
