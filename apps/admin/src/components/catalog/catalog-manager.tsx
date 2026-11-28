'use client';

import { useMemo, useState } from 'react';
import {
  buildRequestSchema,
  buildSnapshotFromSeed,
  computeQuote,
  resolveCatalogTree,
  validateRateCard,
  type CatalogCategorySeed,
  type ServiceDefinition,
} from '@askalert/catalog';
import { Button, Input, cn } from '@askalert/ui';
import { useAdminStore } from '../../lib/admin-store';
import { CatalogAdminProvider, useCatalogAdminStore } from '../../lib/catalog-admin-store';
import { formatNairaFromKobo } from '../../lib/format-naira';
import { canEditCatalog, canPublishCatalog } from '../../lib/roles';

export function CatalogManager() {
  return (
    <CatalogAdminProvider>
      <CatalogManagerInner />
    </CatalogAdminProvider>
  );
}

function CatalogManagerInner() {
  const { role } = useAdminStore();
  const {
    ready,
    state,
    upsertCategory,
    publish,
    rollback,
    archiveService,
    resolveGapAlias,
    exportJson,
    importJson,
    resetToSeeds,
  } = useCatalogAdminStore();
  const canEdit = canEditCatalog(role);
  const canPublish = canPublishCatalog(role);

  const [categorySlug, setCategorySlug] = useState(state.working[0]?.category_slug ?? 'events');
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewQty, setPreviewQty] = useState(120);
  const [gapServiceSlug, setGapServiceSlug] = useState('');

  const category =
    state.working.find((item) => item.category_slug === categorySlug) ?? state.working[0];

  const selectedService =
    category?.services.find((service) => service.slug === serviceSlug) ??
    category?.services[0] ??
    null;

  const snapshot = useMemo(
    () => (category ? buildSnapshotFromSeed(category) : null),
    [category],
  );
  const tree = useMemo(
    () => (snapshot ? resolveCatalogTree(snapshot) : null),
    [snapshot],
  );

  const quotePreview = useMemo(() => {
    if (!selectedService || selectedService.pricing_model === 'quote_only') {
      return null;
    }
    return computeQuote(
      {
        service: selectedService,
        rates: selectedService.default_bands,
      },
      { serviceSlug: selectedService.slug, quantity: previewQty },
    );
  }, [previewQty, selectedService]);

  const requestPreview = useMemo(() => {
    if (!snapshot || !category?.types[0]) {
      return null;
    }
    const typeSlug = category.types[0].slug;
    const services = (selectedService ? [selectedService.slug] : category.services.slice(0, 2).map((s) => s.slug));
    return buildRequestSchema(snapshot, typeSlug, services);
  }, [category, selectedService, snapshot]);

  const rateValidation = useMemo(() => {
    if (!selectedService?.default_bands.length) {
      return null;
    }
    return validateRateCard(selectedService.default_bands, {
      minValue: selectedService.min_value,
      maxValue: selectedService.max_value,
    });
  }, [selectedService]);

  if (!ready || !category) {
    return <div className="h-40 animate-pulse rounded-2xl bg-card-muted" aria-busy />;
  }

  const patchCategory = (patch: Partial<CatalogCategorySeed>) => {
    if (!canEdit) {
      return;
    }
    const result = upsertCategory({ ...category, ...patch });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setMessage('Draft saved locally.');
  };

  const patchService = (next: ServiceDefinition) => {
    if (!canEdit) {
      return;
    }
    patchCategory({
      services: category.services.map((service) =>
        service.slug === next.slug ? next : service,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[1.5rem] border border-border/60 bg-[radial-gradient(90%_80%_at_0%_0%,_color-mix(in_srgb,var(--orange-500)_12%,transparent),_transparent_55%),var(--card)] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
          Prompt 45 · Catalog manager
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Service catalog
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edit categories, types and services. Publish with a change note. Drafts stay on this
          device until remote publish is wired.
        </p>
        {!canEdit ? (
          <p className="mt-3 text-sm font-semibold text-danger">View only · {role}</p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={!canEdit}
          onClick={() => {
            const blob = new Blob([exportJson()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'askalert-catalog.json';
            anchor.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </Button>
        <label className={cn('inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-bold', !canEdit && 'opacity-50')}>
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={!canEdit}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) {
                return;
              }
              void file.text().then((raw) => {
                const result = importJson(raw);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setError(null);
                setMessage('Imported catalog JSON.');
              });
            }}
          />
        </label>
        <Button variant="ghost" disabled={!canEdit} onClick={resetToSeeds}>
          Reset to seeds
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1.2fr)_minmax(16rem,0.85fr)]">
        <aside className="rounded-2xl border border-border/60 bg-card p-3">
          <p className="px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Categories
          </p>
          <ul className="mt-2 space-y-1">
            {state.working.map((item) => (
              <li key={item.category_slug}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold',
                    item.category_slug === category.category_slug
                      ? 'bg-orange-500/15 text-navy-950'
                      : 'hover:bg-card-muted',
                  )}
                  onClick={() => {
                    setCategorySlug(item.category_slug);
                    setServiceSlug(null);
                  }}
                >
                  {item.category_name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h2 className="text-lg font-extrabold">{category.category_name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                label="Category name"
                value={category.category_name}
                disabled={!canEdit}
                onChange={(event) => patchCategory({ category_name: event.target.value })}
              />
              <Input
                label="Type label"
                value={category.type_label}
                disabled={!canEdit}
                onChange={(event) => patchCategory({ type_label: event.target.value })}
              />
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Types
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {category.types.map((type) => (
                  <span
                    key={type.slug}
                    className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold"
                  >
                    {type.name}
                    <button
                      type="button"
                      className="ml-2 text-orange-700 disabled:opacity-40"
                      disabled={!canEdit}
                      onClick={() => {
                        const nextSort = Math.max(0, type.sort - 1);
                        patchCategory({
                          types: category.types
                            .map((item) =>
                              item.slug === type.slug ? { ...item, sort: nextSort } : item,
                            )
                            .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)),
                        });
                      }}
                    >
                      ↑
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold">Services</h3>
              <p className="text-xs text-muted-foreground">{category.services.length} total</p>
            </div>
            <ul className="mt-3 max-h-56 space-y-1 overflow-auto">
              {category.services.map((service) => (
                <li key={service.slug}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                      selectedService?.slug === service.slug
                        ? 'bg-orange-500/15 font-bold'
                        : 'hover:bg-card-muted',
                    )}
                    onClick={() => setServiceSlug(service.slug)}
                  >
                    <span>
                      {service.name}
                      {service.status === 'archived' ? ' · archived' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">{service.pricing_model}</span>
                  </button>
                </li>
              ))}
            </ul>

            {selectedService ? (
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <Input
                  label="Service name"
                  value={selectedService.name}
                  disabled={!canEdit}
                  onChange={(event) =>
                    patchService({ ...selectedService, name: event.target.value })
                  }
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Min"
                    type="number"
                    value={selectedService.min_value ?? ''}
                    disabled={!canEdit}
                    onChange={(event) =>
                      patchService({
                        ...selectedService,
                        min_value:
                          event.target.value === '' ? undefined : Number(event.target.value),
                      })
                    }
                  />
                  <Input
                    label="Max"
                    type="number"
                    value={selectedService.max_value ?? ''}
                    disabled={!canEdit}
                    onChange={(event) =>
                      patchService({
                        ...selectedService,
                        max_value:
                          event.target.value === '' ? undefined : Number(event.target.value),
                      })
                    }
                  />
                  <Input
                    label="Lead time (hours)"
                    type="number"
                    value={selectedService.default_lead_time_hours}
                    disabled={!canEdit}
                    onChange={(event) =>
                      patchService({
                        ...selectedService,
                        default_lead_time_hours: Number(event.target.value) || 0,
                      })
                    }
                  />
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={selectedService.regulated}
                    disabled={!canEdit}
                    onChange={(event) =>
                      patchService({ ...selectedService, regulated: event.target.checked })
                    }
                  />
                  Regulated service
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={!canEdit}
                    onClick={() => {
                      const result = archiveService(category.category_slug, selectedService.slug);
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      setMessage(`Archived ${selectedService.name}.`);
                    }}
                  >
                    Archive service
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!canEdit}
                    onClick={() => {
                      const idx = category.services.findIndex((s) => s.slug === selectedService.slug);
                      if (idx <= 0) {
                        return;
                      }
                      const services = [...category.services];
                      const prev = services[idx - 1]!;
                      services[idx - 1] = { ...selectedService, sort: prev.sort };
                      services[idx] = { ...prev, sort: selectedService.sort };
                      patchCategory({
                        services: services.sort((a, b) => a.sort - b.sort),
                      });
                    }}
                  >
                    Move up
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h3 className="text-base font-extrabold">Publish</h3>
            <Input
              className="mt-3"
              label="Change note"
              value={changeNote}
              disabled={!canPublish}
              onChange={(event) => setChangeNote(event.target.value)}
              hint="Required. Example: Add gele service bands for weddings."
            />
            <Button
              className="mt-3"
              disabled={!canPublish}
              onClick={() => {
                const result = publish(category.category_slug, changeNote);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setChangeNote('');
                setError(null);
                setMessage(`Published ${category.category_name}.`);
              }}
            >
              Publish category
            </Button>
            <ul className="mt-4 space-y-2">
              {state.versions
                .filter((version) => version.categorySlug === category.category_slug)
                .slice(0, 5)
                .map((version) => (
                  <li
                    key={version.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
                  >
                    <span>
                      v{version.version} · {version.changeNote}
                    </span>
                    <button
                      type="button"
                      className="min-h-11 text-xs font-bold text-orange-700 disabled:opacity-40"
                      disabled={!canPublish}
                      onClick={() => {
                        const result = rollback(version.id);
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setMessage(`Rolled back to v${version.version}.`);
                      }}
                    >
                      Rollback
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h3 className="text-base font-extrabold">Catalog gaps</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Unmapped searches. Add as an alias on a service.
            </p>
            <ul className="mt-3 space-y-3">
              {state.gaps.map((gap) => (
                <li key={gap.id} className="rounded-xl border border-border/60 px-3 py-3">
                  <p className="text-sm font-extrabold">{gap.term}</p>
                  <p className="text-xs text-muted-foreground">
                    {gap.categorySlug ?? 'unknown'} · {gap.languageHint}
                  </p>
                  {gap.categorySlug === category.category_slug ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <select
                        className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"
                        value={gapServiceSlug}
                        disabled={!canEdit}
                        onChange={(event) => setGapServiceSlug(event.target.value)}
                      >
                        <option value="">Pick service</option>
                        {category.services.map((service) => (
                          <option key={service.slug} value={service.slug}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        disabled={!canEdit || !gapServiceSlug}
                        onClick={() => {
                          const result = resolveGapAlias(gap.id, gapServiceSlug);
                          if (!result.ok) {
                            setError(result.error);
                            return;
                          }
                          setMessage(`Added alias “${gap.term}”.`);
                        }}
                      >
                        Add as alias
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
              Live preview
            </p>
            <h3 className="mt-2 text-base font-extrabold">
              {selectedService?.name ?? 'Pick a service'}
            </h3>
            {selectedService ? (
              <>
                <Input
                  className="mt-3"
                  label="Preview quantity"
                  type="number"
                  value={previewQty}
                  onChange={(event) => setPreviewQty(Number(event.target.value) || 1)}
                />
                {quotePreview ? (
                  <p className="mt-3 text-sm font-semibold">
                    Quote:{' '}
                    {quotePreview.customQuoteNeeded
                      ? 'Custom quote needed'
                      : formatNairaFromKobo(quotePreview.amountMinor)}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Quote-only or no bands.</p>
                )}
                {rateValidation ? (
                  <p
                    className={cn(
                      'mt-2 text-xs font-semibold',
                      rateValidation.ok ? 'text-foreground' : 'text-danger',
                    )}
                  >
                    Rate card {rateValidation.ok ? 'valid' : rateValidation.errors[0]}
                  </p>
                ) : null}
                {requestPreview ? (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Buyer questions
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {requestPreview.dimensionQuestions.map((question) => (
                        <li key={question.key}>{question.label}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {tree ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Tree v{tree.version} · {tree.types.length} types
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/60 bg-navy-950 p-4 text-surface">
            <p className="text-sm font-extrabold">Audit</p>
            <ul className="mt-3 max-h-48 space-y-2 overflow-auto text-xs text-surface/80">
              {state.audit.length === 0 ? (
                <li>No local audit yet.</li>
              ) : (
                state.audit.slice(0, 12).map((entry) => (
                  <li key={entry.id}>
                    {entry.action}: {entry.detail}
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-foreground">{message}</p> : null}
    </div>
  );
}
