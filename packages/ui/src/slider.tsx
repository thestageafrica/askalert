'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './lib/cn';

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  valueLabel?: string;
};

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, label, valueLabel, id, ...props },
  ref,
) {
  const sliderId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-foreground">
      {label || valueLabel ? (
        <span className="flex items-center justify-between gap-3 font-medium">
          <span>{label}</span>
          {valueLabel ? <span className="text-muted-foreground">{valueLabel}</span> : null}
        </span>
      ) : null}
      <input
        ref={ref}
        id={sliderId}
        type="range"
        className={cn(
          'h-11 w-full cursor-pointer appearance-none bg-transparent',
          '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full',
          '[&::-webkit-slider-runnable-track]:bg-border',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5',
          '[&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-[var(--shadow-orange-glow)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          className,
        )}
        {...props}
      />
    </label>
  );
});
