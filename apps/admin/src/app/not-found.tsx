import { Button, Container } from '@askalert/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-navy-950 text-surface">
      <Container width="sm" className="py-16 text-center">
        <p className="text-sm font-semibold text-orange-400">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-3 text-surface/70">That admin route does not exist.</p>
        <div className="mt-8 flex justify-center">
          <Button href="/">Back to dashboard</Button>
        </div>
      </Container>
    </main>
  );
}
