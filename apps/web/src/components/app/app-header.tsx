import { Logo } from '@askalert/ui';
import type { ReactNode } from 'react';

export function AppHeader({
  title,
  subtitle,
  action,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-b-[1.75rem] bg-navy-950 px-4 pb-6 pt-5 text-surface shadow-lg shadow-navy-950/20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_10%_0%,_var(--navy-700)_0%,_transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_0%,_var(--glow-orange-strong),_transparent_60%)]"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          {title ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-400">
                AskAlert
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-surface/70">{subtitle}</p> : null}
            </>
          ) : (
            <Logo variant="reversed" className="h-8 w-auto" />
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
