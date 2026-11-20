import type { ReactNode } from 'react';
import { cn } from '@askalert/ui';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.5rem] border border-dashed border-border bg-card px-5 py-8 text-center shadow-sm',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,_var(--glow-orange),_transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-navy-950 text-orange-400 shadow-md shadow-navy-950/20">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 17 17 7M10 7h7v7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="relative text-base font-extrabold text-foreground">{title}</p>
      <p className="relative mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action ? <div className="relative mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
