import { Button, Chip, Container } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';

export function Hero() {
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I need help.');

  return (
    <section
      className="relative overflow-hidden bg-linear-to-b from-navy-950 via-navy-900 to-navy-700"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--glow-orange),_transparent_55%)] opacity-70"
        aria-hidden
      />
      <Container width="xl" className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Chip
            statusDot
            className="mb-6 border-surface/15 bg-navy-900/80 text-surface"
          >
            Lekki · Verified vendors · Protected payments
          </Chip>

          <h1 id="hero-heading" className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block text-surface">Tell AskAlert what you need.</span>
            <span className="mt-2 block bg-linear-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              It does the chasing.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-surface/80 sm:text-lg">
            Shortlets, events, home care and more. AskAlert asks verified vendors, compares the
            offers and brings you the best ones. You choose, and you decide how much to protect.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" size="lg">
              Ask on WhatsApp
            </Button>
            <Button
              href="/app"
              variant="secondary"
              size="lg"
              className="border-surface/35 bg-surface/10 text-surface hover:bg-surface/15"
            >
              Open in your browser
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-dashed border-surface/35 px-4 py-2 text-sm text-surface/75">
              Android app · Coming soon
            </span>
            <span className="rounded-full border border-dashed border-surface/35 px-4 py-2 text-sm text-surface/75">
              iPhone · Add to Home Screen
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
