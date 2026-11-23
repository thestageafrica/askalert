'use client';

import { useParams } from 'next/navigation';
import { NewRequestFlow } from '../../../../components/app/new-request-flow';

export function NewRequestPageClient() {
  const params = useParams<{ category: string }>();
  return <NewRequestFlow categorySlug={params.category ?? 'shortlets'} />;
}
