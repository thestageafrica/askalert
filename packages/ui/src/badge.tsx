import type { HTMLAttributes } from 'react';
import { cn } from './lib/cn';

export type BadgeVariant = 'verified' | 'protected' | 'direct-payment';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant: BadgeVariant;
};

const labels: Record<BadgeVariant, string> = {
  verified: 'Verified',
  protected: 'Paid on AskAlert',
  'direct-payment': 'Direct payment',
};

const styles: Record<BadgeVariant, string> = {
  verified: 'bg-success/15 text-navy-900 dark:text-surface',
  protected: 'bg-navy-700 text-surface',
  'direct-payment': 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
};

export function Badge({ variant, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        styles[variant],
        className,
      )}
      {...props}
    >
      {labels[variant]}
    </span>
  );
}
