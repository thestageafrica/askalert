import { listSeedCategories } from '@askalert/category-engine';
import { NewRequestPageClient } from './page-client';

export function generateStaticParams() {
  return listSeedCategories().map((category) => ({ category: category.slug }));
}

export default function NewRequestPage() {
  return <NewRequestPageClient />;
}
