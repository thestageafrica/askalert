'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@askalert/ui';
import { AUTH_STORY_SLIDES, type StorySlide } from '../../lib/auth/story-slides';

export function StorySlideshow({
  compact = false,
  className,
}: {
  compact?: boolean;
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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={() => setPaused(true)}
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
        />
      ))}

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
              setIndex((current) => (current - 1 + AUTH_STORY_SLIDES.length) % AUTH_STORY_SLIDES.length)
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
}: {
  slide: StorySlide;
  active: boolean;
  reduceMotion: boolean;
  compact: boolean;
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
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,color-mix(in_srgb,var(--navy-950)_88%,transparent)_78%)]"
        aria-hidden
      />
      {slide.imageSrc ? (
        <picture>
          <img
            src={slide.imageSrc}
            alt={slide.imageAlt}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading={active ? 'eager' : 'lazy'}
          />
        </picture>
      ) : (
        <div className="absolute inset-0 opacity-[0.14]" aria-hidden>
          <div className="h-full w-full bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cg fill=%22%23F18A00%22 fill-opacity=%220.35%22%3E%3Cpath d=%22M0 38h40v2H0zM0 0h2v40H0z%22/%3E%3C/g%3E%3C/svg%3E')]" />
        </div>
      )}
      <div
        className={cn(
          'relative z-[1] flex h-full flex-col justify-end px-6 pb-20 pt-10 sm:px-10',
          compact ? 'pb-16' : 'sm:pb-24',
        )}
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">{slide.kicker}</p>
        <h3
          className={cn(
            'mt-3 max-w-xl font-extrabold tracking-tight text-balance',
            compact ? 'text-2xl' : 'text-3xl sm:text-5xl',
          )}
        >
          {slide.headline}
        </h3>
        <p className={cn('mt-3 max-w-md text-surface/75', compact ? 'text-sm' : 'text-base sm:text-lg')}>
          {slide.body}
        </p>
      </div>
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
