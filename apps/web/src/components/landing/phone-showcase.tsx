import { Section, cn } from '@askalert/ui';
import type { ReactNode } from 'react';

function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div
      className={cn(
        'relative z-10 flex items-center justify-between px-5 pt-3 text-[10px] font-semibold',
        light ? 'text-navy-900' : 'text-surface',
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1" aria-hidden>
        <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-80" />
        <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-80" />
        <span className="inline-block h-2 w-4 rounded-[3px] border border-current opacity-90">
          <span className="m-[1px] block h-full w-2/3 rounded-[1px] bg-current" />
        </span>
      </div>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-navy-950 shadow-inner" aria-hidden />
  );
}

function HomeIndicator({ light = false }: { light?: boolean }) {
  return (
    <div className="mt-auto flex justify-center pb-2 pt-3" aria-hidden>
      <span
        className={cn(
          'h-1 w-24 rounded-full',
          light ? 'bg-navy-900/25' : 'bg-surface/35',
        )}
      />
    </div>
  );
}

function PhoneFrame({
  title,
  children,
  className,
  lightScreen = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  lightScreen?: boolean;
}) {
  return (
    <figure className={cn('mx-auto w-full max-w-[240px]', className)}>
      <div
        className={cn(
          'relative rounded-[34px] p-2',
          'bg-[linear-gradient(160deg,var(--navy-700),var(--navy-950))]',
          'shadow-[0_30px_70px_-24px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.14)]',
        )}
      >
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-24 h-8 w-[3px] rounded-l-full bg-navy-700" aria-hidden />
        <span className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l-full bg-navy-700" aria-hidden />
        <span className="absolute -right-[3px] top-28 h-14 w-[3px] rounded-r-full bg-navy-700" aria-hidden />

        <div
          className={cn(
            'relative flex h-[500px] flex-col overflow-hidden rounded-[27px]',
            lightScreen ? 'bg-surface text-navy-900' : 'bg-navy-950 text-surface',
          )}
        >
          <DynamicIsland />
          <StatusBar light={lightScreen} />
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-1 pt-2">{children}</div>
          <HomeIndicator light={lightScreen} />
        </div>
      </div>
      <figcaption className="mt-4 text-center text-sm font-bold text-foreground">{title}</figcaption>
    </figure>
  );
}

function RequestScreen() {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-400">New ask</p>
          <p className="text-sm font-extrabold text-surface">AskAlert</p>
        </div>
        <span className="rounded-full bg-orange-500/20 px-2 py-1 text-[10px] font-bold text-orange-400">
          Lagos
        </span>
      </div>

      <div className="rounded-2xl border border-surface/10 bg-navy-900 p-3 shadow-lg">
        <p className="text-[11px] font-bold text-surface">2-bedroom shortlet</p>
        <p className="mt-1 text-[10px] text-surface/65">Lagos · Fri–Sun</p>
        <p className="mt-3 text-sm font-extrabold text-orange-400">Budget ₦150,000</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Wi‑Fi', 'Self check-in', 'Parking'].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-navy-700 px-2 py-0.5 text-[9px] font-medium text-surface/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <p className="text-[10px] font-semibold text-surface">Asking verified hosts…</p>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-900">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
          </div>
          <p className="text-[9px] text-surface/55">3 hosts reached · waiting for quotes</p>
        </div>
      </div>

      <div className="mt-3 rounded-full bg-orange-500 py-2.5 text-center text-[11px] font-extrabold text-navy-900 shadow-[0_8px_20px_var(--glow-orange)]">
        Send on WhatsApp
      </div>
    </>
  );
}

function QuotesScreen() {
  const offers = [
    { name: 'Oceanview Stay', price: '₦145,000', note: 'Sea view · Verified', best: false },
    { name: 'Palm Court', price: '₦132,000', note: 'Pool access', best: false },
    { name: 'Lagos Nest', price: '₦128,500', note: 'Best match', best: true },
  ];

  return (
    <>
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-700">Compare</p>
        <p className="text-sm font-extrabold text-navy-900">3 offers in</p>
        <p className="text-[10px] text-navy-700/70">Lagos · this weekend</p>
      </div>

      <div className="space-y-2">
        {offers.map((offer) => (
          <div
            key={offer.name}
            className={cn(
              'rounded-2xl border px-3 py-2.5',
              offer.best
                ? 'border-orange-500/50 bg-orange-500/10 shadow-sm'
                : 'border-border bg-surface-subtle',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-navy-900">{offer.name}</p>
                <p className="text-[9px] text-navy-700/70">{offer.note}</p>
              </div>
              <p className="text-[11px] font-extrabold text-navy-900">{offer.price}</p>
            </div>
            {offer.best ? (
              <span className="mt-2 inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold text-navy-900">
                Recommended
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-full border border-border py-2 text-center text-[10px] font-bold text-navy-900">
          Ask again
        </div>
        <div className="rounded-full bg-orange-500 py-2 text-center text-[10px] font-extrabold text-navy-900">
          Choose Nest
        </div>
      </div>
    </>
  );
}

function CheckoutScreen() {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-400">Checkout</p>
          <p className="text-sm font-extrabold text-surface">Confirm stay</p>
        </div>
        <span className="rounded-full bg-success/20 px-2 py-1 text-[9px] font-bold text-success">
          Staged payout
        </span>
      </div>

      <div className="rounded-2xl border border-surface/10 bg-navy-900 p-3">
        <p className="text-[11px] font-bold text-surface">Lagos Nest</p>
        <p className="mt-1 text-[10px] text-surface/65">Fri–Sun · 2 guests</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-[10px] text-surface/60">You pay</span>
          <span className="text-base font-extrabold text-surface">₦128,500</span>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-surface">Release after confirmation</span>
          <span className="font-extrabold text-orange-400">40%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-950">
          <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
        </div>
        <div className="mt-2 space-y-1 text-[9px] text-surface/70">
          <p>Vendor now · ₦66,888</p>
          <p>After confirmation · ₦44,592</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-navy-900/80 p-2.5 text-[9px] text-surface/65">
        Contact stays private until you book.
      </div>

      <div className="mt-3 rounded-full bg-orange-500 py-2.5 text-center text-[11px] font-extrabold text-navy-900 shadow-[0_8px_20px_var(--glow-orange)]">
        Pay safely
      </div>
    </>
  );
}

export function PhoneShowcase() {
  return (
    <Section
      eyebrow="Take a look"
      title="Built for your phone"
      description="Ask, compare, and confirm without leaving WhatsApp or your browser."
    >
      <div className="grid items-end gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <PhoneFrame title="Your request">
          <RequestScreen />
        </PhoneFrame>

        <PhoneFrame title="Quote comparison" className="lg:-translate-y-6" lightScreen>
          <QuotesScreen />
        </PhoneFrame>

        <PhoneFrame title="Checkout" className="sm:col-span-2 sm:mx-auto lg:col-span-1 lg:mx-0">
          <CheckoutScreen />
        </PhoneFrame>
      </div>
    </Section>
  );
}
