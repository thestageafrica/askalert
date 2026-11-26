'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CategoryEditor } from '../../../components/category-editor';

function CategoryEditInner() {
  const search = useSearchParams();
  const slug = search.get('slug')?.trim() || 'new';
  return <CategoryEditor categoryId={slug} />;
}

export default function CategoryEditPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
          aria-busy="true"
          aria-label="Loading category"
        />
      }
    >
      <CategoryEditInner />
    </Suspense>
  );
}
