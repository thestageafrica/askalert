'use client';

import { useState } from 'react';
import { Button, Input, cn, useToast } from '@askalert/ui';
import { useAreasAdmin } from '../../lib/areas-admin-store';
import { useAdminStore } from '../../lib/admin-store';
import { confirmReseed } from '../../lib/confirm-reseed';
import { canEditCategories } from '../../lib/roles';

export function AreasManagerPanel() {
  const { role } = useAdminStore();
  const canEdit = canEditCategories(role);
  const { toast } = useToast();
  const {
    ready,
    states,
    locationsFor,
    addState,
    addLocation,
    renameNode,
    removeLocation,
    publishToServer,
    resetToSeed,
    syncError,
    lastSyncedAt,
  } = useAreasAdmin();
  const [selectedState, setSelectedState] = useState('lagos');
  const [stateName, setStateName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  if (!ready) {
    return (
      <div
        className="h-24 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading areas manager"
      />
    );
  }

  const activeState = states.find((state) => state.slug === selectedState) ?? states[0];
  const locations = activeState ? locationsFor(activeState.slug) : [];

  return (
    <section className="rounded-[1.5rem] border border-border bg-card shadow-sm">
      <button
        type="button"
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">
            Live sync
          </p>
          <h2 className="mt-1 text-lg font-extrabold">Manage areas on the server</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit states and locations that vendor onboarding reads from Supabase.
          </p>
        </div>
        <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border px-5 py-5">
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void publishToServer().then((result) => {
                    setBusy(false);
                    if (result.ok) {
                      setMessage('Synced all states and locations to the server.');
                      toast({
                        title: 'Saved to server',
                        description: 'Areas catalogue is live for vendor onboarding.',
                        tone: 'success',
                      });
                      return;
                    }
                    setMessage(result.error);
                    toast({ title: 'Sync failed', description: result.error, tone: 'danger' });
                  });
                }}
              >
                Sync to server
              </Button>
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={busy}
                onClick={() => {
                  if (!confirmReseed('areas to the Lagos seed catalogue')) {
                    toast({
                      title: 'Reset cancelled',
                      description: 'Areas were left unchanged.',
                    });
                    return;
                  }
                  resetToSeed();
                  setSelectedState('lagos');
                  setBusy(true);
                  void publishToServer().then((result) => {
                    setBusy(false);
                    if (result.ok) {
                      setMessage('Reset to Lagos seed and saved to the server.');
                      toast({
                        title: 'Reset and saved',
                        description: 'Lagos seed areas are now on the server.',
                        tone: 'success',
                      });
                      return;
                    }
                    setMessage(`Reset locally, but server sync failed: ${result.error}.`);
                    toast({
                      title: 'Reset locally only',
                      description: result.error,
                      tone: 'warning',
                    });
                  });
                }}
              >
                Reset to seed
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-orange-700">
              View only for your role. Switch to Super admin or Operations to edit.
            </p>
          )}

          {syncError ? (
            <p className="rounded-2xl border border-danger/40 bg-danger/15 px-3 py-2 text-sm font-medium">
              {syncError}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium">
              {message}
            </p>
          ) : null}
          {lastSyncedAt && !syncError ? (
            <p className="text-xs text-muted-foreground">
              Last server sync: {new Date(lastSyncedAt).toLocaleString()}
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
            <div className="space-y-3 rounded-2xl border border-border/70 bg-surface-subtle/40 p-3">
              <h3 className="text-sm font-bold">States</h3>
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
                        'min-h-11 w-full rounded-2xl border px-3 py-2.5 text-left text-sm transition',
                        state.slug === activeState?.slug
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border bg-card hover:border-orange-500/40',
                      )}
                    >
                      <p className="font-extrabold">{state.name}</p>
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
                    disabled={busy}
                    onClick={() => {
                      const label = stateName.trim();
                      setBusy(true);
                      void addState(stateName).then((result) => {
                        setBusy(false);
                        if (!result.ok) {
                          setMessage(result.error);
                          return;
                        }
                        const slug = label
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setSelectedState(slug);
                        setStateName('');
                        setMessage(`Added ${label} and synced to the server.`);
                      });
                    }}
                  >
                    Add state
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-surface-subtle/40 p-3 sm:p-4">
              <div>
                <h3 className="text-sm font-bold">
                  Locations in {activeState?.name ?? '—'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  First option for vendors is All of {activeState?.name ?? 'state'}.
                </p>
              </div>

              <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
                {locations.map((location) => (
                  <li
                    key={location.slug}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                  >
                    <div>
                      <p className="font-bold">{location.name}</p>
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
                            disabled={busy}
                            onClick={() => {
                              const next = window.prompt('Rename location', location.name);
                              if (!next) return;
                              setBusy(true);
                              void renameNode(location.slug, next).then((result) => {
                                setBusy(false);
                                setMessage(
                                  result.ok ? 'Location renamed and synced.' : result.error,
                                );
                              });
                            }}
                          >
                            Rename
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-11 text-danger"
                          disabled={busy}
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Remove ${location.name} from ${activeState?.name ?? 'this state'}?`,
                            );
                            if (!confirmed) return;
                            setBusy(true);
                            void removeLocation(location.slug).then((result) => {
                              setBusy(false);
                              setMessage(
                                result.ok
                                  ? `${location.name} removed and synced.`
                                  : result.error,
                              );
                            });
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
                      disabled={busy}
                      onClick={() => {
                        const label = locationName.trim();
                        setBusy(true);
                        void addLocation(activeState.slug, locationName).then((result) => {
                          setBusy(false);
                          if (!result.ok) {
                            setMessage(result.error);
                            return;
                          }
                          setLocationName('');
                          setMessage(`Added ${label} under ${activeState.name} and synced.`);
                        });
                      }}
                    >
                      Add location
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
