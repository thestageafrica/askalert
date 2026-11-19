import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function Section({
  children,
  title,
  description,
  className,
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-10 sm:py-14', className)} {...props}>
      {(title || description) && (
        <header className="mb-6 max-w-2xl">
          {title ? <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h2> : null}
          {description ? (
            <p className="mt-2 text-base text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
