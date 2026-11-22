'use client';

import { useMemo, useState } from 'react';
import { computeEscrowSplit, createMoney, formatNaira } from '@askalert/payments';
import { Card, Section, Slider, cn } from '@askalert/ui';
import {
  DEMO_COMMISSION_PCT,
  DEMO_ESCROW_BOUNDS,
  DEMO_FEE_BEARER,
  DEMO_HOLD_PCT,
  DEMO_PROCESSING_FEE_MINOR,
  DEMO_TOTAL_MINOR,
} from '../../lib/app/mock-data';

export function ProtectSlider() {
  const [holdPercent, setHoldPercent] = useState(DEMO_HOLD_PCT);

  const split = useMemo(
    () =>
      computeEscrowSplit({
        totalMinor: DEMO_TOTAL_MINOR,
        commissionPct: DEMO_COMMISSION_PCT,
        processingFeeMinor: DEMO_PROCESSING_FEE_MINOR,
        feeBearer: DEMO_FEE_BEARER,
        holdPct: holdPercent,
        bounds: DEMO_ESCROW_BOUNDS,
      }),
    [holdPercent],
  );

  const vendorPct = 100 - split.effectiveHoldPct;
  const total = createMoney(DEMO_TOTAL_MINOR);
  const vendorNow = createMoney(split.releasedNowMinor);
  const held = createMoney(split.heldMinor);

  return (
    <Section
      id="protect"
      eyebrow="Protected payments"
      title="You decide how much to protect"
      description="Pay once. Split the payout your way. AskAlert can hold a share until you confirm the job went well."
      className="scroll-mt-24"
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <div className="space-y-4">
          <Card className="bg-navy-950 text-surface dark:bg-navy-900">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
              Why hold money?
            </p>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight">
              Protection is a choice, not a trap.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-surface/75">
              Some jobs need trust first. Move the hold up when you want more safety. Move it down
              when you already know the vendor. You stay in control.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-surface/80">
              {[
                'Vendor can still get paid quickly for the rest',
                'Held amount releases when you confirm the job',
                'Your contact stays private until you book',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'You pay', value: formatNaira(total), tone: 'bg-card' },
              {
                label: 'Vendor now',
                value: formatNaira(vendorNow),
                tone: 'bg-success/10 border-success/25',
              },
              {
                label: 'AskAlert holds',
                value: formatNaira(held),
                tone: 'bg-orange-500/10 border-orange-500/25',
              },
            ].map((item) => (
              <Card key={item.label} className={cn('border p-4', item.tone)}>
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-extrabold tracking-tight text-foreground">
                  {item.value}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="flex flex-col p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">Try a hold amount</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Example job total {formatNaira(total)}
              </p>
            </div>
            <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-extrabold text-navy-900">
              {split.effectiveHoldPct}%
            </span>
          </div>

          <Slider
            label="Hold %"
            min={0}
            max={100}
            step={5}
            value={holdPercent}
            valueLabel={`${split.effectiveHoldPct}% held`}
            onChange={(event) => setHoldPercent(Number(event.target.value))}
          />

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Vendor {vendorPct}%</span>
              <span>Hold {split.effectiveHoldPct}%</span>
            </div>
            <div className="flex h-4 overflow-hidden rounded-full bg-surface-subtle dark:bg-navy-700">
              <div
                className="bg-success transition-all duration-200"
                style={{ width: `${vendorPct}%` }}
              />
              <div
                className="bg-orange-500 transition-all duration-200"
                style={{ width: `${split.effectiveHoldPct}%` }}
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-surface-subtle p-4 dark:bg-navy-950/50">
            <p className="text-base text-foreground">
              You pay <strong>{formatNaira(total)}</strong>. Vendor receives{' '}
              <strong>{formatNaira(vendorNow)}</strong> now. AskAlert holds{' '}
              <strong>{formatNaira(held)}</strong> until you confirm the job.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Commission and processing fees come out first. Hold applies to the remaining{' '}
              {formatNaira(createMoney(split.distributableMinor))}.
            </p>
          </div>
        </Card>
      </div>
    </Section>
  );
}
