import Link from 'next/link';
import { Container, Logo } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';
import { MobileNav } from './mobile-nav';

const navLinks = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#categories', label: 'Categories' },
  { href: '/plans', label: 'Plans' },
  { href: '/#vendors', label: 'For vendors' },
  { href: '/#faq', label: 'FAQ' },
] as const;

export function SiteHeader() {
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I need help.');

  return (
    <header className="relative sticky top-0 z-40 border-b border-surface/10 bg-navy-950">
      <Container width="xl" className="flex min-h-[4.25rem] items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Logo variant="reversed" className="h-8" fetchPriority="high" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-surface/75 transition hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 text-sm font-bold text-navy-900 shadow-[0_10px_28px_var(--glow-orange)] sm:inline-flex"
          >
            Ask on WhatsApp
          </a>
          <MobileNav whatsappUrl={whatsappUrl} />
        </div>
      </Container>
    </header>
  );
}
