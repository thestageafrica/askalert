import { cn } from '@askalert/ui';
import type { ReactNode } from 'react';

function MiniPhone({
  children,
  className,
  light = false,
}: {
  children: ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <div
      className={cn(
        'absolute w-[200px] rounded-[28px] p-[6px] sm:w-[230px] lg:w-[250px]',
        'bg-[linear-gradient(160deg,var(--navy-700),var(--navy-950))]',
        'shadow-[0_30px_70px_-24px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.14)]',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex h-[390px] flex-col overflow-hidden rounded-[22px] sm:h-[440px] lg:h-[480px]',
          light ? 'bg-surface text-navy-900' : 'bg-navy-950 text-surface',
        )}
      >
        <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-navy-950" aria-hidden />
        <div
          className={cn(
            'flex items-center justify-between px-4 pt-2.5 text-[9px] font-semibold',
            light ? 'text-navy-900' : 'text-surface',
          )}
        >
          <span>9:41</span>
          <span className="opacity-70">●●●</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-1 pt-1">{children}</div>
        <div className="flex justify-center pb-2" aria-hidden>
          <span className={cn('h-1 w-20 rounded-full', light ? 'bg-navy-900/20' : 'bg-surface/30')} />
        </div>
      </div>
    </div>
  );
}

function RequestMini() {
  return (
    <>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-orange-400">New ask</p>
      <p className="text-xs font-extrabold text-surface">AskAlert</p>
      <div className="mt-2 rounded-xl border border-surface/10 bg-navy-900 p-2.5">
        <p className="text-[10px] font-bold">2-bedroom shortlet</p>
        <p className="mt-0.5 text-[9px] text-surface/60">Lagos · Fri–Sun</p>
        <p className="mt-2 text-sm font-extrabold text-orange-400">₦150,000</p>
      </div>
      <div className="mt-2 rounded-xl bg-orange-500/10 p-2.5">
        <p className="text-[9px] font-semibold text-surface">Asking verified hosts…</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-900">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
        </div>
      </div>
      <div className="mt-auto rounded-full bg-orange-500 py-2 text-center text-[10px] font-extrabold text-navy-900">
        Send on WhatsApp
      </div>
    </>
  );
}

function QuotesMini() {
  return (
    <>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-orange-700">Compare</p>
      <p className="text-xs font-extrabold text-navy-900">3 offers</p>
      <div className="mt-2 space-y-1.5">
        {[
          { name: 'Oceanview', price: '₦145k' },
          { name: 'Palm Court', price: '₦132k' },
          { name: 'Lagos Nest', price: '₦128.5k', best: true },
        ].map((offer) => (
          <div
            key={offer.name}
            className={cn(
              'rounded-xl border px-2.5 py-2',
              offer.best ? 'border-orange-500/40 bg-orange-500/10' : 'border-border bg-surface-subtle',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-navy-900">{offer.name}</p>
              <p className="text-[10px] font-extrabold text-navy-900">{offer.price}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-full bg-orange-500 py-2 text-center text-[10px] font-extrabold text-navy-900">
        Choose Nest
      </div>
    </>
  );
}

export function HeroPhones() {
  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[520px] lg:h-[560px]" aria-hidden>
      <MiniPhone
        light
        className="left-1/2 top-12 z-0 -translate-x-[92%] -rotate-6 opacity-90 sm:top-[50px]"
      >
        <QuotesMini />
      </MiniPhone>
      <MiniPhone className="left-1/2 top-2 z-10 -translate-x-[10%] rotate-[4deg]">
        <RequestMini />
      </MiniPhone>

      <span className="absolute bottom-8 left-0 z-20 max-w-[220px] animate-[bob_5s_ease-in-out_infinite] rounded-2xl border border-surface/15 bg-navy-950/90 px-3 py-2.5 text-xs font-bold text-surface shadow-xl sm:bottom-16">
        Verified vendors · Lagos
      </span>
      <span className="absolute right-0 top-8 z-20 max-w-[230px] animate-[bob_5s_ease-in-out_infinite] rounded-2xl border border-surface/15 bg-navy-950/90 px-3 py-2.5 text-xs font-bold text-surface shadow-xl [animation-delay:-2.5s] sm:top-16">
        Hold 40% until you confirm
      </span>
    </div>
  );
}
