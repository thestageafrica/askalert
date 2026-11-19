import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
};

const widths = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
} as const;

export function Container({
  children,
  className,
  width = 'lg',
  ...props
}: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', widths[width], className)} {...props}>
      {children}
    </div>
  );
}
