'use client';

import { use } from 'react';
import { CategoryEditor } from '../../../components/category-editor';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function CategoryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return <CategoryEditor categoryId={id} />;
}
