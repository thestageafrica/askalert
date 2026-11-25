'use client';

import { Button, Input, cn } from '@askalert/ui';
import { useVendorStore } from '../../../lib/vendor/vendor-store';

export default function VendorAvailabilityPage() {
  const { draft, updateDraft } = useVendorStore();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Availability</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Weekly hours and blackout dates. Changes save on this device.
      </p>
      <div className="mt-6 space-y-3">
        {draft.weeklyHours.map((day, index) => (
          <div
            key={day.day}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3"
          >
            <button
              type="button"
              className={cn(
                'min-h-10 min-w-16 rounded-xl text-xs font-bold uppercase',
                day.open ? 'bg-navy-950 text-surface' : 'bg-card-muted text-muted-foreground',
              )}
              onClick={() => {
                const weeklyHours = draft.weeklyHours.map((item, i) =>
                  i === index ? { ...item, open: !item.open } : item,
                );
                updateDraft({ weeklyHours });
              }}
            >
              {day.day}
            </button>
            <Input
              type="time"
              aria-label={`${day.day} start`}
              value={day.start}
              disabled={!day.open}
              onChange={(event) => {
                const weeklyHours = draft.weeklyHours.map((item, i) =>
                  i === index ? { ...item, start: event.target.value } : item,
                );
                updateDraft({ weeklyHours });
              }}
            />
            <Input
              type="time"
              aria-label={`${day.day} end`}
              value={day.end}
              disabled={!day.open}
              onChange={(event) => {
                const weeklyHours = draft.weeklyHours.map((item, i) =>
                  i === index ? { ...item, end: event.target.value } : item,
                );
                updateDraft({ weeklyHours });
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <Input
          label="Add blackout date"
          type="date"
          onChange={(event) => {
            const value = event.target.value;
            if (!value || draft.blackoutDates.includes(value)) {
              return;
            }
            updateDraft({ blackoutDates: [...draft.blackoutDates, value] });
          }}
        />
        <div className="flex flex-wrap gap-2">
          {draft.blackoutDates.map((date) => (
            <button
              key={date}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
              onClick={() =>
                updateDraft({
                  blackoutDates: draft.blackoutDates.filter((item) => item !== date),
                })
              }
            >
              {date} ×
            </button>
          ))}
        </div>
      </div>
      <Button href="/vendor/" className="mt-6" variant="secondary">
        Back to dashboard
      </Button>
    </div>
  );
}
