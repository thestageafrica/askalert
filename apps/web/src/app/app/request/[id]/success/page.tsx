import { Suspense } from 'react';
import { Skeleton } from '@askalert/ui';
import { SuccessBody } from './success-body';

export function generateStaticParams() {
  return [{ id: 'req_shortlet_01' }];
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4" aria-busy="true">
          <Skeleton className="h-28 w-full rounded-[1.75rem]" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <SuccessBody />
    </Suspense>
  );
}
