import { cn } from '@askalert/ui';

const accents: Record<string, string> = {
  shortlets: 'from-orange-400/25 to-orange-500/5 text-orange-700',
  events: 'from-navy-700/20 to-navy-950/5 text-navy-900',
  'home-care': 'from-success/25 to-success/5 text-navy-900',
  default: 'from-orange-500/15 to-card-muted text-orange-700',
};

export function CategoryGlyph({
  slug,
  live,
  className,
}: {
  slug: string;
  live?: boolean;
  className?: string;
}) {
  const accent = accents[slug] ?? accents.default;

  return (
    <div
      className={cn(
        'flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br',
        accent,
        !live && 'opacity-70 grayscale-[0.35]',
        className,
      )}
      aria-hidden
    >
      {slug === 'shortlets' ? (
        <HomeGlyph />
      ) : slug === 'events' ? (
        <SparkGlyph />
      ) : slug === 'home-care' ? (
        <CareGlyph />
      ) : (
        <AskGlyph />
      )}
    </div>
  );
}

function HomeGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6.2 6.2l2.8 2.8M15 15l2.8 2.8M17.8 6.2 15 9M9 15l-2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CareGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AskGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 17 17 7M10 7h7v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
