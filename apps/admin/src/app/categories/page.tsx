'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@askalert/ui';
import { StatusChip } from '../../components/status-chip';
import { useAdminStore } from '../../lib/admin-store';
import { canEditCategories } from '../../lib/roles';

export default function CategoriesPage() {
  const router = useRouter();
  const { categories, categoriesLoading, createCategory, role } = useAdminStore();
  const canEdit = canEditCategories(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            Marketplace
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Config-driven marketplace categories from the category engine.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!canEdit}
            onClick={() => {
              createCategory();
              router.push('/categories/new/');
            }}
          >
            Create blank
          </Button>
          <Button
            variant="secondary"
            disabled={!canEdit || categories.length === 0}
            onClick={() => {
              createCategory(categories[0]?.draft.slug ?? categories[0]?.id);
              router.push('/categories/new/');
            }}
          >
            Duplicate first
          </Button>
        </div>
      </div>

      {categoriesLoading ? (
        <div
          className="h-32 animate-pulse rounded-2xl border border-border bg-card-muted"
          aria-busy="true"
          aria-label="Loading categories"
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="border border-border/70 p-4 shadow-[0_12px_28px_color-mix(in_srgb,var(--navy-950)_6%,transparent)] transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold text-foreground">{category.draft.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{category.draft.slug}</p>
              </div>
              <StatusChip status={category.draft.status} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-card-muted px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">
                {category.vendorsCount} vendors
              </p>
              <Link
                href={`/categories/edit/?slug=${encodeURIComponent(category.draft.slug)}`}
                className="text-sm font-bold text-orange-600 hover:underline"
              >
                {canEdit ? 'Edit' : 'View'}
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[1.35rem] border border-border/70 bg-card shadow-sm">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-card-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Vendors</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-border transition hover:bg-orange-500/5">
                <td className="px-4 py-3">
                  <p className="font-bold text-foreground">{category.draft.name}</p>
                  <p className="text-xs text-muted-foreground">{category.draft.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={category.draft.status} />
                </td>
                <td className="px-4 py-3 font-semibold">{category.vendorsCount}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/categories/edit/?slug=${encodeURIComponent(category.draft.slug)}`}
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    {canEdit ? 'Edit' : 'View'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
