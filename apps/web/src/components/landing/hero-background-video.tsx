'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Faded hero banner. Client-side so we can force muted autoplay
 * (desktop browsers sometimes skip the HTML autoplay attribute alone).
 */
export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = true;
    video.defaultMuted = true;
    const play = () => {
      void video.play().catch(() => {
        // Autoplay can still be blocked; poster remains visible.
      });
    };
    play();
    video.addEventListener('loadeddata', play);
    return () => video.removeEventListener('loadeddata', play);
  }, [reduceMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {reduceMotion ? (
        <div className="absolute inset-0 bg-[url('/brand/askalert-images-1.jpg')] bg-cover bg-center opacity-40 lg:opacity-50" />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-40 lg:opacity-[0.52]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/brand/askalert-images-1.jpg"
        >
          <source src="/brand/askalert-header-banner.mp4" type="video/mp4" />
        </video>
      )}
      {/* Lighter wash so desktop still reads the motion behind copy + phones */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--navy-950)_35%,transparent)_0%,color-mix(in_srgb,var(--navy-950)_48%,transparent)_40%,color-mix(in_srgb,var(--navy-950)_78%,transparent)_100%)] lg:bg-[linear-gradient(105deg,color-mix(in_srgb,var(--navy-950)_42%,transparent)_0%,color-mix(in_srgb,var(--navy-950)_28%,transparent)_48%,color-mix(in_srgb,var(--navy-950)_55%,transparent)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_20%,color-mix(in_srgb,var(--orange-500)_18%,transparent),transparent_60%)]" />
    </div>
  );
}
