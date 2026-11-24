import { listSeedCategories } from '@askalert/category-engine';
import { CategoryDetailPageClient } from './page-client';

/** Static export only serves these paths. Use slugs (not DB UUIDs) in links. */
export function generateStaticParams() {
  return [
    { id: 'new' },
    ...listSeedCategories().map((category) => ({ id: category.slug })),
  ];
}

export const dynamicParams = false;

export default function CategoryDetailPage() {
  return <CategoryDetailPageClient />;
}
