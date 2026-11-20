import Link from 'next/link';
import { Container, Logo } from '@askalert/ui';

const links = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/contact', label: 'Contact' },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy-950 text-surface">
      <Container width="xl" className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo variant="reversed" className="h-7" />
          <p className="mt-3 text-sm text-surface/70">Ask. Alert. Delivered.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-11 text-sm font-medium text-surface/80 hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
      <Container width="xl" className="border-t border-surface/10 py-4">
        <p className="text-sm text-surface/60">© 2026 AskAlert Technologies Limited</p>
      </Container>
    </footer>
  );
}
