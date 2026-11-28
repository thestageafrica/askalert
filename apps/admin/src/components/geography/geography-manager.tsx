'use client';

import { useMemo, useState } from 'react';
import { listStates, listLocationsForState, type GeoNode } from '@askalert/geo';
import { Button, CoveragePicker, Input, LocationSelect, cn } from '@askalert/ui';
import { useAdminStore } from '../../lib/admin-store';
import { GeoAdminProvider, useGeoAdminStore } from '../../lib/geo-admin-store';
import { canEditGeography, canPublishGeography } from '../../lib/roles';
import { AreasManagerPanel } from './areas-manager-panel';

export function GeographyManager() {
  return (
    <GeoAdminProvider>
      <GeographyManagerInner />
    </GeoAdminProvider>
  );
}

function GeographyManagerInner() {
  const { role } = useAdminStore();
  const {
    ready,
    state,
    upsertNode,
    archiveNode,
    mergeNodes,
    publish,
    importCsv,
    exportCsv,
    setActivation,
    resetToSeeds,
  } = useGeoAdminStore();
  const canEdit = canEditGeography(role);
  const canPublish = canPublishGeography(role);

  const states = useMemo(() => listStates(state.working), [state.working]);
  const [stateSlug, setStateSlug] = useState(states[0]?.slug ?? 'lagos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [activationCategory, setActivationCategory] = useState('events');
  const [pickerValue, setPickerValue] = useState({ stateSlug: 'lagos', locationSlug: '' });
  const [coverageSlugs, setCoverageSlugs] = useState<string[]>([]);

  const locations = useMemo(
    () => listLocationsForState(stateSlug, state.working, { includeStatewide: true }),
    [state.working, stateSlug],
  );
  const selected =
    state.working.find((node) => node.id === selectedId) ??
    locations.find((node) => !node.isStatewide) ??
    null;

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-2xl bg-card-muted" aria-busy />;
  }

  const slugify = (input: string) =>
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);

  return (
    <div className="space-y-6">
      <header className="rounded-[1.5rem] border border-border/60 bg-[radial-gradient(90%_80%_at_100%_0%,_color-mix(in_srgb,var(--orange-500)_14%,transparent),_transparent_55%),var(--card)] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
          Prompt 45 · Geography manager
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          States and locations
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edit the geo tree, merge duplicates, import CSV, and publish with a change note.
        </p>
        {!canEdit ? (
          <p className="mt-3 text-sm font-semibold text-danger">View only · {role}</p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            const blob = new Blob([exportCsv()], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'askalert-geo-nodes.csv';
            anchor.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </Button>
        <label
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-bold',
            !canEdit && 'opacity-50',
          )}
        >
          Import CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={!canEdit}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) {
                return;
              }
              void file.text().then((csv) => {
                const result = importCsv(csv);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setError(null);
                setMessage('Imported geography CSV.');
              });
            }}
          />
        </label>
        <Button variant="ghost" disabled={!canEdit} onClick={resetToSeeds}>
          Reset to Nigeria seed
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[14rem_minmax(0,1.15fr)_minmax(16rem,0.9fr)]">
        <aside className="rounded-2xl border border-border/60 bg-card p-3">
          <p className="px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            States
          </p>
          <ul className="mt-2 space-y-1">
            {states.map((stateNode) => (
              <li key={stateNode.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold',
                    stateNode.slug === stateSlug
                      ? 'bg-orange-500/15 text-navy-950'
                      : 'hover:bg-card-muted',
                  )}
                  onClick={() => {
                    setStateSlug(stateNode.slug);
                    setSelectedId(null);
                    setPickerValue({ stateSlug: stateNode.slug, locationSlug: '' });
                  }}
                >
                  {stateNode.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold">Locations</h2>
              <p className="text-xs text-muted-foreground">{locations.length} in {stateSlug}</p>
            </div>
            <ul className="mt-3 max-h-64 space-y-1 overflow-auto">
              {locations.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                      selected?.id === node.id
                        ? 'bg-orange-500/15 font-bold'
                        : 'hover:bg-card-muted',
                    )}
                    onClick={() => setSelectedId(node.id)}
                  >
                    <span>
                      {node.name}
                      {node.isStatewide ? ' · statewide' : ''}
                      {node.status === 'archived' ? ' · archived' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">{node.slug}</span>
                  </button>
                </li>
              ))}
            </ul>

            {canEdit ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
                <Input
                  label="New location name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                />
                <Button
                  className="self-end"
                  onClick={() => {
                    const name = newName.trim();
                    if (!name) {
                      setError('Enter a location name.');
                      return;
                    }
                    const parent = states.find((item) => item.slug === stateSlug);
                    if (!parent) {
                      setError('Pick a state first.');
                      return;
                    }
                    const slug = slugify(name);
                    const node: GeoNode = {
                      id: `geo_${slug}_${Date.now()}`,
                      parentId: parent.id,
                      level: 'area',
                      slug,
                      name,
                      aliases: [],
                      lat: null,
                      lng: null,
                      isStatewide: false,
                      status: 'active',
                      sort: locations.length + 1,
                    };
                    upsertNode(node);
                    setNewName('');
                    setSelectedId(node.id);
                    setMessage(`Added ${name}.`);
                    setError(null);
                  }}
                >
                  Add location
                </Button>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
              <h3 className="text-base font-extrabold">Edit location</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={selected.name}
                  disabled={!canEdit || selected.isStatewide}
                  onChange={(event) =>
                    upsertNode({ ...selected, name: event.target.value })
                  }
                />
                <Input
                  label="Slug"
                  value={selected.slug}
                  disabled
                  hint="Slug stays stable for redirects."
                />
              </div>
              <Input
                className="mt-3"
                label="Aliases (comma separated)"
                value={selected.aliases.join(', ')}
                disabled={!canEdit}
                onChange={(event) =>
                  upsertNode({
                    ...selected,
                    aliases: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!canEdit || selected.isStatewide}
                  onClick={() => {
                    const result = archiveNode(selected.id);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setMessage(`Archived ${selected.name}.`);
                  }}
                >
                  Archive
                </Button>
              </div>

              {!selected.isStatewide ? (
                <div className="mt-4 border-t border-border/50 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Merge into
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select
                      className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"
                      value={mergeTargetId}
                      disabled={!canEdit}
                      onChange={(event) => setMergeTargetId(event.target.value)}
                    >
                      <option value="">Pick target</option>
                      {locations
                        .filter((node) => node.id !== selected.id && !node.isStatewide)
                        .map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="secondary"
                      disabled={!canEdit || !mergeTargetId}
                      onClick={() => {
                        const result = mergeNodes(selected.id, mergeTargetId);
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setMergeTargetId('');
                        setSelectedId(mergeTargetId);
                        setMessage('Merged locations and saved redirect.');
                      }}
                    >
                      Merge
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h3 className="text-base font-extrabold">Publish geography</h3>
            <Input
              className="mt-3"
              label="Change note"
              value={changeNote}
              disabled={!canPublish}
              onChange={(event) => setChangeNote(event.target.value)}
            />
            <Button
              className="mt-3"
              disabled={!canPublish}
              onClick={() => {
                const result = publish(changeNote);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setChangeNote('');
                setMessage('Published geography draft.');
              }}
            >
              Publish
            </Button>
            <ul className="mt-4 space-y-2 text-sm">
              {state.versions.slice(0, 5).map((version) => (
                <li key={version.id} className="rounded-xl border border-border/60 px-3 py-2">
                  v{version.version} · {version.changeNote}
                </li>
              ))}
            </ul>
            {state.redirects.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Redirects
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {state.redirects.slice(0, 8).map((redirect) => (
                    <li key={`${redirect.fromId}-${redirect.toId}`}>
                      {redirect.fromSlug} → {redirect.toSlug}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h3 className="text-base font-extrabold">Activate for category</h3>
            <select
              className="mt-3 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={activationCategory}
              disabled={!canEdit}
              onChange={(event) => setActivationCategory(event.target.value)}
            >
              {['events', 'shortlets', 'home-care', 'security'].map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-wrap gap-2">
              {locations
                .filter((node) => !node.isStatewide)
                .slice(0, 16)
                .map((node) => {
                  const active = (state.categoryActivation[activationCategory] ?? []).includes(
                    node.slug,
                  );
                  return (
                    <button
                      key={node.id}
                      type="button"
                      disabled={!canEdit}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold',
                        active
                          ? 'border-orange-500 bg-orange-500/15 text-navy-950'
                          : 'border-border',
                      )}
                      onClick={() => {
                        const current = state.categoryActivation[activationCategory] ?? [];
                        const next = active
                          ? current.filter((slug) => slug !== node.slug)
                          : [...current, node.slug];
                        setActivation(activationCategory, next);
                      }}
                    >
                      {node.name}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h3 className="text-base font-extrabold">Demand vs supply</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Demand</th>
                    <th className="py-2">Vendors</th>
                  </tr>
                </thead>
                <tbody>
                  {state.demandSupply.map((row) => (
                    <tr key={row.locationSlug} className="border-b border-border/40">
                      <td className="py-2 pr-3 font-semibold">{row.locationName}</td>
                      <td className="py-2 pr-3">{row.demandCount}</td>
                      <td className="py-2">{row.vendorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
              Buyer preview
            </p>
            <div className="mt-3">
              <LocationSelect
                nodes={state.working}
                value={pickerValue}
                onChange={setPickerValue}
                locationRule="specific"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
              Vendor coverage preview
            </p>
            <div className="mt-3">
              <CoveragePicker
                nodes={state.working}
                caps={{
                  maxCoverageLocations: 5,
                  allowStatewide: true,
                  maxStates: 2,
                }}
                value={coverageSlugs}
                onChange={setCoverageSlugs}
                startEmpty
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-navy-950 p-4 text-surface">
            <p className="text-sm font-extrabold">Audit</p>
            <ul className="mt-3 max-h-40 space-y-2 overflow-auto text-xs text-surface/80">
              {state.audit.length === 0 ? (
                <li>No local audit yet.</li>
              ) : (
                state.audit.slice(0, 10).map((entry) => (
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

      <details className="rounded-2xl border border-dashed border-border/70 p-4">
        <summary className="cursor-pointer text-sm font-bold">Legacy areas sync</summary>
        <div className="mt-4">
          <AreasManagerPanel />
        </div>
      </details>
    </div>
  );
}
