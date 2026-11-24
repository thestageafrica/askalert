'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Logo } from '@askalert/ui';
import { StorySlideshow } from './story-slideshow';

const INTRO_KEY = 'askalert.auth.intro.seen';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [showFullIntro, setShowFullIntro] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = window.sessionStorage.getItem(INTRO_KEY) === '1';
    const narrow = window.matchMedia('(max-width: 1023px)').matches;
    setShowFullIntro(narrow && !seen);
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-navy-950" />;
  }

  if (showFullIntro) {
    return (
      <div className="relative min-h-screen bg-navy-950">
        <StorySlideshow className="min-h-screen" />
        <div className="absolute inset-x-0 bottom-0 z-20 flex gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="min-h-12 flex-1 rounded-full border border-surface/25 bg-surface/10 px-5 text-sm font-bold text-surface backdrop-blur"
            onClick={() => {
              window.sessionStorage.setItem(INTRO_KEY, '1');
              setShowFullIntro(false);
            }}
          >
            Skip
          </button>
          <button
            type="button"
            className="min-h-12 flex-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 text-sm font-bold text-navy-900 shadow-[0_10px_28px_var(--glow-orange)]"
            onClick={() => {
              window.sessionStorage.setItem(INTRO_KEY, '1');
              setShowFullIntro(false);
            }}
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-950">
      {/* Desktop: full-bleed dark story backdrop */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <StorySlideshow ambient className="min-h-screen" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 hidden bg-navy-950/35 lg:block"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:items-center lg:justify-center lg:px-8 lg:py-12">
        {/* Mobile: story strip they already like */}
        <div className="lg:hidden">
          <StorySlideshow compact className="h-[40vh] min-h-[15.5rem] max-h-[22rem]" />
        </div>

        <div className="relative flex flex-1 flex-col px-4 pb-10 pt-0 sm:px-6 lg:flex-none lg:px-0 lg:pb-0">
          <div
            className={[
              '-mt-8 w-full max-w-md self-center rounded-[1.75rem] border border-surface/20 bg-surface p-6',
              'shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:-mt-10 sm:p-8 lg:mt-0 lg:border-transparent',
              'lg:shadow-[0_32px_90px_rgba(0,0,0,0.5)]',
              // Keep the form card light even when the site theme is dark.
              '[&_input]:bg-surface [&_input]:text-navy-900 [&_input]:placeholder:text-navy-900/40',
              'dark:[&_input]:bg-surface dark:[&_input]:text-navy-900 dark:[&_input]:placeholder:text-navy-900/40',
              '[&_select]:bg-surface [&_select]:text-navy-900 dark:[&_select]:bg-surface dark:[&_select]:text-navy-900',
              '[&_a]:text-orange-700 dark:[&_a]:text-orange-700',
            ].join(' ')}
          >
            <Link
              href="/"
              className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Logo className="h-9 w-auto" />
            </Link>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-navy-900/65">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 text-sm text-navy-900/60">{footer}</div> : null}
          </div>

          <p className="mt-6 hidden text-center text-xs text-surface/55 lg:block">
            Ask. Alert. Delivered. · Lekki, Lagos
          </p>
        </div>
      </div>
    </div>
  );
}
