'use client';

import { Button } from '@askalert/ui';
import { EmptyState } from '../../../components/app/empty-state';
import { useVendorStore } from '../../../lib/vendor/vendor-store';

export default function VendorBookingsPage() {
  const { bookings } = useVendorStore();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Bookings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Confirmed jobs land here after checkout.</p>
      <div className="mt-6">
        {bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="When a buyer books your quote, the job will show up here."
            action={<Button href="/vendor/leads/">Open leads</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="rounded-[1.25rem] border border-border/60 bg-card px-4 py-3"
              >
                <p className="font-extrabold">{booking.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.when} · {booking.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
