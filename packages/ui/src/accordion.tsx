'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from './lib/cn';

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
};

export function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const isOpen = current.includes(id);
      if (allowMultiple) {
        return isOpen ? current.filter((item) => item !== id) : [...current, id];
      }
      return isOpen ? [] : [id];
    });
  };

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {items.map((item) => {
        const open = openIds.includes(item.id);
        const panelId = `${baseId}-panel-${item.id}`;
        const buttonId = `${baseId}-button-${item.id}`;

        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm',
              'transition hover:border-border',
            )}
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                className={cn(
                  'flex min-h-12 w-full items-center justify-between gap-3 px-5 py-4 text-left',
                  'text-base font-bold text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                )}
                onClick={() => toggle(item.id)}
              >
                <span>{item.title}</span>
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-full bg-surface-subtle text-sm text-muted-foreground',
                    'dark:bg-navy-700',
                  )}
                >
                  {open ? '−' : '+'}
                </span>
              </button>
            </h3>
            {open ? (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-5">
                <div className="text-sm leading-relaxed text-muted-foreground">{item.content}</div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
