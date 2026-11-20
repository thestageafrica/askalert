import { Button } from '@askalert/ui';

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
          Coming later
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-border bg-card px-6 py-10 text-center shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--glow-orange),_transparent_65%)]"
          aria-hidden
        />
        <div className="relative mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-navy-950 text-orange-400 shadow-lg shadow-navy-950/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path d="M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <p className="relative text-base font-extrabold text-foreground">Mock shell only</p>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Phase 1 keeps this screen as a placeholder. Real {title.toLowerCase()} data arrives with
          Supabase later.
        </p>
        <div className="relative mt-6 flex justify-center">
          <Button href="/" variant="secondary">
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
