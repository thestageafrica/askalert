export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Mock shell only for Phase 1. Real data comes with Supabase later.
      </div>
    </div>
  );
}
