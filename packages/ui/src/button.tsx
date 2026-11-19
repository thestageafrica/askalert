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
  md: 'h-11 px-5 text-sm leading-none',
  lg: 'h-12 px-7 text-base leading-none sm:h-14 sm:px-8',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'border border-orange-400/40 bg-gradient-to-r from-orange-500 to-orange-400 text-navy-900',
    'shadow-[0_10px_28px_var(--glow-orange)]',
    'hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--glow-orange-strong)] hover:brightness-[1.03]',
    'active:translate-y-0 active:brightness-95',
  ),
  secondary: cn(
    'border border-navy-900/15 bg-surface text-navy-900',
    'hover:-translate-y-0.5 hover:bg-surface-subtle',
    'dark:border-surface/35 dark:bg-surface/10 dark:text-surface dark:hover:bg-surface/15',
  ),
  ghost: cn(
    'border border-transparent bg-transparent text-foreground',
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
    'inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap',
    'transition duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
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
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
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
