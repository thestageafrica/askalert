'use client';

import { useParams } from 'next/navigation';
import { CategoryEditor } from '../../../components/category-editor';

export function CategoryDetailPageClient() {
  const params = useParams<{ id: string }>();
  return <CategoryEditor categoryId={params.id ?? 'shortlets'} />;
}
