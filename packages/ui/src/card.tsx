import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-card p-5 text-foreground shadow-sm shadow-navy-950/5',
        'transition duration-200 hover:border-border hover:shadow-md hover:shadow-navy-950/8',
        'dark:bg-navy-900 dark:shadow-navy-950/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
