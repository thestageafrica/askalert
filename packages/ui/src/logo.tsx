'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from './lib/cn';

export type LogoVariant = 'default' | 'reversed';

export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  variant?: LogoVariant;
  alt?: string;
};

const DEFAULT_SRC = '/brand/askalert-logo.png';
const REVERSED_SOURCES = [
  '/brand/askalert-logo-reversed.png',
  '/brand/askalert-logo-all-white.png',
] as const;

function Wordmark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span
      className={cn(
        'text-lg font-extrabold tracking-tight',
        onDark ? 'text-surface' : 'text-navy-900',
        className,
      )}
    >
      Ask<span className="text-orange-500">Alert</span>
    </span>
  );
}

export function Logo({
  variant = 'default',
  alt = 'AskAlert',
  className,
  ...props
}: LogoProps) {
  const [defaultFailed, setDefaultFailed] = useState(false);
  const [reversedIndex, setReversedIndex] = useState(0);
  const wantsReversed = variant === 'reversed';
  const reversedExhausted = wantsReversed && reversedIndex >= REVERSED_SOURCES.length;

  if (defaultFailed && !wantsReversed) {
    return <Wordmark className={className} />;
  }

  if (reversedExhausted) {
    return <Wordmark className={className} onDark />;
  }

  const src = wantsReversed ? REVERSED_SOURCES[reversedIndex] : DEFAULT_SRC;

  return (
    <img
      src={src}
      alt={alt}
      width={160}
      height={32}
      decoding="async"
      className={cn('h-8 w-auto', className)}
      onError={() => {
        if (wantsReversed) {
          setReversedIndex((current) => current + 1);
          return;
        }
        setDefaultFailed(true);
      }}
      {...props}
    />
  );
}
