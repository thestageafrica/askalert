import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './lib/cn';

export type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function Section({
  children,
  eyebrow,
  title,
  description,
  className,
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-14 sm:py-20', className)} {...props}>
      {(eyebrow || title || description) && (
        <header className="mb-8 max-w-2xl sm:mb-10">
          {eyebrow ? (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-400">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
