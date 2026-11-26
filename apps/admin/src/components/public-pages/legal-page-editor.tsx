'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, cn, useToast } from '@askalert/ui';
import type { LegalPageContent, LegalSection } from '@askalert/db';
import { confirmReseed } from '../../lib/confirm-reseed';
import { TextAreaField } from './field';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || `section-${Date.now()}`;
}

type LegalPageEditorProps = {
  title: string;
  subtitle: string;
  value: LegalPageContent;
  locked: boolean;
  notice: string | null;
  busy: boolean;
  onChange: (next: LegalPageContent) => void;
  onSave: () => void;
  onReset: () => void;
};

export function LegalPageEditor({
  title,
  subtitle,
  value,
  locked,
  notice,
  busy,
  onChange,
  onSave,
  onReset,
}: LegalPageEditorProps) {
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(value.sections[0]?.id ?? null);

  const update = (patch: Partial<LegalPageContent>) => {
    onChange({ ...value, ...patch });
  };

  const updateSection = (id: string, patch: Partial<LegalSection>) => {
    onChange({
      ...value,
      sections: value.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    });
  };

  const addSection = () => {
    const heading = `New section ${value.sections.length + 1}`;
    const id = slugify(heading);
    const next: LegalSection = { id, heading, body: '' };
    onChange({ ...value, sections: [...value.sections, next] });
    setOpenId(id);
  };

  const removeSection = (id: string) => {
    const sections = value.sections.filter((section) => section.id !== id);
    onChange({ ...value, sections });
    if (openId === id) {
      setOpenId(sections[0]?.id ?? null);
    }
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    const index = value.sections.findIndex((section) => section.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= value.sections.length) {
      return;
    }
    const sections = [...value.sections];
    const [item] = sections.splice(index, 1);
    if (!item) return;
    sections.splice(target, 0, item);
    onChange({ ...value, sections });
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
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {!locked ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                if (!confirmReseed(title)) {
                  toast({
                    title: 'Reset cancelled',
                    description: `${title} was left unchanged.`,
                    tone: 'default',
                  });
                  return;
                }
                onReset();
              }}
            >
              Reset to seed
            </Button>
            <Button className="min-h-11" disabled={busy} onClick={onSave}>
              {busy ? 'Saving…' : 'Save to server'}
            </Button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{notice}</p>
      ) : null}
      {locked ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Read-only for your role. Ask a super admin or operations admin to edit.
        </p>
      ) : null}

      <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Page header & SEO</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Meta title"
            value={value.metaTitle}
            disabled={locked}
            onChange={(event) => update({ metaTitle: event.target.value })}
          />
          <Input
            label="Eyebrow"
            value={value.eyebrow}
            disabled={locked}
            onChange={(event) => update({ eyebrow: event.target.value })}
          />
          <Input
            label="Page title"
            value={value.title}
            disabled={locked}
            onChange={(event) => update({ title: event.target.value })}
          />
          <Input
            label="Version label"
            value={value.versionLabel}
            disabled={locked}
            onChange={(event) => update({ versionLabel: event.target.value })}
          />
          <Input
            label="Effective date"
            value={value.effectiveDate}
            disabled={locked}
            onChange={(event) => update({ effectiveDate: event.target.value })}
          />
          <Input
            label="Last updated"
            value={value.lastUpdated}
            disabled={locked}
            onChange={(event) => update({ lastUpdated: event.target.value })}
          />
        </div>
        <TextAreaField
          label="Meta description"
          value={value.metaDescription}
          disabled={locked}
          className="min-h-20"
          onChange={(event) => update({ metaDescription: event.target.value })}
        />
        <TextAreaField
          label="Hero description"
          value={value.description}
          disabled={locked}
          className="min-h-20"
          onChange={(event) => update({ description: event.target.value })}
        />
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Draft banner</h2>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.draftBanner.enabled}
            disabled={locked}
            onChange={(event) =>
              update({
                draftBanner: { ...value.draftBanner, enabled: event.target.checked },
              })
            }
          />
          Show draft banner on the public page
        </label>
        <Input
          label="Banner title"
          value={value.draftBanner.title}
          disabled={locked}
          onChange={(event) =>
            update({ draftBanner: { ...value.draftBanner, title: event.target.value } })
          }
        />
        <TextAreaField
          label="Banner body"
          value={value.draftBanner.body}
          disabled={locked}
          onChange={(event) =>
            update({ draftBanner: { ...value.draftBanner, body: event.target.value } })
          }
        />
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold">Sections</h2>
          {!locked ? (
            <Button variant="secondary" className="min-h-11" onClick={addSection}>
              Add section
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Body supports plain paragraphs, **bold**, lists, tables (| cells |), and quotes (&gt;).
        </p>
        <div className="space-y-2">
          {value.sections.map((section, index) => {
            const open = openId === section.id;
            return (
              <div key={section.id} className="overflow-hidden rounded-2xl border border-border">
                <button
                  type="button"
                  className={cn(
                    'flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold',
                    open ? 'bg-orange-500/10' : 'bg-surface-subtle/50 hover:bg-surface-subtle',
                  )}
                  onClick={() => setOpenId(open ? null : section.id)}
                >
                  <span>
                    {index + 1}. {section.heading}
                  </span>
                  <span className="text-xs text-muted-foreground">{open ? 'Hide' : 'Edit'}</span>
                </button>
                {open ? (
                  <div className="space-y-3 border-t border-border p-4">
                    <Input
                      label="Section id"
                      value={section.id}
                      disabled={locked}
                      hint="Used for in-page anchors."
                      onChange={(event) => updateSection(section.id, { id: slugify(event.target.value) || section.id })}
                    />
                    <Input
                      label="Heading"
                      value={section.heading}
                      disabled={locked}
                      onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                    />
                    <TextAreaField
                      label="Body"
                      value={section.body}
                      disabled={locked}
                      className="min-h-48 font-mono text-sm"
                      onChange={(event) => updateSection(section.id, { body: event.target.value })}
                    />
                    {!locked ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="min-h-11"
                          disabled={index === 0}
                          onClick={() => moveSection(section.id, -1)}
                        >
                          Move up
                        </Button>
                        <Button
                          variant="secondary"
                          className="min-h-11"
                          disabled={index === value.sections.length - 1}
                          onClick={() => moveSection(section.id, 1)}
                        >
                          Move down
                        </Button>
                        <Button
                          variant="ghost"
                          className="min-h-11 text-danger"
                          disabled={value.sections.length <= 1}
                          onClick={() => removeSection(section.id)}
                        >
                          Remove section
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
