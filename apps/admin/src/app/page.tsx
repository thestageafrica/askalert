'use client';

import { Card } from '@askalert/ui';
import { useAdminStore } from '../lib/admin-store';

const cards = [
  { label: 'Active vendors', value: '128', hint: 'Verified in Lagos' },
  { label: 'Requests today', value: '46', hint: 'Across live categories' },
  { label: 'Conversion', value: '31%', hint: 'Ask → booked' },
  { label: 'Unmet demand', value: '9', hint: 'No quote in time' },
] as const;

export default function DashboardPage() {
  const { categories } = useAdminStore();
  const live = categories.filter(
    (category) => category.draft.status === 'pilot' || category.draft.status === 'live',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {live} live categories · mock numbers for Phase 1
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="border border-border/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
