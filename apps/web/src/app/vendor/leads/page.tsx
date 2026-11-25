import { Suspense } from 'react';
import { LeadsInbox } from '../../../components/vendor/leads-inbox';

export default function VendorLeadsPage() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-card-muted" />}>
      <LeadsInbox />
    </Suspense>
  );
}
