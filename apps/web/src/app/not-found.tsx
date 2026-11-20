import { Button, Container } from '@askalert/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-[radial-gradient(90%_60%_at_50%_0%,_color-mix(in_srgb,var(--orange-500)_12%,transparent),_transparent_55%),var(--background)]">
      <Container width="sm" className="py-16 text-center">
        <p className="text-sm font-semibold text-orange-600">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          That link does not exist. Head home or open the browser app.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button href="/">Back home</Button>
          <Button href="/app" variant="secondary">
            Open app
          </Button>
        </div>
      </Container>
    </main>
  );
}
