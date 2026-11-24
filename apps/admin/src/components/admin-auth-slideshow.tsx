'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@askalert/ui';
import { ADMIN_AUTH_SLIDES, type AdminAuthSlide } from '../lib/admin-auth-slides';

export function AdminAuthSlideshow({
  compact = false,
  contentAlign = 'bottom',
  className,
}: {
  compact?: boolean;
  contentAlign?: 'bottom' | 'middle';
  className?: string;
}) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slide = ADMIN_AUTH_SLIDES[index] ?? ADMIN_AUTH_SLIDES[0]!;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ADMIN_AUTH_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      className={cn(
        'relative overflow-hidden bg-navy-950 text-surface',
        compact ? 'min-h-[14rem]' : 'min-h-full',
        className,
      )}
      onMouseEnter={() => {
        if (!compact) setPaused(true);
      }}
      onMouseLeave={() => {
        if (!compact) setPaused(false);
      }}
      onFocusCapture={() => {
        if (!compact) setPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!compact && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <h2 id={labelId} className="sr-only">
        AskAlert admin story
      </h2>

      {ADMIN_AUTH_SLIDES.map((item, slideIndex) => (
        <SlidePanel
          key={item.id}
          slide={item}
          active={slideIndex === index}
          reduceMotion={reduceMotion}
          compact={compact}
          contentAlign={contentAlign}
        />
      ))}

      <div
        className={cn(
          'absolute inset-x-0 z-10 flex items-center gap-3',
          compact ? 'bottom-12 justify-center px-5' : 'bottom-0 justify-between p-5 sm:p-8',
        )}
      >
        <div className="flex gap-2" role="tablist" aria-label="Admin story slides">
          {ADMIN_AUTH_SLIDES.map((item, slideIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Show slide ${slideIndex + 1}: ${item.kicker}`}
              className={cn(
                'h-2.5 min-w-2.5 rounded-full transition',
                slideIndex === index ? 'w-8 bg-orange-400' : 'w-2.5 bg-surface/35 hover:bg-surface/55',
              )}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
        {!compact ? (
          <div className="flex gap-2">
            <ChromeButton
              label="Previous slide"
              onClick={() =>
                setIndex(
                  (current) => (current - 1 + ADMIN_AUTH_SLIDES.length) % ADMIN_AUTH_SLIDES.length,
                )
              }
            >
              ‹
            </ChromeButton>
            <ChromeButton
              label="Next slide"
              onClick={() => setIndex((current) => (current + 1) % ADMIN_AUTH_SLIDES.length)}
            >
              ›
            </ChromeButton>
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {slide.kicker}. {slide.headline}
      </p>
    </section>
  );
}

function SlidePanel({
  slide,
  active,
  reduceMotion,
  compact,
  contentAlign,
}: {
  slide: AdminAuthSlide;
  active: boolean;
  reduceMotion: boolean;
  compact: boolean;
  contentAlign: 'bottom' | 'middle';
}) {
  const middle = contentAlign === 'middle' && !compact;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-hidden={!active}
      className={cn(
        'absolute inset-0 transition-opacity duration-700',
        active ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,_color-mix(in_srgb,var(--orange-500)_35%,transparent),_transparent_55%),linear-gradient(160deg,_var(--navy-950),_#151b52_45%,_var(--navy-900))]',
          !reduceMotion && active ? 'animate-[plans-rise_8s_ease-out]' : null,
        )}
        aria-hidden
      />
      <picture>
        {slide.imageWebpSrc ? <source srcSet={slide.imageWebpSrc} type="image/webp" /> : null}
        <img
          src={slide.imageSrc}
          alt={slide.imageAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          loading={active ? 'eager' : 'lazy'}
          decoding="async"
        />
      </picture>
      <div
        className={cn(
          'absolute inset-0',
          middle
            ? 'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--navy-950)_40%,transparent)_0%,color-mix(in_srgb,var(--navy-950)_72%,transparent)_42%,color-mix(in_srgb,var(--navy-950)_72%,transparent)_62%,color-mix(in_srgb,var(--navy-950)_55%,transparent)_100%)]'
            : 'bg-[linear-gradient(180deg,transparent_15%,color-mix(in_srgb,var(--navy-950)_82%,transparent)_72%)]',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'relative z-[1] flex h-full flex-col px-6 pt-10 sm:px-10',
          middle ? 'justify-center pb-24' : cn('justify-end', compact ? 'pb-20' : 'pb-20 sm:pb-24'),
        )}
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">{slide.kicker}</p>
        <h3
          className={cn(
            'mt-3 max-w-xl font-extrabold tracking-tight text-balance drop-shadow-sm',
            compact ? 'text-2xl' : 'text-3xl sm:text-4xl xl:text-5xl',
          )}
        >
          {slide.headline}
        </h3>
        <p className={cn('mt-3 max-w-md text-surface/80', compact ? 'text-sm' : 'text-base sm:text-lg')}>
          {slide.body}
        </p>
      </div>
    </div>
  );
}

function ChromeButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-full border border-surface/20 bg-surface/10 text-xl text-surface backdrop-blur hover:bg-surface/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      {children}
    </button>
  );
}
