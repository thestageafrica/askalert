'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SuccessBody } from '../[id]/success/success-body';

function RequestDoneBody() {
  const params = useSearchParams();
  const requestId = params.get('id') ?? 'req_shortlet_01';
  const quoteId = params.get('quote');
  return <SuccessBody requestId={requestId} quoteId={quoteId} />;
}

export default function RequestDonePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4" aria-busy="true">
          <div className="h-40 animate-pulse rounded-2xl bg-card-muted" />
        </div>
      }
    >
      <RequestDoneBody />
    </Suspense>
  );
}
