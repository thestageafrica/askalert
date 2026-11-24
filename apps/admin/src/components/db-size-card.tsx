'use client';

import { useEffect, useState } from 'react';
import { Card, cn } from '@askalert/ui';
import { getLatestDbSizeSnapshot, type DbSizeSnapshot } from '@askalert/db';
import { adminBrowserClient, adminSupabaseEnabled } from '../lib/supabase-browser';

function formatMb(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

export function DbSizeCard() {
  const [snapshot, setSnapshot] = useState<DbSizeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enabled = adminSupabaseEnabled();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const client = adminBrowserClient();
        if (!client) {
          if (!cancelled) {
            setError('Supabase env incomplete in this build');
          }
          return;
        }
        const latest = await getLatestDbSizeSnapshot(client);
        if (!cancelled) {
          setSnapshot(latest);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load size');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const sizeLabel = snapshot ? `${formatMb(snapshot.sizeMb)} MB` : enabled ? '…' : '—';
  const warning = snapshot?.warning === true;
  const hint = !enabled
    ? 'Supabase off · mock local'
    : error
      ? 'Could not load snapshot'
      : snapshot
        ? warning
          ? 'Above 350 MB free-plan warning'
          : 'Free-plan database size'
        : 'No snapshot yet';

  return (
    <Card className="overflow-hidden border border-border/70 p-0 shadow-[0_12px_28px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
      <div className={cn('h-1.5 w-full', warning ? 'bg-warning' : 'bg-navy-950')} />
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
          Database size
        </p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight">{sizeLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
    </Card>
  );
}
