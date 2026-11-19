'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

export type ButtonAsButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type ButtonAsLinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-6 text-sm tracking-tight',
  lg: 'min-h-[3.25rem] px-8 text-[0.95rem] tracking-tight sm:min-h-14 sm:px-9 sm:text-base',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-linear-to-r from-orange-500 via-orange-500 to-orange-400 text-navy-900',
    'shadow-[var(--shadow-orange-glow)]',
    'hover:-translate-y-0.5 hover:shadow-[var(--shadow-orange-glow-strong)] hover:brightness-[1.04]',
    'active:translate-y-0 active:brightness-95',
  ),
  secondary: cn(
    'border border-navy-900/15 bg-surface/70 text-navy-900 backdrop-blur-md',
    'shadow-sm shadow-navy-950/5',
    'hover:-translate-y-0.5 hover:bg-surface hover:border-navy-900/25',
    'dark:border-surface/30 dark:bg-surface/10 dark:text-surface',
    'dark:hover:bg-surface/16 dark:hover:border-surface/45',
  ),
  ghost: cn(
    'bg-transparent text-foreground',
    'hover:bg-surface-subtle dark:hover:bg-navy-700/70',
  ),
};

function buttonClassName({
  className,
  variant = 'primary',
  size = 'md',
  disabled,
}: {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
    disabled ? 'pointer-events-none cursor-not-allowed opacity-60' : null,
    sizeClasses[size],
    variantClasses[variant],
    className,
  );
}

export function Button(props: ButtonProps) {
  const {
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    ...rest
  } = props;
  const isDisabled = Boolean(disabled || loading);
  const classes = buttonClassName({ className, variant, size, disabled: isDisabled });

  const content = (
    <>
      {loading ? (
        <span
          className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      <span>{children}</span>
    </>
  );

  if ('href' in props && props.href) {
    const { href, ...anchorProps } = rest as ButtonAsLinkProps;
    return (
      <a
        href={isDisabled ? undefined : href}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={classes}
        {...anchorProps}
      >
        {content}
      </a>
    );
  }

  const buttonProps = rest as ButtonAsButtonProps;
  return (
    <button
      type={buttonProps.type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
