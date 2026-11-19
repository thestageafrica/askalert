import type { Metadata } from 'next';
import { Button, Container, Logo } from '@askalert/ui';

export const metadata: Metadata = {
  title: 'You are offline',
  description: 'AskAlert is waiting for a connection. You can still open the app shell.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center bg-navy-950 text-surface">
      <Container width="sm" className="py-16 text-center">
        <Logo variant="reversed" className="mx-auto h-10 w-auto" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">You are offline</h1>
        <p className="mt-3 text-base leading-relaxed text-surface/75">
          AskAlert needs a connection to chase vendors. Check your network, then try again. The app
          shell stays ready so you can jump back in quickly.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button href="/app">Open app</Button>
          <Button href="/" variant="secondary">
            Back home
          </Button>
        </div>
      </Container>
    </main>
  );
}
