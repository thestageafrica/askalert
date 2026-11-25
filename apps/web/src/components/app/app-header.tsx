import { Logo, cn } from '@askalert/ui';
import type { ReactNode } from 'react';

export function AppHeader({
  title,
  subtitle,
  action,
  brandOnly = false,
  imageSrc,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  brandOnly?: boolean;
  /** Optional photo faded in from the right; left stays deep navy for readable copy. */
  imageSrc?: string;
}) {
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-b-[1.75rem] bg-navy-950 px-4 pb-6 pt-5 text-surface',
        'shadow-[0_18px_40px_color-mix(in_srgb,var(--navy-950)_28%,transparent)]',
      )}
    >
      {imageSrc ? (
        <>
          {/* Image sits to the right; object-right keeps the subject visible */}
          <img
            src={imageSrc}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[72%_center] opacity-90"
            aria-hidden
          />
          {/* Deep navy from the left so title/subtitle stay readable */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950 from-[0%] via-navy-950/92 via-[42%] to-navy-950/20 to-[88%]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/80 via-transparent to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_90%_20%,_var(--glow-orange-strong),_transparent_70%)]"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_85%_at_8%_-10%,_var(--navy-700)_0%,_transparent_58%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_92%_0%,_var(--glow-orange-strong),_transparent_62%)]"
            aria-hidden
          />
        </>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-navy-950/80 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
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
              <h1 className="text-[1.65rem] font-extrabold tracking-tight text-balance drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-[20rem] text-sm leading-snug text-surface/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
                  {subtitle}
                </p>
              ) : null}
            </>
          )}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </header>
  );
}
