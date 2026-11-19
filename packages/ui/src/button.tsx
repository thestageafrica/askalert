'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-linear-to-r from-orange-500 to-orange-400 text-navy-900',
    'shadow-[var(--shadow-orange-glow)]',
    'hover:brightness-[1.03] active:brightness-95',
  ),
  secondary: cn(
    'border bg-surface/10 text-foreground backdrop-blur-sm',
    'border-navy-900/20 dark:border-surface/35 dark:bg-surface/10',
    'hover:bg-surface-subtle dark:hover:bg-surface/15',
  ),
  ghost: 'bg-transparent text-foreground hover:bg-surface-subtle dark:hover:bg-navy-700',
};

export function Button({
  children,
  className,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
