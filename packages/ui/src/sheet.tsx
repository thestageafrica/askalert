'use client';

import { useEffect, useRef, type ReactNode, type TouchEvent } from 'react';
import { cn } from './lib/cn';

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onOpenChange, title, children, className }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        return;
      }
      if (event.key !== 'Tab' || !panel) {
        return;
      }
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute('disabled') && node.tabIndex !== -1,
      );
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  const onTouchStart = (event: TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartY.current;
    const end = event.changedTouches[0]?.clientY;
    touchStartY.current = null;
    if (start == null || end == null) {
      return;
    }
    if (end - start > 80) {
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-navy-950/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 shadow-xl',
          'sm:rounded-2xl',
          'max-h-[85vh] overflow-y-auto',
          className,
        )}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden"
          aria-hidden
        />
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button
            type="button"
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full',
              'text-muted-foreground hover:bg-card-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
