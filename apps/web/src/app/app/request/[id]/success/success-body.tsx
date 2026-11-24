'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@askalert/ui';
import { AppHeader } from '../../../../../components/app/app-header';
import { useMockStore } from '../../../../../lib/app/mock-store';

export function SuccessBody() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { getRequest } = useMockStore();
  const request = getRequest(params.id);
  const quoteId = search.get('quote');
  const quote = request?.quotes.find((item) => item.id === quoteId) ?? request?.quotes[0];

  return (
    <div>
      <AppHeader title="You’re booked" subtitle="Payment recorded for this demo." />
      <div className="space-y-5 px-4 pt-5">
        <div className="rounded-[1.5rem] border border-success/30 bg-success/10 p-5">
          <p className="text-sm font-semibold text-success">Success</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
            {quote ? `Booked with ${quote.vendorAlias}` : 'Booking confirmed'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            AskAlert kept the hold you chose. Confirm the job later to release the rest.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {request ? (
            <Button href={`/app/chat/${request.chatId}/`}>Open chat</Button>
          ) : null}
          <Button href="/app" variant="secondary">
            Back home
          </Button>
          <Link href="/app/requests" className="text-center text-sm font-semibold text-orange-600">
            See all requests
          </Link>
        </div>
      </div>
    </div>
  );
}
