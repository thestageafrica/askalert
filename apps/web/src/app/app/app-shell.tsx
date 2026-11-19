'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Skeleton } from '@askalert/ui';
import { getWhatsAppUrl } from '../../lib/site';
import { showInstallPromptAfterBooking } from '../../components/pwa/install-prompt';

/**
 * Lightweight client shell: no blocking network on mount.
 * Uses a short deferred paint so skeleton loaders show on slow devices.
 */
export function AppShell() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading AskAlert">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-44 rounded-full" />
      </div>
    );
  }

  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I need help.');

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-orange-600">Lagos · live</p>
        <p className="mt-1 text-base text-muted-foreground">
          Ask on WhatsApp for now. After you book, we will offer to install AskAlert on your phone.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href={whatsappUrl}>Continue on WhatsApp</Button>
        {/* Demo hook until booking exists — same API booking will call */}
        <Button variant="secondary" onClick={() => showInstallPromptAfterBooking()}>
          Preview install prompt
        </Button>
      </div>
    </Card>
  );
}
