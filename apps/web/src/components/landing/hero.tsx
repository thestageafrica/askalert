import { Chip, Container } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';
import { HeroPhones } from './hero-phones';

const glanceItems = [
  { label: 'Free', rest: 'to ask' },
  { label: 'Live', rest: 'in Lagos' },
  { label: 'Verified', rest: 'vendors only' },
  { label: 'You choose', rest: 'how much to hold' },
  { label: 'Private', rest: 'until you book' },
] as const;

export function Hero() {
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I need help.');

  return (
    <section className="relative overflow-hidden bg-navy-950" aria-labelledby="hero-heading">
      <Container width="xl" className="relative py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <Chip
              statusDot
              className="mb-6 border-surface/15 bg-navy-900/60 text-surface"
            >
              Lagos · Verified vendors · Protected payments
            </Chip>

            <h1
              id="hero-heading"
              className="text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-surface sm:text-5xl lg:text-[3.5rem]"
            >
              <span className="block">Tell AskAlert what you need.</span>
              <span className="mt-2 block text-orange-400">It does the chasing.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-surface/78 sm:text-lg lg:mx-0">
              Shortlets, events, home care and more. AskAlert asks verified vendors, compares the
              offers and brings you the best ones. You choose, and you decide how much to protect.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-7 text-base font-bold text-navy-900 shadow-[0_10px_28px_var(--glow-orange)] sm:h-14 sm:w-auto sm:min-w-[220px]"
              >
                Ask on WhatsApp
              </a>
              <a
                href="/app"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-surface/45 bg-surface/5 px-7 text-base font-bold text-surface sm:h-14 sm:w-auto sm:min-w-[220px]"
              >
                Open in your browser
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-surface/65 lg:justify-start">
              <span className="rounded-full border border-dashed border-surface/25 px-3 py-1.5">
                Android app · Coming soon
              </span>
              <span className="rounded-full border border-dashed border-surface/25 px-3 py-1.5">
                iPhone · Add to Home Screen
              </span>
            </div>
          </div>

          <HeroPhones />
        </div>
      </Container>

      <div className="relative border-y border-surface/10" aria-label="At a glance">
        <Container width="xl">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 text-sm text-surface/70 sm:gap-x-10">
            {glanceItems.map((item) => (
              <li key={item.label}>
                <span className="font-bold text-surface">{item.label}</span> {item.rest}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
