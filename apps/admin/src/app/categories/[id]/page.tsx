import { listSeedCategories } from '@askalert/category-engine';
import { CategoryDetailPageClient } from './page-client';

export function generateStaticParams() {
  return listSeedCategories().map((category) => ({ id: category.slug }));
}

export default function CategoryDetailPage() {
  return <CategoryDetailPageClient />;
}
