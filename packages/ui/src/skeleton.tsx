import type { HTMLAttributes } from 'react';
import { cn } from './lib/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-card-muted', className)}
      {...props}
    />
  );
}
