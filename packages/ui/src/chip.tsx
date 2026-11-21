import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  statusDot?: boolean;
};

export function Chip({ children, statusDot = false, className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5',
        'text-sm font-medium text-foreground backdrop-blur-md',
        className,
      )}
      {...props}
    >
      {statusDot ? (
        <span className="relative flex size-2.5" aria-hidden>
          <span className="absolute inline-flex size-full rounded-full bg-success opacity-40 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
      ) : null}
      {children}
    </span>
  );
}
