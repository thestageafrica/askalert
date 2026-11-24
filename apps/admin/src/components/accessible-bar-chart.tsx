import { cn } from '@askalert/ui';

export type BarDatum = {
  label: string;
  value: number;
};

export function AccessibleBarChart({
  title,
  data,
  valueFormatter,
}: {
  title: string;
  data: BarDatum[];
  valueFormatter: (value: number) => string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <figure className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
      <figcaption className="text-sm font-bold text-foreground">{title}</figcaption>
      <ul className="mt-4 space-y-3" aria-label={title}>
        {data.map((item) => {
          const pct = Math.round((item.value / max) * 100);
          return (
            <li key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="text-muted-foreground">{valueFormatter(item.value)}</span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-card-muted"
                role="img"
                aria-label={`${item.label}: ${valueFormatter(item.value)}`}
              >
                <div
                  className={cn('h-full rounded-full bg-orange-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
