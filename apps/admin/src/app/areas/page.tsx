'use client';

import { useState } from 'react';
import { Button, Input, cn } from '@askalert/ui';
import { useAreasAdmin } from '../../lib/areas-admin-store';
import { useAdminStore } from '../../lib/admin-store';
import { canEditCategories } from '../../lib/roles';

export default function AreasPage() {
  const { role } = useAdminStore();
  const canEdit = canEditCategories(role);
  const {
    ready,
    states,
    locationsFor,
    addState,
    addLocation,
    renameNode,
    removeLocation,
    resetToSeed,
  } = useAreasAdmin();
  const [selectedState, setSelectedState] = useState('lagos');
  const [stateName, setStateName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!ready) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading areas"
      />
    );
  }

  const activeState = states.find((state) => state.slug === selectedState) ?? states[0];
  const locations = activeState ? locationsFor(activeState.slug) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            Marketplace
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Areas</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Seed states and their locations for vendor coverage. Lagos ships first; add more states
            when you expand.
          </p>
        </div>
        {canEdit ? (
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => {
              resetToSeed();
              setSelectedState('lagos');
              setMessage('Reset to Lagos seed catalogue.');
            }}
          >
            Reset to seed
          </Button>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="text-sm font-semibold text-orange-700">
          View only for your role. Switch to Super admin or Operations to edit.
        </p>
      ) : null}
      {message ? (
        <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-navy-950">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">States</h2>
          <ul className="space-y-2">
            {states.map((state) => (
              <li key={state.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedState(state.slug);
                    setMessage(null);
                  }}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-3 text-left text-sm transition',
                    state.slug === activeState?.slug
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border bg-card-muted hover:border-orange-500/40',
                  )}
                >
                  <p className="font-extrabold text-foreground">{state.name}</p>
                  <p className="text-xs text-muted-foreground">{state.slug}</p>
                </button>
              </li>
            ))}
          </ul>
          {canEdit ? (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <Input
                label="New state"
                value={stateName}
                onChange={(event) => setStateName(event.target.value)}
                placeholder="e.g. Ogun"
              />
              <Button
                type="button"
                className="min-h-11 w-full"
                onClick={() => {
                  const result = addState(stateName);
                  if (!result.ok) {
                    setMessage(result.error);
                    return;
                  }
                  const slug = stateName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  setSelectedState(slug);
                  setStateName('');
                  setMessage(`Added ${stateName.trim()} with an All-of-state option.`);
                }}
              >
                Add state
              </Button>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Locations in {activeState?.name ?? '—'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              First option for vendors is the statewide cover (All of {activeState?.name ?? 'state'}
              ).
            </p>
          </div>

          <ul className="divide-y divide-border/60 rounded-2xl border border-border/60">
            {locations.map((location) => (
              <li
                key={location.slug}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
              >
                <div>
                  <p className="font-bold text-foreground">{location.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {location.slug}
                    {location.statewide ? ' · statewide' : ''}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    {!location.statewide ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => {
                          const next = window.prompt('Rename location', location.name);
                          if (!next) {
                            return;
                          }
                          const result = renameNode(location.slug, next);
                          setMessage(result.ok ? 'Location renamed.' : result.error);
                        }}
                      >
                        Rename
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 text-danger"
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Remove ${location.name} from ${activeState?.name ?? 'this state'}?`,
                        );
                        if (!confirmed) {
                          return;
                        }
                        const result = removeLocation(location.slug);
                        setMessage(result.ok ? `${location.name} removed.` : result.error);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
            {locations.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No locations yet for this state.
              </li>
            ) : null}
          </ul>

          {canEdit && activeState ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label="New location"
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                placeholder="e.g. Ikorodu"
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => {
                    const result = addLocation(activeState.slug, locationName);
                    if (!result.ok) {
                      setMessage(result.error);
                      return;
                    }
                    setLocationName('');
                    setMessage(`Added ${locationName.trim()} under ${activeState.name}.`);
                  }}
                >
                  Add location
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
