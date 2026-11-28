'use client';

import { useMemo, useState } from 'react';
import {
  listGeoSeedNodes,
  listLocationsForState,
  listStates,
  matchGeoAlias,
  type GeoNode,
} from '@askalert/geo';
import { CoveragePicker, Input, LocationSelect, cn } from '@askalert/ui';

type MobilePanel = 'tree' | 'preview';

export function GeographyExplorer() {
  const nodes = useMemo(() => listGeoSeedNodes(), []);
  const states = useMemo(() => listStates(nodes), [nodes]);
  const [stateSlug, setStateSlug] = useState(states[0]?.slug ?? 'lagos');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [aliasQuery, setAliasQuery] = useState('');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('tree');
  const [buyerLocation, setBuyerLocation] = useState({
    stateSlug: states[0]?.slug ?? 'lagos',
    locationSlug: '',
  });
  const [coverageSlugs, setCoverageSlugs] = useState<string[]>([]);

  const locations = useMemo(
    () => listLocationsForState(stateSlug, nodes, { includeStatewide: true }),
    [nodes, stateSlug],
  );

  const selected =
    nodes.find((node) => node.slug === selectedSlug) ??
    locations[0] ??
    null;

  const aliasHits = useMemo(() => {
    if (aliasQuery.trim().length < 2) return [];
    return matchGeoAlias(aliasQuery, nodes, { limit: 6 });
  }, [aliasQuery, nodes]);

  const selectState = (slug: string) => {
    setStateSlug(slug);
    setSelectedSlug(null);
    setMobilePanel('tree');
  };

  const selectLocation = (node: GeoNode) => {
    setSelectedSlug(node.slug);
    setMobilePanel('preview');
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border bg-navy-950 px-5 py-6 text-surface shadow-sm sm:px-7 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,_var(--glow-orange-strong),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-400">
              Marketplace
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Geography
            </h1>
            <p className="mt-2 max-w-xl text-sm text-surface/70">
              States, locations, statewide cover, and plan-capped vendor coverage. Seed data for
              Lagos and FCT — design can restyle later.
            </p>
          </div>
          <div className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-surface/15 bg-surface/10 px-3.5 py-2 text-xs font-semibold text-surface/80">
            <span className="size-2 rounded-full bg-orange-500" aria-hidden />
            {states.length} states · {nodes.length} nodes
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {states.map((state) => (
            <button
              key={state.id}
              type="button"
              onClick={() => selectState(state.slug)}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold',
                state.slug === stateSlug
                  ? 'border-orange-500 bg-orange-500 text-navy-900'
                  : 'border-border bg-card text-foreground',
              )}
            >
              {state.name}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(
              'min-h-11 rounded-full border text-sm font-semibold',
              mobilePanel === 'tree'
                ? 'border-orange-500 bg-orange-500 text-navy-900'
                : 'border-border bg-card',
            )}
            onClick={() => setMobilePanel('tree')}
          >
            Browse
          </button>
          <button
            type="button"
            className={cn(
              'min-h-11 rounded-full border text-sm font-semibold',
              mobilePanel === 'preview'
                ? 'border-orange-500 bg-orange-500 text-navy-900'
                : 'border-border bg-card',
            )}
            onClick={() => setMobilePanel('preview')}
          >
            Pickers
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_26rem] lg:items-start">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1.5 rounded-[1.5rem] border border-border bg-card p-3 shadow-sm">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">
              States
            </p>
            {states.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => selectState(state.slug)}
                className={cn(
                  'flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold',
                  state.slug === stateSlug
                    ? 'bg-orange-500 text-navy-900'
                    : 'text-foreground hover:bg-surface-subtle',
                )}
              >
                {state.name}
              </button>
            ))}
          </div>
        </aside>

        <section
          className={cn(
            'min-w-0 space-y-4',
            mobilePanel === 'preview' ? 'hidden lg:block' : 'block',
          )}
        >
          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {states.find((state) => state.slug === stateSlug)?.name ?? 'State'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locations.length} locations · statewide first
                </p>
              </div>
              <Input
                label="Find alias"
                value={aliasQuery}
                placeholder="Lekki Ph1, VI…"
                className="w-full sm:max-w-xs"
                onChange={(event) => setAliasQuery(event.target.value)}
              />
            </div>

            {aliasHits.length > 0 ? (
              <ul className="mt-3 space-y-1 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-2">
                {aliasHits.map((hit) => (
                  <li key={`${hit.node.id}-${hit.alias}`}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm"
                      onClick={() => {
                        if (hit.node.level === 'state') {
                          selectState(hit.node.slug);
                        } else {
                          const parentState = states.find((state) => {
                            const locs = listLocationsForState(state.slug, nodes);
                            return locs.some((loc) => loc.id === hit.node.id);
                          });
                          if (parentState) setStateSlug(parentState.slug);
                          selectLocation(hit.node);
                        }
                        setAliasQuery('');
                      }}
                    >
                      <span>
                        <span className="font-semibold">{hit.alias}</span>
                        <span className="text-muted-foreground"> → {hit.node.name}</span>
                      </span>
                      <span className="rounded-full bg-navy-950 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                        {Math.round(hit.confidence * 100)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {locations.map((node) => {
              const active = selected?.slug === node.slug;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => selectLocation(node)}
                  className={cn(
                    'min-h-[5.5rem] rounded-[1.35rem] border p-4 text-left transition',
                    active
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_10px_28px_var(--glow-orange)]'
                      : 'border-border bg-card hover:border-orange-500/40',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-extrabold">{node.name}</h3>
                    {node.isStatewide ? (
                      <span className="rounded-full bg-navy-950 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-400">
                        Statewide
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
                    {node.level}
                    {node.aliases[0] ? ` · ${node.aliases[0]}` : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <aside
          className={cn(
            'min-w-0 space-y-4',
            mobilePanel === 'tree' ? 'hidden lg:block' : 'block',
          )}
        >
          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24">
            <h3 className="text-sm font-extrabold">Buyer LocationSelect</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Searchable list with aliases. Statewide hidden for specific rule.
            </p>
            <div className="mt-3">
              <LocationSelect
                nodes={nodes}
                value={buyerLocation}
                locationRule="specific"
                onChange={setBuyerLocation}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-extrabold">Vendor CoveragePicker</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Free plan demo: 3 locations, no statewide, 1 state.
            </p>
            <div className="mt-3">
              <CoveragePicker
                nodes={nodes}
                startEmpty
                caps={{
                  maxCoverageLocations: 3,
                  allowStatewide: false,
                  maxStates: 1,
                }}
                onChange={setCoverageSlugs}
              />
            </div>
            {coverageSlugs.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Selected: {coverageSlugs.join(', ')}
              </p>
            ) : null}
          </div>

          {selected ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-navy-950 text-surface">
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-400">
                  Selected node
                </p>
                <h3 className="mt-2 text-xl font-extrabold">{selected.name}</h3>
                <p className="mt-1 text-sm text-surface/70">
                  {selected.slug} · {selected.level}
                  {selected.isStatewide ? ' · statewide' : ''}
                </p>
                {selected.aliases.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="rounded-full border border-surface/20 px-2.5 py-1 text-xs"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
