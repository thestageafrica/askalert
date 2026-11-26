'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@askalert/ui';
import { DEFAULT_PUBLIC_PAGE_HEADER_IMAGE } from '@askalert/db';
import { TextAreaField } from '../../../components/public-pages/field';
import { useAdminStore } from '../../../lib/admin-store';
import { canEditPublicPages } from '../../../lib/roles';
import { useSitePagesAdmin } from '../../../lib/site-pages-admin-store';

export default function PublicPageHeaderEditorPage() {
  const { role } = useAdminStore();
  const locked = !canEditPublicPages(role);
  const { ready, header, setHeader, savePage, resetPage, uploadHeaderImage } = useSitePagesAdmin();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!ready) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading header editor"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            <Link href="/public-pages/" className="hover:underline">
              Public pages
            </Link>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Shared page header</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Used by Privacy, Terms, Contact, and future public pages. Fade the photo so titles stay
            readable.
          </p>
        </div>
        {!locked ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                resetPage('header');
                setNotice('Reset to seed header.');
              }}
            >
              Reset to seed
            </Button>
            <Button
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void savePage('header').then((result) => {
                  setBusy(false);
                  setNotice(result.ok ? 'Header saved.' : result.error);
                });
              }}
            >
              {busy ? 'Saving…' : 'Save to server'}
            </Button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{notice}</p>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
          <Input
            label="Brand label"
            value={header.brandLabel}
            disabled={locked}
            onChange={(event) => setHeader({ ...header, brandLabel: event.target.value })}
          />
          <TextAreaField
            label="Background image URL"
            value={header.backgroundImageUrl}
            disabled={locked}
            className="min-h-20"
            hint={`Seed default: ${DEFAULT_PUBLIC_PAGE_HEADER_IMAGE}`}
            onChange={(event) => setHeader({ ...header, backgroundImageUrl: event.target.value })}
          />
          <Input
            label="Overlay fade (0–100)"
            type="number"
            min={0}
            max={100}
            value={header.overlayOpacity}
            disabled={locked}
            onChange={(event) =>
              setHeader({
                ...header,
                overlayOpacity: Math.min(100, Math.max(0, Number(event.target.value) || 0)),
              })
            }
          />
          <Input
            label="Minimum height (px)"
            type="number"
            min={160}
            max={560}
            value={header.minHeightPx}
            disabled={locked}
            onChange={(event) =>
              setHeader({
                ...header,
                minHeightPx: Math.min(560, Math.max(160, Number(event.target.value) || 280)),
              })
            }
          />
          {!locked ? (
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  void uploadHeaderImage(file).then((result) => {
                    setBusy(false);
                    if (result.ok) {
                      setHeader({ ...header, backgroundImageUrl: result.url });
                      setNotice('Image uploaded. Click Save to server to publish.');
                    } else {
                      setNotice(result.error);
                    }
                    event.target.value = '';
                  });
                }}
              />
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                Upload new image
              </Button>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-border bg-navy-950 shadow-sm">
          <div
            className="relative min-h-56 bg-cover bg-center p-6 text-surface"
            style={{ backgroundImage: `url(${header.backgroundImageUrl})` }}
          >
            <div
              className="absolute inset-0 bg-navy-950"
              style={{ opacity: header.overlayOpacity / 100 }}
              aria-hidden
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                {header.brandLabel} · Preview
              </p>
              <p className="mt-3 text-2xl font-extrabold">Privacy Policy</p>
              <p className="mt-2 max-w-sm text-sm text-surface/70">
                Sample public page title on the shared faded header.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
