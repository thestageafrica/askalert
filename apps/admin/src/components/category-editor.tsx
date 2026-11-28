'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildIntakeSteps,
  type CategoryAttribute,
  type CategoryConfig,
  type CategoryStatus,
} from '@askalert/category-engine';
import {
  Button,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@askalert/ui';
import { useAdminStore } from '../lib/admin-store';
import { canEditCategories, canPublishCategories } from '../lib/roles';
import { StatusChip } from './status-chip';

const readinessLabels = {
  verifiedVendors: '15 verified vendors',
  fastResponders: '5 fast responders',
  supplyOwner: 'Supply owner assigned',
  termsReady: 'Terms ready',
  evaluationPassed: 'Evaluation passed',
} as const;

export function CategoryEditor({ categoryId }: { categoryId: string }) {
  const {
    getCategory,
    updateDraft,
    publishCategory,
    rollbackCategory,
    setReadiness,
    role,
    categoriesLoading,
  } = useAdminStore();
  const { toast } = useToast();
  const category = getCategory(categoryId);
  const canEdit = canEditCategories(role);
  const canPublish = canPublishCategories(role);
  const [publishNote, setPublishNote] = useState('');
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [publishStatus, setPublishStatus] = useState<CategoryStatus>('pilot');
  const [publishing, setPublishing] = useState(false);

  const draft = category?.draft;
  const intakePreview = useMemo(
    () => (draft ? buildIntakeSteps(draft, 'need') : []),
    [draft],
  );

  if (categoriesLoading) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading category"
      />
    );
  }

  if (!category || !draft) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6">
        <p className="font-semibold">Category not found</p>
        <Button href="/categories" className="mt-4" variant="secondary">
          Back to list
        </Button>
      </div>
    );
  }

  const patch = (partial: Partial<CategoryConfig>) => {
    if (!canEdit) {
      return;
    }
    updateDraft(category.id, { ...draft, ...partial });
  };

  const patchEscrow = (partial: Partial<CategoryConfig['escrow']>) => {
    patch({ escrow: { ...draft.escrow, ...partial } });
  };

  const patchAgent = (partial: Partial<CategoryConfig['agent']>) => {
    patch({ agent: { ...draft.agent, ...partial } });
  };

  const updateRequirement = (index: number, value: string) => {
    const next = [...draft.vendor_requirements];
    next[index] = value;
    patch({ vendor_requirements: next });
  };

  const addRequirement = () => {
    patch({ vendor_requirements: [...draft.vendor_requirements, ''] });
  };

  const removeRequirement = (index: number) => {
    patch({
      vendor_requirements: draft.vendor_requirements.filter((_, i) => i !== index),
    });
  };

  const moveRequirement = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.vendor_requirements.length) {
      return;
    }
    const next = [...draft.vendor_requirements];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    patch({ vendor_requirements: next });
  };

  const updateAttribute = (index: number, next: CategoryAttribute) => {
    const attributes = draft.attributes.map((item, i) => (i === index ? next : item));
    patch({ attributes });
  };

  const moveAttribute = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.attributes.length) {
      return;
    }
    const attributes = [...draft.attributes];
    const current = attributes[index];
    const swap = attributes[target];
    if (!current || !swap) {
      return;
    }
    attributes[index] = swap;
    attributes[target] = current;
    patch({ attributes });
  };

  const removeAttribute = (index: number) => {
    patch({ attributes: draft.attributes.filter((_, i) => i !== index) });
  };

  const addAttribute = () => {
    const key = `field_${draft.attributes.length + 1}`;
    patch({
      attributes: [
        ...draft.attributes,
        {
          key,
          label: 'New field',
          type: 'text',
          required: false,
          applies_to: 'need',
        },
      ],
    });
  };

  const onPublish = async () => {
    setPublishing(true);
    try {
      const result = await publishCategory(category.id, publishNote, publishStatus);
      if (!result.ok) {
        setPublishErrors(result.errors);
        toast({
          title: 'Publish blocked',
          description: result.errors[0] ?? 'Fix the errors below.',
          tone: 'danger',
        });
        return;
      }
      setPublishErrors([]);
      setPublishNote('');
      // Keep draft status in sync with what was published.
      updateDraft(category.id, { ...draft, status: publishStatus });
      toast({
        title: 'Published',
        description:
          process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'
            ? 'Saved to Supabase. Refresh will keep this status.'
            : 'Version saved in memory (mock mode).',
        tone: 'success',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-navy-700/25 bg-navy-950 px-5 py-5 text-surface shadow-[0_16px_40px_color-mix(in_srgb,var(--navy-950)_16%,transparent)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,_var(--glow-orange-strong),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/categories" className="text-sm font-semibold text-orange-400">
              ← Categories
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{draft.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusChip status={draft.status} />
              <span className="rounded-full border border-surface/15 bg-surface/10 px-2.5 py-1 text-xs font-semibold text-surface/75">
                {draft.slug}
              </span>
            </div>
          </div>
          {!canEdit ? (
            <p className="rounded-full border border-surface/15 bg-surface/10 px-3 py-2 text-xs font-bold text-surface/80">
              View only · {role}
            </p>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="basics">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="requirements">Vendor requirements</TabsTrigger>
          <TabsTrigger value="rules">Rules and payouts</TabsTrigger>
          <TabsTrigger value="agent">Agent text</TabsTrigger>
          <TabsTrigger value="readiness">Areas and readiness</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Vendor requirements</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shown to vendors during onboarding for this category. Edit a line, add more, reorder, or
              remove. Publish from the Versions tab to go live.
            </p>
          </div>
          <ul className="space-y-2">
            {draft.vendor_requirements.map((requirement, index) => (
              <li
                key={`req_${index}`}
                className="flex flex-wrap items-start gap-2 rounded-2xl border border-border/70 bg-surface-subtle/60 p-2 sm:flex-nowrap"
              >
                <span className="mt-2.5 w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <Input
                  aria-label={`Requirement ${index + 1}`}
                  value={requirement}
                  disabled={!canEdit}
                  placeholder="e.g. ID verification"
                  onChange={(event) => updateRequirement(index, event.target.value)}
                />
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-xs font-bold disabled:opacity-40"
                    disabled={!canEdit || index === 0}
                    aria-label="Move up"
                    onClick={() => moveRequirement(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-xs font-bold disabled:opacity-40"
                    disabled={!canEdit || index >= draft.vendor_requirements.length - 1}
                    aria-label="Move down"
                    onClick={() => moveRequirement(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-xs font-bold text-danger disabled:opacity-40"
                    disabled={!canEdit || draft.vendor_requirements.length <= 1}
                    aria-label="Remove requirement"
                    onClick={() => removeRequirement(index)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {canEdit ? (
            <Button type="button" variant="secondary" onClick={addRequirement}>
              Add requirement
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            At least one requirement is required to publish. Empty lines are removed on publish.
          </p>
        </TabsContent>

        <TabsContent value="basics" className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <Input
            label="Name"
            value={draft.name}
            disabled={!canEdit}
            onChange={(event) => patch({ name: event.target.value })}
          />
          <Input
            label="Slug"
            value={draft.slug}
            disabled={!canEdit}
            onChange={(event) => patch({ slug: event.target.value })}
          />
          <Input
            label="Icon"
            value={draft.icon}
            disabled={!canEdit}
            onChange={(event) => patch({ icon: event.target.value })}
          />
          <Select
            label="Status"
            value={draft.status}
            disabled={!canEdit}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'pilot', label: 'Pilot' },
              { value: 'live', label: 'Live' },
              { value: 'paused', label: 'Paused' },
            ]}
            onChange={(event) => {
              const status = event.target.value as CategoryStatus;
              patch({ status });
              setPublishStatus(status);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Status only sticks after you Publish (Versions tab).
          </p>
        </TabsContent>

        <TabsContent value="attributes" className="mt-4 space-y-3">
          {draft.attributes.map((attribute, index) => (
            <div key={`${attribute.key}_${index}`} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Key"
                  value={attribute.key}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateAttribute(index, { ...attribute, key: event.target.value })
                  }
                />
                <Input
                  label="Label"
                  value={attribute.label}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateAttribute(index, { ...attribute, label: event.target.value })
                  }
                />
                <Select
                  label="Type"
                  value={attribute.type}
                  disabled={!canEdit}
                  options={[
                    'text',
                    'number',
                    'money',
                    'date',
                    'select',
                    'multi',
                    'area',
                    'boolean',
                  ].map((value) => ({ value, label: value }))}
                  onChange={(event) =>
                    updateAttribute(index, {
                      ...attribute,
                      type: event.target.value as CategoryAttribute['type'],
                    })
                  }
                />
                <Select
                  label="Applies to"
                  value={attribute.applies_to}
                  disabled={!canEdit}
                  options={[
                    { value: 'need', label: 'Need' },
                    { value: 'offer', label: 'Offer' },
                    { value: 'both', label: 'Both' },
                  ]}
                  onChange={(event) =>
                    updateAttribute(index, {
                      ...attribute,
                      applies_to: event.target.value as CategoryAttribute['applies_to'],
                    })
                  }
                />
              </div>
              <label className="mt-3 flex min-h-11 items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={attribute.required}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateAttribute(index, { ...attribute, required: event.target.checked })
                  }
                />
                Required
              </label>
              {(attribute.type === 'select' || attribute.type === 'multi') && (
                <Input
                  className="mt-3"
                  label="Options (comma separated)"
                  value={(attribute.options ?? []).join(', ')}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateAttribute(index, {
                      ...attribute,
                      options: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!canEdit || index === 0}
                  onClick={() => moveAttribute(index, -1)}
                >
                  Move up
                </Button>
                <Button
                  variant="secondary"
                  disabled={!canEdit || index === draft.attributes.length - 1}
                  onClick={() => moveAttribute(index, 1)}
                >
                  Move down
                </Button>
                <Button variant="ghost" disabled={!canEdit} onClick={() => removeAttribute(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button disabled={!canEdit} onClick={addAttribute}>
            Add attribute
          </Button>
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Pricing mode"
              value={draft.pricing_mode}
              disabled={!canEdit}
              options={['fixed', 'range', 'quote', 'rate_card'].map((value) => ({
                value,
                label: value,
              }))}
              onChange={(event) =>
                patch({ pricing_mode: event.target.value as CategoryConfig['pricing_mode'] })
              }
            />
            <Select
              label="Negotiation"
              value={draft.negotiation}
              disabled={!canEdit}
              options={['none', 'assisted', 'auto'].map((value) => ({ value, label: value }))}
              onChange={(event) =>
                patch({ negotiation: event.target.value as CategoryConfig['negotiation'] })
              }
            />
            <Input
              label="Commission %"
              type="number"
              value={draft.commission_pct}
              disabled={!canEdit}
              onChange={(event) => patch({ commission_pct: Number(event.target.value) })}
            />
            <Input
              label="Autopilot max rounds"
              type="number"
              value={draft.autopilot_max_rounds}
              disabled={!canEdit}
              onChange={(event) => patch({ autopilot_max_rounds: Number(event.target.value) })}
            />
            <Select
              label="Payout mode"
              value={draft.escrow.mode}
              disabled={!canEdit}
              options={['fixed', 'buyer_selectable', 'none'].map((value) => ({
                value,
                label: value,
              }))}
              onChange={(event) =>
                patchEscrow({ mode: event.target.value as CategoryConfig['escrow']['mode'] })
              }
            />
            <Select
              label="Fee bearer"
              value={draft.escrow.fee_bearer}
              disabled={!canEdit}
              options={['vendor', 'platform', 'buyer'].map((value) => ({ value, label: value }))}
              onChange={(event) =>
                patchEscrow({
                  fee_bearer: event.target.value as CategoryConfig['escrow']['fee_bearer'],
                })
              }
            />
            <Input
              label="Default hold %"
              type="number"
              value={draft.escrow.default_hold_pct}
              disabled={!canEdit}
              onChange={(event) => patchEscrow({ default_hold_pct: Number(event.target.value) })}
            />
            <Input
              label="Min hold %"
              type="number"
              value={draft.escrow.min_hold_pct}
              disabled={!canEdit}
              onChange={(event) => patchEscrow({ min_hold_pct: Number(event.target.value) })}
            />
            <Input
              label="Max hold %"
              type="number"
              value={draft.escrow.max_hold_pct}
              disabled={!canEdit}
              onChange={(event) => patchEscrow({ max_hold_pct: Number(event.target.value) })}
            />
            <Input
              label="Vendor min release %"
              type="number"
              value={draft.escrow.vendor_min_release_pct}
              disabled={!canEdit}
              onChange={(event) =>
                patchEscrow({ vendor_min_release_pct: Number(event.target.value) })
              }
            />
          </div>
          <p className="rounded-2xl border border-dashed border-border bg-card-muted/50 px-3 py-3 text-sm text-muted-foreground">
            Vendor onboarding requirement lines are edited in the{' '}
            <span className="font-semibold text-foreground">Vendor requirements</span> tab
            ({draft.vendor_requirements.length} listed).
          </p>
        </TabsContent>

        <TabsContent value="agent" className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <Input
            label="Tone"
            value={draft.agent.tone}
            disabled={!canEdit}
            onChange={(event) => patchAgent({ tone: event.target.value })}
          />
          <Input
            label="Extra rules (one per line)"
            value={draft.agent.extra_rules.join('\n')}
            disabled={!canEdit}
            onChange={(event) =>
              patchAgent({
                extra_rules: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
          <Input
            label="Negotiation hints (one per line)"
            value={draft.agent.negotiation_hints.join('\n')}
            disabled={!canEdit}
            onChange={(event) =>
              patchAgent({
                negotiation_hints: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
        </TabsContent>

        <TabsContent value="readiness" className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Launch checklist before moving a category to pilot or live.
          </p>
          {(Object.keys(readinessLabels) as Array<keyof typeof readinessLabels>).map((key) => (
            <label key={key} className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium">
              <span>{readinessLabels[key]}</span>
              <input
                type="checkbox"
                className="size-5 accent-orange-500"
                checked={category.readiness[key]}
                disabled={!canEdit}
                onChange={(event) => setReadiness(category.id, key, event.target.checked)}
              />
            </label>
          ))}
        </TabsContent>

        <TabsContent value="preview" className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Intake steps as a buyer would see them (need flow).
          </p>
          {intakePreview.length === 0 ? (
            <p className="text-sm font-semibold">No need attributes yet.</p>
          ) : (
            intakePreview.map((step, index) => (
              <div key={step.key} className="rounded-2xl border border-border bg-card-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Question {index + 1}
                </p>
                <p className="mt-1 font-bold">{step.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.type}
                  {step.required ? ' · required' : ''}
                  {step.options ? ` · ${step.options.join(', ')}` : ''}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="versions" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-bold">Publish</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Runs validateConfig. Errors show in plain English.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Select
                label="Publish as"
                value={publishStatus}
                disabled={!canPublish}
                options={[
                  { value: 'pilot', label: 'Pilot' },
                  { value: 'live', label: 'Live' },
                ]}
                onChange={(event) => setPublishStatus(event.target.value as CategoryStatus)}
              />
              <Input
                label="Change note"
                value={publishNote}
                disabled={!canPublish}
                onChange={(event) => setPublishNote(event.target.value)}
                placeholder="What changed?"
              />
            </div>
            <Button className="mt-3" disabled={!canPublish || publishing} onClick={() => void onPublish()}>
              {publishing ? 'Publishing…' : 'Publish version'}
            </Button>
            {publishErrors.length > 0 ? (
              <ul className="mt-3 space-y-1 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                {publishErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-2">
            {category.versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions yet.</p>
            ) : (
              category.versions.map((version) => (
                <div
                  key={version.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-bold">{version.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString('en-NG')} ·{' '}
                      {version.published ? 'published' : 'snapshot'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={!canEdit}
                    onClick={() => {
                      rollbackCategory(category.id, version.id);
                      toast({
                        title: 'Rolled back',
                        description: 'Draft restored from this version.',
                        tone: 'success',
                      });
                    }}
                  >
                    Roll back
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
