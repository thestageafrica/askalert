'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RequestDetailView } from '../../../../components/app/request-detail-view';

function RequestOpenBody() {
  const params = useSearchParams();
  const requestId = params.get('id') ?? 'req_shortlet_01';
  return <RequestDetailView requestId={requestId} />;
}

export default function RequestOpenPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4" aria-busy="true">
          <div className="h-40 animate-pulse rounded-2xl bg-card-muted" />
        </div>
      }
    >
      <RequestOpenBody />
    </Suspense>
  );
}
