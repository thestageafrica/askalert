import { Button, Chip, Container } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';

export function Hero() {
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I need help.');

  return (
    <section
      className="relative overflow-hidden bg-navy-950"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_var(--glow-orange-strong),_transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-900/80 to-transparent"
        aria-hidden
      />

      <Container width="xl" className="relative py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Chip
            statusDot
            className="mb-8 border-surface/15 bg-navy-900/60 text-surface shadow-lg shadow-navy-950/30"
          >
            Lekki · Verified vendors · Protected payments
          </Chip>

          <h1
            id="hero-heading"
            className="text-[2.4rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span className="block text-surface">Tell AskAlert what you need.</span>
            <span className="mt-2 block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              It does the chasing.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-surface/80 sm:text-lg">
            Shortlets, events, home care and more. AskAlert asks verified vendors, compares the
            offers and brings you the best ones. You choose, and you decide how much to protect.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="w-full sm:w-auto sm:min-w-[220px]"
            >
              Ask on WhatsApp
            </Button>
            <Button
              href="/app"
              variant="secondary"
              size="lg"
              className="w-full border-2 border-surface/45 bg-surface/5 text-surface hover:border-surface/80 hover:bg-surface/12 sm:w-auto sm:min-w-[220px]"
            >
              Open in your browser
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[
              'Free to ask',
              'Android app · Coming soon',
              'iPhone · Add to Home Screen',
              'You choose the hold %',
            ].map((item) => (
              <li
                key={item}
                className="rounded-full border border-dashed border-surface/25 bg-navy-900/40 px-3.5 py-2 text-xs font-medium text-surface/75 sm:text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
