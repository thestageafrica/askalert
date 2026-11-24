'use client';

import { useMemo, useState } from 'react';
import { computeEscrowSplit, createMoney, formatNaira } from '@askalert/payments';
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

  const onPay = async () => {
    setPaying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    markBooked(request.id, quote);
    onOpenChange(false);
    showInstallPromptAfterBooking();
    navigateStatic(requestDoneHref(request.id, quote.id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Checkout">
      <div className="space-y-5">
        <div className="rounded-2xl bg-navy-950 p-4 text-surface">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
            {quote.vendorAlias}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {formatNaira(createMoney(quote.priceMinor))}
          </p>
          <p className="mt-1 text-sm text-surface/70">{request.title}</p>
        </div>

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

        <p className="text-sm leading-relaxed text-foreground">
          Vendor receives{' '}
          <span className="font-extrabold">
            {formatNaira(createMoney(split.releasedNowMinor))}
          </span>{' '}
          now. The remaining{' '}
          <span className="font-extrabold">{formatNaira(createMoney(split.heldMinor))}</span>{' '}
          is released after you confirm the job.
        </p>

        {split.warnings.length > 0 ? (
          <ul className="space-y-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
            {split.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        <Button className="w-full" loading={paying} onClick={onPay}>
          Pay {formatNaira(createMoney(quote.priceMinor))}
        </Button>
      </div>
    </Sheet>
  );
}
