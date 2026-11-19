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
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition',
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
