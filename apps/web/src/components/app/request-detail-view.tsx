'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createMoney, formatNaira } from '@askalert/payments';
import { Badge, Button, Skeleton, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { CheckoutSheet } from './checkout-sheet';
import { useMockStore } from '../../lib/app/mock-store';
import { usePlanStore } from '../../lib/app/plan-store';
import type { Quote, RequestStatus } from '../../lib/app/types';

const timeline: Array<{ id: RequestStatus; label: string }> = [
  { id: 'searching', label: 'Searching' },
  { id: 'asking', label: 'Asking vendors' },
  { id: 'quotes_ready', label: 'Quotes ready' },
  { id: 'booked', label: 'Booked' },
];

const AI_TIPS = [
  'Pick the recommended host if dates and budget already fit.',
  'Ask about early check-in before you book — many Lekki hosts can flex.',
  'Compare rating and reason together, not price alone.',
];

function statusIndex(status: RequestStatus) {
  return timeline.findIndex((item) => item.id === status);
}

export function RequestDetailView({ requestId }: { requestId: string }) {
  const { getRequest } = useMockStore();
  const { consume } = usePlanStore();
  const request = getRequest(requestId);
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  const sortedQuotes = useMemo(() => {
    if (!request) {
      return [];
    }
    return [...request.quotes].sort((a, b) => Number(b.recommended) - Number(a.recommended));
  }, [request]);

  if (!request) {
    return (
      <div className="p-4">
        <AppHeader title="Request not found" subtitle="That ask is not in this session." />
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Start a new ask from Home.</p>
          <Button href="/app" className="mt-4">
            Back home
          </Button>
        </div>
      </div>
    );
  }

  if (request.status === 'asking' || request.status === 'searching') {
    return (
      <div>
        <AppHeader title={request.title} subtitle="AskAlert is on it." />
        <div className="space-y-4 px-4 pt-5" aria-busy="true" aria-label="Searching vendors">
          <Timeline status={request.status} />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <p className="text-center text-sm text-muted-foreground">
            Asking verified vendors… quotes will land here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader
        title={request.title}
        subtitle={`${request.categoryName} · ${request.involvement}`}
        action={
          <Link
            href={`/app/chat/${request.chatId}`}
            className="rounded-full border border-surface/20 px-3 py-2 text-xs font-bold text-surface"
          >
            Chat
          </Link>
        }
      />

      <div className="space-y-5 px-4 pt-5">
        <Timeline status={request.status} />

        {planNotice ? (
          <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-navy-950">
            {planNotice}{' '}
            <Link href="/app/plan" className="font-bold underline">
              Your plan
            </Link>
          </p>
        ) : null}

        {aiTip ? (
          <p className="rounded-2xl border border-border/70 bg-card px-3 py-3 text-sm text-foreground">
            <span className="font-bold text-navy-950">AI tip: </span>
            {aiTip}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => {
              const entitlement = consume('ai_suggestion');
              if (entitlement.blocked && entitlement.decision.outcome === 'block') {
                setPlanNotice(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
                return;
              }
              if (entitlement.decision.outcome === 'warn_at_80') {
                setPlanNotice(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
              } else {
                setPlanNotice(null);
              }
              const hash = request.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
              const current = aiTip ? AI_TIPS.indexOf(aiTip) : -1;
              const next = (current >= 0 ? current + 1 : hash) % AI_TIPS.length;
              setAiTip(AI_TIPS[next] ?? AI_TIPS[0]!);
            }}
          >
            Get AI tip
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              const entitlement = consume('send_whatsapp');
              if (entitlement.blocked && entitlement.decision.outcome === 'block') {
                setPlanNotice(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
                return;
              }
              setPlanNotice('WhatsApp chat is unlocked on your plan. Keep using in-app chat for now.');
            }}
          >
            Continue on WhatsApp
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">Quotes</h2>
          <Button variant="ghost" onClick={() => setCompare((value) => !value)}>
            {compare ? 'Hide compare' : 'Compare'}
          </Button>
        </div>

        {compare ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-card-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-border">
                    <td className="px-3 py-3 font-semibold">{quote.vendorAlias}</td>
                    <td className="px-3 py-3">{formatNaira(createMoney(quote.priceMinor))}</td>
                    <td className="px-3 py-3">{quote.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="space-y-3">
          {sortedQuotes.map((quote) => (
            <article
              key={quote.id}
              className={cn(
                'rounded-[1.5rem] border bg-card p-4 shadow-sm',
                quote.recommended
                  ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-card'
                  : 'border-border/70',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold text-foreground">{quote.vendorAlias}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.availability}</p>
                </div>
                <p className="text-base font-extrabold text-foreground">
                  {formatNaira(createMoney(quote.priceMinor))}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {quote.verified ? <Badge variant="verified" /> : null}
                <span className="rounded-full bg-card-muted px-3 py-1 text-xs font-semibold">
                  {quote.rating.toFixed(1)} rating
                </span>
                {quote.recommended ? (
                  <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-navy-900">
                    Recommended
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{quote.reason}</p>
              <Button
                className="mt-4 w-full"
                disabled={request.status === 'booked'}
                onClick={() => {
                  setSelected(quote);
                  setCheckoutOpen(true);
                }}
              >
                {request.status === 'booked' ? 'Already booked' : 'Book'}
              </Button>
            </article>
          ))}
        </div>
      </div>

      <CheckoutSheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        request={request}
        quote={selected}
      />
    </div>
  );
}

function Timeline({ status }: { status: RequestStatus }) {
  const active = statusIndex(status);
  return (
    <ol className="grid grid-cols-4 gap-2 rounded-[1.35rem] border border-border/60 bg-card p-3 shadow-sm">
      {timeline.map((item, index) => {
        const done = index <= active;
        const current = index === active;
        return (
          <li key={item.id} className="text-center">
            <div
              className={cn(
                'mx-auto mb-2 h-1.5 rounded-full transition',
                done ? 'bg-orange-500' : 'bg-border',
                current && 'shadow-[0_0_12px_var(--glow-orange)]',
              )}
            />
            <p
              className={cn(
                'text-[10px] font-semibold leading-tight',
                done ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
