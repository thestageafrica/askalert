'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@askalert/ui';
import { AUTH_STORY_SLIDES, type StorySlide } from '../../lib/auth/story-slides';

export function StorySlideshow({
  compact = false,
  ambient = false,
  className,
}: {
  compact?: boolean;
  /** Full-bleed decorative mode: images only, no chrome. */
  ambient?: boolean;
  className?: string;
}) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slide = AUTH_STORY_SLIDES[index] ?? AUTH_STORY_SLIDES[0]!;

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
      setIndex((current) => (current + 1) % AUTH_STORY_SLIDES.length);
    }, ambient ? 7500 : 6000);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, ambient]);

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
        if (!ambient) setPaused(true);
      }}
      onMouseLeave={() => {
        if (!ambient) setPaused(false);
      }}
      onFocusCapture={() => {
        if (!ambient) setPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!ambient && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={() => {
        if (!ambient) setPaused(true);
      }}
    >
      <h2 id={labelId} className="sr-only">
        AskAlert story
      </h2>

      {AUTH_STORY_SLIDES.map((item, slideIndex) => (
        <SlidePanel
          key={item.id}
          slide={item}
          active={slideIndex === index}
          reduceMotion={reduceMotion}
          compact={compact}
          ambient={ambient}
        />
      ))}

      {!ambient ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 p-5 sm:p-8">
          <div className="flex gap-2" role="tablist" aria-label="Story slides">
            {AUTH_STORY_SLIDES.map((item, slideIndex) => (
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
          <div className="flex gap-2">
            <CarouselButton
              label="Previous slide"
              onClick={() =>
                setIndex(
                  (current) => (current - 1 + AUTH_STORY_SLIDES.length) % AUTH_STORY_SLIDES.length,
                )
              }
            >
              ‹
            </CarouselButton>
            <CarouselButton
              label="Next slide"
              onClick={() => setIndex((current) => (current + 1) % AUTH_STORY_SLIDES.length)}
            >
              ›
            </CarouselButton>
          </div>
        </div>
      ) : null}

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
  ambient,
}: {
  slide: StorySlide;
  active: boolean;
  reduceMotion: boolean;
  compact: boolean;
  ambient: boolean;
}) {
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
          'absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,_color-mix(in_srgb,var(--orange-500)_35%,transparent),_transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_80%,_color-mix(in_srgb,var(--navy-700)_80%,transparent),_transparent_50%),linear-gradient(160deg,_var(--navy-950),_#151b52_45%,_var(--navy-900))]',
          !reduceMotion && active ? 'animate-[plans-rise_8s_ease-out]' : null,
        )}
        aria-hidden
      />
      {slide.imageSrc ? (
        <picture>
          {slide.imageWebpSrc ? (
            <source srcSet={slide.imageWebpSrc} type="image/webp" />
          ) : null}
          <img
            src={slide.imageSrc}
            alt={slide.imageAlt}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              ambient ? 'opacity-45' : 'opacity-50',
            )}
            loading={active ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>
      ) : null}
      <div
        className={cn(
          'absolute inset-0',
          ambient
            ? 'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--navy-950)_45%,transparent),color-mix(in_srgb,var(--navy-950)_78%,transparent)_55%,var(--navy-950))]'
            : 'bg-[linear-gradient(180deg,transparent_15%,color-mix(in_srgb,var(--navy-950)_82%,transparent)_72%)]',
        )}
        aria-hidden
      />
      {!ambient ? (
        <div
          className={cn(
            'relative z-[1] flex h-full flex-col justify-end px-6 pb-20 pt-10 sm:px-10',
            compact ? 'pb-16' : 'sm:pb-24',
          )}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">
            {slide.kicker}
          </p>
          <h3
            className={cn(
              'mt-3 max-w-xl font-extrabold tracking-tight text-balance drop-shadow-sm',
              compact ? 'text-2xl' : 'text-3xl sm:text-5xl',
            )}
          >
            {slide.headline}
          </h3>
          <p
            className={cn(
              'mt-3 max-w-md text-surface/80',
              compact ? 'text-sm' : 'text-base sm:text-lg',
            )}
          >
            {slide.body}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CarouselButton({
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
