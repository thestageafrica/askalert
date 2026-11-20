import type { CategoryStatus } from '@askalert/category-engine';
import { cn } from '@askalert/ui';

const styles: Record<CategoryStatus, string> = {
  draft: 'bg-card-muted text-muted-foreground',
  pilot: 'bg-orange-500/15 text-orange-700',
  live: 'bg-success/15 text-navy-900',
  paused: 'bg-warning/20 text-navy-900',
};

export function StatusChip({ status }: { status: CategoryStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize',
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
