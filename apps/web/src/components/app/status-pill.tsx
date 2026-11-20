import { cn } from '@askalert/ui';
import type { RequestStatus } from '../../lib/app/types';

const labels: Record<RequestStatus, string> = {
  searching: 'Searching',
  asking: 'Asking vendors',
  quotes_ready: 'Quotes ready',
  booked: 'Booked',
};

const tones: Record<RequestStatus, string> = {
  searching: 'bg-navy-950/8 text-navy-900',
  asking: 'bg-orange-500/15 text-orange-700',
  quotes_ready: 'bg-success/15 text-navy-900',
  booked: 'bg-navy-950 text-surface',
};

export function StatusPill({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        tones[status],
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'booked'
            ? 'bg-orange-400'
            : status === 'quotes_ready'
              ? 'bg-success'
              : status === 'asking'
                ? 'bg-orange-500'
                : 'bg-navy-700',
        )}
        aria-hidden
      />
      {labels[status]}
    </span>
  );
}
