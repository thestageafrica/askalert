'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@askalert/ui';
import { StatusChip } from '../../components/status-chip';
import { useAdminStore } from '../../lib/admin-store';
import { canEditCategories } from '../../lib/roles';

export default function CategoriesPage() {
  const router = useRouter();
  const { categories, createCategory, role } = useAdminStore();
  const canEdit = canEditCategories(role);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Config-driven marketplace categories from the category engine.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!canEdit}
            onClick={() => {
              const created = createCategory();
              router.push(`/categories/${created.id}`);
            }}
          >
            Create blank
          </Button>
          <Button
            variant="secondary"
            disabled={!canEdit || categories.length === 0}
            onClick={() => {
              const created = createCategory(categories[0]?.id);
              router.push(`/categories/${created.id}`);
            }}
          >
            Duplicate first
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
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
              <tr key={category.id} className="border-t border-border">
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
                    href={`/categories/${category.id}`}
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
