'use client';

import type { ReactNode } from 'react';
import { Container, cn } from '@askalert/ui';
import type { PublicPageHeader } from '@askalert/db';

type PublicPageHeroProps = {
  header: PublicPageHeader;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  metaLine?: string;
  children?: ReactNode;
};

export function PublicPageHero({
  header,
  eyebrow,
  title,
  description,
  metaLine,
  children,
}: PublicPageHeroProps) {
  const opacity = Math.min(100, Math.max(0, header.overlayOpacity)) / 100;

  return (
    <section
      className="relative isolate overflow-hidden bg-navy-950 text-surface"
      style={{ minHeight: header.minHeightPx }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${header.backgroundImageUrl})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-navy-950"
        style={{ opacity }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_20%,_var(--glow-orange-strong),_transparent_55%),linear-gradient(180deg,_transparent_40%,_color-mix(in_srgb,var(--navy-950)_88%,transparent)_100%)]"
        aria-hidden
      />

      <Container width="xl" className="relative flex flex-col justify-end py-14 sm:py-16 lg:py-20">
        <p className="public-hero-rise text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
          {header.brandLabel}
          <span className="mx-2 text-surface/35">·</span>
          {eyebrow}
        </p>
        <h1 className="public-hero-rise public-hero-rise-delay mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.15rem]">
          {title}
        </h1>
        {description ? (
          <p className="public-hero-rise public-hero-rise-delay-2 mt-4 max-w-2xl text-base leading-relaxed text-surface/75 sm:text-lg">
            {description}
          </p>
        ) : null}
        {metaLine ? (
          <p
            className={cn(
              'public-hero-rise public-hero-rise-delay-3 mt-5 text-sm font-medium text-surface/55',
            )}
          >
            {metaLine}
          </p>
        ) : null}
        {children ? (
          <div className="public-hero-rise public-hero-rise-delay-3 mt-8">{children}</div>
        ) : null}
      </Container>
    </section>
  );
}
