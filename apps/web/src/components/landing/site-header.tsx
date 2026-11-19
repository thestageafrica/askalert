'use client';

import { useState } from 'react';
import { Button, Container, Logo, cn } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#categories', label: 'Categories' },
  { href: '#vendors', label: 'For vendors' },
  { href: '#faq', label: 'FAQ' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I need help.');

  return (
    <header className="sticky top-0 z-40 border-b border-surface/10 bg-navy-950/85 backdrop-blur-xl">
      <Container width="xl" className="flex min-h-[4.25rem] items-center justify-between gap-4 py-3">
        <a
          href="#top"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Logo variant="reversed" className="h-8" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-surface/75 transition hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="md"
            className="hidden px-5 sm:inline-flex"
          >
            Ask on WhatsApp
          </Button>
          <button
            type="button"
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-surface/20 bg-surface/5 text-surface lg:hidden',
              'hover:bg-surface/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className={cn('block h-0.5 w-4 rounded-full bg-surface transition', open && 'translate-y-2 rotate-45')} />
              <span className={cn('block h-0.5 w-4 rounded-full bg-surface transition', open && 'opacity-0')} />
              <span className={cn('block h-0.5 w-4 rounded-full bg-surface transition', open && '-translate-y-2 -rotate-45')} />
            </span>
          </button>
        </div>
      </Container>

      {open ? (
        <div id="mobile-nav" className="border-t border-surface/10 bg-navy-950/95 lg:hidden">
          <Container width="xl" className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-11 rounded-xl px-3 py-3 text-base font-semibold text-surface hover:bg-navy-900"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-3 w-full">
              Ask on WhatsApp
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
