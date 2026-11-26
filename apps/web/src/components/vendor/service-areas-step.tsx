'use client';

import { useEffect, useMemo, useState } from 'react';
import { areaSlugsFromRows, isStatewideLocation, rowsFromAreaSlugs } from '@askalert/db';
import { Button, Select } from '@askalert/ui';
import { useServiceAreas } from '../../lib/vendor/use-service-areas';

type CoverageRow = {
  key: string;
  stateSlug: string;
  locationSlug: string;
};

function newRow(stateSlug = 'lagos'): CoverageRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stateSlug,
    locationSlug: '',
  };
}

function initialRows(
  areaSlugs: string[],
  fallbackState: string,
  maxServiceAreas: number,
): CoverageRow[] {
  const existing = rowsFromAreaSlugs(areaSlugs).slice(0, maxServiceAreas);
  if (existing.length === 0) {
    return [newRow(fallbackState)];
  }
  return existing.map((row, index) => ({
    key: `row-${row.locationSlug}-${index}`,
    ...row,
  }));
}

export function ServiceAreasStep({
  areaSlugs,
  maxServiceAreas,
  onChange,
}: {
  areaSlugs: string[];
  maxServiceAreas: number;
  onChange: (slugs: string[]) => void;
}) {
  const { states, locationsFor } = useServiceAreas();
  const defaultState = states[0]?.slug ?? 'lagos';
  const [rows, setRows] = useState<CoverageRow[]>(() =>
    initialRows(areaSlugs, defaultState, maxServiceAreas),
  );

  // Cap legacy drafts that still carry many old multi-select slugs.
  useEffect(() => {
    if (areaSlugs.length > maxServiceAreas) {
      onChange(areaSlugs.slice(0, maxServiceAreas));
    }
    // Only on mount / when plan cap changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxServiceAreas]);

  const commit = (next: CoverageRow[]) => {
    setRows(next);
    onChange(areaSlugsFromRows(next));
  };

  const filledCount = rows.filter((row) => row.locationSlug).length;
  const atCap = filledCount >= maxServiceAreas;
  const hasStatewide = rows.some((row) => isStatewideLocation(row.locationSlug));

  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!row.locationSlug) {
        continue;
      }
      counts.set(row.locationSlug, (counts.get(row.locationSlug) ?? 0) + 1);
    }
    const dupes = new Set<string>();
    for (const row of rows) {
      if (row.locationSlug && (counts.get(row.locationSlug) ?? 0) > 1) {
        dupes.add(row.key);
      }
    }
    return dupes;
  }, [rows]);

  const updateRow = (key: string, patch: Partial<CoverageRow>) => {
    commit(
      rows.map((row) => {
        if (row.key !== key) {
          return row;
        }
        const next = { ...row, ...patch };
        if (patch.stateSlug && patch.stateSlug !== row.stateSlug) {
          next.locationSlug = '';
        }
        return next;
      }),
    );
  };

  const addRow = () => {
    if (rows.length >= maxServiceAreas || hasStatewide) {
      return;
    }
    commit([...rows, newRow(defaultState)]);
  };

  const removeRow = (key: string) => {
    if (rows.length <= 1) {
      commit([newRow(defaultState)]);
      return;
    }
    commit(rows.filter((row) => row.key !== key));
  };

  const locationOptions = (stateSlug: string) => [
    { value: '', label: 'Select location' },
    ...locationsFor(stateSlug).map((loc) => ({
      value: loc.slug,
      label: loc.name,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick a state, then a location. Choose <span className="font-semibold">All of Lagos</span>{' '}
        if you cover the whole state.
      </p>
      <p className="text-xs font-semibold text-muted-foreground">
        {filledCount} of {maxServiceAreas} locations on your plan
        {atCap ? ' · limit reached' : ''}
      </p>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const isDuplicate = duplicateKeys.has(row.key);
          return (
            <div
              key={row.key}
              className="rounded-2xl border border-border/70 bg-card-muted/40 p-3 transition-all duration-300 ease-out"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Location {index + 1}
                </p>
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded-xl text-sm font-semibold text-danger"
                    onClick={() => removeRow(row.key)}
                    aria-label={`Remove location ${index + 1}`}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="State"
                  value={row.stateSlug}
                  options={states.map((state) => ({ value: state.slug, label: state.name }))}
                  onChange={(event) => updateRow(row.key, { stateSlug: event.target.value })}
                />
                <Select
                  label="Location"
                  value={row.locationSlug}
                  options={locationOptions(row.stateSlug)}
                  onChange={(event) => updateRow(row.key, { locationSlug: event.target.value })}
                />
              </div>
              {isDuplicate ? (
                <p className="mt-2 text-sm font-semibold text-danger" role="alert">
                  This location is already added. Choose another location.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="min-h-11 w-full sm:w-auto"
        disabled={rows.length >= maxServiceAreas || hasStatewide}
        onClick={addRow}
      >
        + Add another location
      </Button>
      {hasStatewide ? (
        <p className="text-xs text-muted-foreground">
          All of Lagos already covers every location in Lagos.
        </p>
      ) : null}
      {rows.length >= maxServiceAreas && !hasStatewide ? (
        <p className="text-xs text-muted-foreground">
          Free plans include {maxServiceAreas} locations. Upgrade later for more.
        </p>
      ) : null}
    </div>
  );
}
