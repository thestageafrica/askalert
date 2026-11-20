import { Logo } from '@askalert/ui';
import type { ReactNode } from 'react';

export function AppHeader({
  title,
  subtitle,
  action,
  brandOnly = false,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  brandOnly?: boolean;
}) {
  return (
    <header className="relative overflow-hidden rounded-b-[2rem] bg-navy-950 px-4 pb-7 pt-5 text-surface shadow-[0_18px_40px_color-mix(in_srgb,var(--navy-950)_28%,transparent)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_85%_at_8%_-10%,_var(--navy-700)_0%,_transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_92%_0%,_var(--glow-orange-strong),_transparent_62%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 h-20 w-[120%] -translate-x-1/2 rounded-[100%] bg-background/95"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {brandOnly || !title ? (
            <Logo variant="reversed" className="h-8 w-auto" />
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2.5">
                <Logo variant="reversed" className="h-6 w-auto" />
                <span className="rounded-full border border-surface/15 bg-surface/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-400">
                  Lagos
                </span>
              </div>
              <h1 className="text-[1.65rem] font-extrabold tracking-tight text-balance">{title}</h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-[18rem] text-sm leading-snug text-surface/70">{subtitle}</p>
              ) : null}
            </>
          )}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </header>
  );
}
