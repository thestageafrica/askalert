'use client';

import { useMemo, useState } from 'react';
import { createMoney, formatNaira } from '@askalert/payments';
import { Card, Section, Slider } from '@askalert/ui';

const PAY_KOBO = 10_000_000; // ₦100,000
const DISTRIBUTABLE_KOBO = 8_640_000; // ₦86,400 placeholder until Prompt 7

export function ProtectSlider() {
  const [holdPercent, setHoldPercent] = useState(40);

  const { vendorNow, held } = useMemo(() => {
    const heldKobo = Math.trunc((DISTRIBUTABLE_KOBO * holdPercent) / 100);
    return {
      held: createMoney(heldKobo),
      vendorNow: createMoney(DISTRIBUTABLE_KOBO - heldKobo),
    };
  }, [holdPercent]);

  return (
    <Section
      id="protect"
      title="You decide how much to protect"
      description="AskAlert can hold part of the payout until you confirm the job. Move the slider to see how it splits."
      className="scroll-mt-24"
    >
      <Card className="max-w-2xl">
        <Slider
          label="Hold %"
          min={0}
          max={100}
          step={1}
          value={holdPercent}
          valueLabel={`${holdPercent}%`}
          onChange={(event) => setHoldPercent(Number(event.target.value))}
        />
        <p className="mt-6 text-base text-foreground">
          You pay {formatNaira(createMoney(PAY_KOBO))}. Vendor receives{' '}
          <strong>{formatNaira(vendorNow)}</strong> now. AskAlert holds{' '}
          <strong>{formatNaira(held)}</strong> until you confirm the job.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Placeholder maths use a distributable amount of{' '}
          {formatNaira(createMoney(DISTRIBUTABLE_KOBO))}.
        </p>
      </Card>
    </Section>
  );
}
