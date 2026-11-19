import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 text-foreground shadow-sm',
        'dark:bg-navy-900',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
