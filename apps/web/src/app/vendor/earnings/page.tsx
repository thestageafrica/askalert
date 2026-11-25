'use client';

import { Button } from '@askalert/ui';
import { EmptyState } from '../../../components/app/empty-state';

export default function VendorEarningsPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Earnings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Staged payouts and releases will appear here with Paystack.
      </p>
      <div className="mt-6">
        <EmptyState
          title="No earnings yet"
          description="Complete a booking to see released and held amounts in Naira."
          action={<Button href="/vendor/bookings/">View bookings</Button>}
        />
      </div>
    </div>
  );
}
