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
        'inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5',
        'text-sm font-medium text-foreground',
        className,
      )}
      {...props}
    >
      {statusDot ? (
        <span className="size-2 rounded-full bg-success" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
