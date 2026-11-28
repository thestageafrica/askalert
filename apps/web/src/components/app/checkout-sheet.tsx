'use client';

import { useMemo, useState } from 'react';
import {
  computeEscrowSplit,
  createMoney,
  formatNaira,
  loadEscrowRuntimeConfig,
  presentCheckoutEscrow,
} from '@askalert/payments';
import { Button, Sheet, Slider, cn } from '@askalert/ui';
import { showInstallPromptAfterBooking } from '../pwa/install-prompt';
import {
  DEMO_COMMISSION_PCT,
  DEMO_ESCROW_BOUNDS,
  DEMO_FEE_BEARER,
  DEMO_HOLD_PCT,
  DEMO_PROCESSING_FEE_MINOR,
} from '../../lib/app/mock-data';
import { useMockStore } from '../../lib/app/mock-store';
import { navigateStatic, requestDoneHref } from '../../lib/app/static-nav';
import type { AppRequest, Quote } from '../../lib/app/types';

export function CheckoutSheet({
  open,
  onOpenChange,
  request,
  quote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AppRequest;
  quote: Quote | null;
}) {
  const { markBooked } = useMockStore();
  const [holdPct, setHoldPct] = useState(DEMO_HOLD_PCT);
  const [paying, setPaying] = useState(false);
  const escrowUi = useMemo(
    () => presentCheckoutEscrow(loadEscrowRuntimeConfig()),
    [],
  );

  const split = useMemo(() => {
    if (!quote) {
      return null;
    }
    return computeEscrowSplit({
      totalMinor: quote.priceMinor,
      commissionPct: DEMO_COMMISSION_PCT,
      processingFeeMinor: DEMO_PROCESSING_FEE_MINOR,
      feeBearer: DEMO_FEE_BEARER,
      holdPct,
      bounds:
        request.categorySlug === 'events'
          ? { minHoldPct: 0, maxHoldPct: 100, vendorMinReleasePct: 30 }
          : DEMO_ESCROW_BOUNDS,
    });
  }, [quote, holdPct, request.categorySlug]);

  if (!quote || !split) {
    return null;
  }

  const onConfirm = async () => {
    setPaying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    markBooked(request.id, quote);
    onOpenChange(false);
    showInstallPromptAfterBooking();
    navigateStatic(requestDoneHref(request.id, quote.id));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Checkout"
      className="sm:max-w-3xl"
    >
      <div className="mx-auto w-full max-w-3xl space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-5">
          <div className="rounded-2xl bg-navy-950 p-4 text-surface lg:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
              {quote.vendorAlias}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">
              {formatNaira(createMoney(quote.priceMinor))}
            </p>
            <p className="mt-1 text-sm text-surface/70">{request.title}</p>
          </div>

          {escrowUi.banner ? (
            <div className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-navy-950">
              {escrowUi.banner}
            </div>
          ) : null}

          {escrowUi.acceptPayment ? (
            <>
              <Slider
                label="Later release %"
                min={0}
                max={100}
                step={1}
                value={holdPct}
                valueLabel={`${split.effectiveHoldPct}% after confirmation`}
                onChange={(event) => setHoldPct(Number(event.target.value))}
              />
              <div
                className={cn(
                  'inline-flex rounded-full px-3 py-1 text-xs font-bold',
                  split.heldMinor > 0
                    ? 'bg-navy-700 text-surface'
                    : 'bg-orange-500/15 text-orange-700',
                )}
              >
                {split.protectionLabel}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
              <p className="text-sm font-extrabold text-navy-950">{escrowUi.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {escrowUi.body}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-[1.35rem] border border-border/60 bg-card-muted/60 p-4 lg:sticky lg:top-2 lg:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
            {escrowUi.acceptPayment ? 'Live summary' : 'Booking summary'}
          </p>
          {escrowUi.acceptPayment ? (
            <p className="text-sm leading-relaxed text-foreground">
              Vendor receives{' '}
              <span className="font-extrabold">
                {formatNaira(createMoney(split.releasedNowMinor))}
              </span>{' '}
              now. The remaining{' '}
              <span className="font-extrabold">
                {formatNaira(createMoney(split.heldMinor))}
              </span>{' '}
              is released after you confirm the job.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-foreground">
              Quote total{' '}
              <span className="font-extrabold">
                {formatNaira(createMoney(quote.priceMinor))}
              </span>
              . No payment is collected yet.
            </p>
          )}

          {escrowUi.partnerLine ? (
            <p className="text-xs font-semibold text-muted-foreground">{escrowUi.partnerLine}</p>
          ) : null}

          {escrowUi.acceptPayment && split.warnings.length > 0 ? (
            <ul className="space-y-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
              {split.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <Button className="w-full" loading={paying} onClick={onConfirm}>
            {escrowUi.acceptPayment
              ? `Pay ${formatNaira(createMoney(quote.priceMinor))}`
              : 'Confirm quote — payment soon'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
