'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './lib/cn';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: SelectOption[];
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, options, hint, id, ...props },
  ref,
) {
  const selectId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-foreground">
      {label ? <span className="font-medium">{label}</span> : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-navy-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'dark:bg-navy-900 dark:text-surface',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-muted-foreground">{hint}</span> : null}
    </label>
  );
});
