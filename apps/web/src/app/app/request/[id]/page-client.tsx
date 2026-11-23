'use client';

import { useParams } from 'next/navigation';
import { RequestDetailView } from '../../../../components/app/request-detail-view';

export function RequestPageClient() {
  const params = useParams<{ id: string }>();
  return <RequestDetailView requestId={params.id ?? 'req_shortlet_01'} />;
}
