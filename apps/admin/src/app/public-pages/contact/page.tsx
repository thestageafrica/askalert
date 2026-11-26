'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, useToast } from '@askalert/ui';
import { TextAreaField } from '../../../components/public-pages/field';
import { useAdminStore } from '../../../lib/admin-store';
import { confirmReseed } from '../../../lib/confirm-reseed';
import { canEditPublicPages } from '../../../lib/roles';
import { useSitePagesAdmin } from '../../../lib/site-pages-admin-store';

export default function ContactAdminPage() {
  const { role } = useAdminStore();
  const locked = !canEditPublicPages(role);
  const { toast } = useToast();
  const { ready, contact, setContact, savePage, resetAndSavePage } = useSitePagesAdmin();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!ready) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading contact editor"
      />
    );
  }

  const updateParagraph = (index: number, value: string) => {
    const paragraphs = contact.paragraphs.map((item, itemIndex) =>
      itemIndex === index ? value : item,
    );
    setContact({ ...contact, paragraphs });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            <Link href="/public-pages/" className="hover:underline">
              Public pages
            </Link>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Contact page</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Edit every line on /contact, including WhatsApp CTA copy.
          </p>
        </div>
        {!locked ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                if (!confirmReseed('the Contact page')) {
                  toast({
                    title: 'Reset cancelled',
                    description: 'Contact page was left unchanged.',
                  });
                  return;
                }
                setBusy(true);
                void resetAndSavePage('contact').then((result) => {
                  setBusy(false);
                  if (result.ok) {
                    setNotice('Contact page reset to seed and saved to the server.');
                    toast({
                      title: 'Reset and saved',
                      description: 'Contact page seed is now on the server.',
                      tone: 'success',
                    });
                    return;
                  }
                  setNotice(`Reset failed to save: ${result.error}`);
                  toast({ title: 'Reset save failed', description: result.error, tone: 'danger' });
                });
              }}
            >
              Reset to seed
            </Button>
            <Button
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void savePage('contact').then((result) => {
                  setBusy(false);
                  if (result.ok) {
                    setNotice('Contact page saved to the server.');
                    toast({
                      title: 'Saved to server',
                      description: 'Contact page is live.',
                      tone: 'success',
                    });
                    return;
                  }
                  setNotice(result.error);
                  toast({ title: 'Save failed', description: result.error, tone: 'danger' });
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

      <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Meta title"
            value={contact.metaTitle}
            disabled={locked}
            onChange={(event) => setContact({ ...contact, metaTitle: event.target.value })}
          />
          <Input
            label="Eyebrow"
            value={contact.eyebrow}
            disabled={locked}
            onChange={(event) => setContact({ ...contact, eyebrow: event.target.value })}
          />
          <Input
            label="Page title"
            value={contact.title}
            disabled={locked}
            onChange={(event) => setContact({ ...contact, title: event.target.value })}
          />
          <Input
            label="CTA label"
            value={contact.ctaLabel}
            disabled={locked}
            onChange={(event) => setContact({ ...contact, ctaLabel: event.target.value })}
          />
        </div>
        <TextAreaField
          label="Meta description"
          value={contact.metaDescription}
          disabled={locked}
          className="min-h-20"
          onChange={(event) => setContact({ ...contact, metaDescription: event.target.value })}
        />
        <TextAreaField
          label="Hero description"
          value={contact.description}
          disabled={locked}
          className="min-h-20"
          onChange={(event) => setContact({ ...contact, description: event.target.value })}
        />
        <Input
          label="WhatsApp prefill message"
          value={contact.whatsappPrefill}
          disabled={locked}
          onChange={(event) => setContact({ ...contact, whatsappPrefill: event.target.value })}
        />
        <Input
          label="Company line"
          value={contact.companyLine}
          disabled={locked}
          onChange={(event) => setContact({ ...contact, companyLine: event.target.value })}
        />
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold">Body paragraphs</h2>
          {!locked ? (
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() =>
                setContact({
                  ...contact,
                  paragraphs: [...contact.paragraphs, 'New paragraph'],
                })
              }
            >
              Add paragraph
            </Button>
          ) : null}
        </div>
        {contact.paragraphs.map((paragraph, index) => (
          <div key={`p-${index}`} className="space-y-2">
            <TextAreaField
              label={`Paragraph ${index + 1}`}
              value={paragraph}
              disabled={locked}
              className="min-h-24"
              onChange={(event) => updateParagraph(index, event.target.value)}
            />
            {!locked && contact.paragraphs.length > 1 ? (
              <Button
                variant="ghost"
                className="min-h-11 text-danger"
                onClick={() =>
                  setContact({
                    ...contact,
                    paragraphs: contact.paragraphs.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
              >
                Remove paragraph
              </Button>
            ) : null}
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Draft banner</h2>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={contact.draftBanner.enabled}
            disabled={locked}
            onChange={(event) =>
              setContact({
                ...contact,
                draftBanner: { ...contact.draftBanner, enabled: event.target.checked },
              })
            }
          />
          Show draft banner
        </label>
        <Input
          label="Banner title"
          value={contact.draftBanner.title}
          disabled={locked}
          onChange={(event) =>
            setContact({
              ...contact,
              draftBanner: { ...contact.draftBanner, title: event.target.value },
            })
          }
        />
        <TextAreaField
          label="Banner body"
          value={contact.draftBanner.body}
          disabled={locked}
          onChange={(event) =>
            setContact({
              ...contact,
              draftBanner: { ...contact.draftBanner, body: event.target.value },
            })
          }
        />
      </section>
    </div>
  );
}
