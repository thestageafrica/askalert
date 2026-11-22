export function DraftBanner({ page }: { page: string }) {
  return (
    <div
      role="status"
      className="mb-8 rounded-2xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-extrabold tracking-wide text-orange-700 dark:text-orange-400">
        DRAFT — not legal advice
      </p>
      <p className="mt-1 text-muted-foreground">
        This {page} page is placeholder copy for AskAlert Phase 1. It will be replaced after legal
        review. Do not treat it as a final policy.
      </p>
    </div>
  );
}
