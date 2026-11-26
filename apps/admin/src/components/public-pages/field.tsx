'use client';

import { cn } from '@askalert/ui';
import type { TextareaHTMLAttributes } from 'react';

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <textarea
        className={cn(
          'min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-base text-navy-900',
          'placeholder:text-navy-700/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'dark:bg-navy-900 dark:text-surface dark:placeholder:text-surface/40',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
