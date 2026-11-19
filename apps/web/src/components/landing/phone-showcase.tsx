import { Section, cn } from '@askalert/ui';
import type { ReactNode } from 'react';

function PhoneFrame({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn('mx-auto w-full max-w-[220px]', className)}>
      <div className="rounded-[2rem] border border-border bg-navy-950 p-3 shadow-xl">
        <div className="mb-3 flex justify-center">
          <span className="h-1.5 w-16 rounded-full bg-navy-700" aria-hidden />
        </div>
        <div className="min-h-[360px] rounded-[1.25rem] bg-surface p-3 text-navy-900 dark:bg-navy-900 dark:text-surface">
          {children}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm font-medium text-muted-foreground">
        {title}
      </figcaption>
    </figure>
  );
}

export function PhoneShowcase() {
  return (
    <Section
      eyebrow="Take a look"
      title="Built for your phone"
      description="Ask, compare, and confirm without leaving WhatsApp or your browser."
    >
      <div className="grid gap-8 md:grid-cols-3">
        <PhoneFrame title="Your request">
          <p className="text-xs font-semibold text-orange-700">New ask</p>
          <p className="mt-3 text-sm font-bold">2-bedroom shortlet in Lekki Phase 1</p>
          <p className="mt-2 text-xs text-navy-700/70 dark:text-surface/60">
            Fri–Sun · Budget around ₦150,000
          </p>
          <div className="mt-6 rounded-xl bg-surface-subtle p-3 text-xs dark:bg-navy-700">
            AskAlert is messaging verified hosts…
          </div>
        </PhoneFrame>

        <PhoneFrame title="Quote comparison" className="md:translate-y-4">
          <p className="text-xs font-semibold text-orange-700">3 offers</p>
          <div className="mt-3 space-y-2">
            {[
              { name: 'Oceanview Stay', price: '₦145,000' },
              { name: 'Palm Court', price: '₦132,000' },
              { name: 'Lekki Nest', price: '₦128,500' },
            ].map((offer) => (
              <div
                key={offer.name}
                className="rounded-xl border border-border px-3 py-2 text-xs dark:border-navy-700"
              >
                <p className="font-semibold">{offer.name}</p>
                <p className="text-navy-700 dark:text-orange-400">{offer.price}</p>
              </div>
            ))}
          </div>
        </PhoneFrame>

        <PhoneFrame title="Checkout">
          <p className="text-xs font-semibold text-orange-700">Confirm</p>
          <p className="mt-3 text-sm font-bold">Lekki Nest</p>
          <p className="mt-1 text-xs">You pay ₦128,500</p>
          <div className="mt-4 rounded-xl bg-orange-500/15 p-3 text-xs text-navy-900 dark:text-surface">
            Hold 40% until you confirm the stay.
          </div>
          <div className="mt-6 rounded-full bg-orange-500 px-3 py-2 text-center text-xs font-bold text-navy-900">
            Pay safely
          </div>
        </PhoneFrame>
      </div>
    </Section>
  );
}
