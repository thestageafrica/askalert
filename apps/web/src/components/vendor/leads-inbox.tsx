'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, cn } from '@askalert/ui';
import { createMoney, formatNaira, formatNairaInput, parseNairaInput } from '@askalert/payments';
import { usePlanStore } from '../../lib/app/plan-store';
import { useVendorStore } from '../../lib/vendor/vendor-store';
import type { VendorLead } from '../../lib/vendor/types';

export function LeadsInbox() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get('id');
  const { leads, draft, setLeadStatus, ready } = useVendorStore();
  const { consume, check } = usePlanStore();
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [quoteMinor, setQuoteMinor] = useState(0);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => leads.find((lead) => lead.id === (selectedId ?? focusId)) ?? leads[0] ?? null,
    [leads, selectedId, focusId],
  );

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-2xl bg-card-muted" aria-busy="true" />;
  }

  const openLead = (lead: VendorLead) => {
    setSelectedId(lead.id);
    setMessage(null);
    const card = draft.rateCards.find((item) => item.categorySlug === lead.categorySlug);
    setQuoteMinor(card?.startingPriceMinor ?? lead.budgetMinor);
    if (lead.status === 'new') {
      const entitlement = consume('send_whatsapp');
      if (entitlement.blocked && entitlement.decision.outcome === 'block') {
        setMessage(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
      }
    }
  };

  const onQuote = () => {
    if (!selected) {
      return;
    }
    if (quoteMinor < 100_00) {
      setMessage('Enter a valid quote amount.');
      return;
    }
    setLeadStatus(selected.id, 'quoted');
    setMessage(`Quote of ${formatNaira(createMoney(quoteMinor))} sent${note ? ` · ${note}` : ''}.`);
  };

  const remaining = check('send_whatsapp').remaining;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Leads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mock inbox until the mission engine ships.
          {remaining != null ? ` ${remaining} lead alerts left this month.` : null}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <ul className="space-y-2">
          {leads.map((lead) => {
            const active = selected?.id === lead.id;
            return (
              <li key={lead.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-[1.25rem] border px-4 py-3 text-left transition',
                    active
                      ? 'border-orange-500/40 bg-orange-500/10'
                      : 'border-border/60 bg-card hover:border-orange-500/30',
                  )}
                  onClick={() => openLead(lead)}
                >
                  <p className="text-sm font-extrabold text-foreground">{lead.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lead.categoryName} · {lead.status}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        {selected ? (
          <section className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
              {selected.categoryName}
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-foreground">{selected.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{selected.summary}</p>
            <p className="mt-3 text-sm font-semibold">
              Budget {formatNaira(createMoney(selected.budgetMinor))} · {selected.area}
            </p>

            <div className="mt-5 space-y-3">
              <Input
                label="Your quote (₦)"
                value={formatNairaInput(quoteMinor)}
                onChange={(event) => setQuoteMinor(parseNairaInput(event.target.value) || 0)}
              />
              <Input
                label="Note to buyer"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional"
              />
            </div>

            {message ? (
              <p className="mt-3 text-sm font-medium text-foreground">{message}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={onQuote}>Quote</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setLeadStatus(selected.id, 'declined');
                  setMessage('Lead declined.');
                }}
              >
                Decline
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setLeadStatus(selected.id, 'questioned', `chat_${selected.id}`);
                  setMessage('Question sent in chat. (Thread UI shares buyer chat components.)');
                }}
              >
                Ask a question
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
