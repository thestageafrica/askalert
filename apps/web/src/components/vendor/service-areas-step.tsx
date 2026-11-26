'use client';

import { useMemo, useState } from 'react';
import {
  areaSlugsFromRows,
  isStatewideLocation,
  listSeedLocationsForState,
  listSeedStates,
  rowsFromAreaSlugs,
  statewideSlugForState,
} from '@askalert/db';
import { Button, Select } from '@askalert/ui';

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

function rowsFromSlugs(areaSlugs: string[], fallbackState: string): CoverageRow[] {
  const existing = rowsFromAreaSlugs(areaSlugs);
  if (existing.length === 0) {
    return [newRow(fallbackState)];
  }
  return existing.map((row) => ({
    key: `row-${row.locationSlug}`,
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
  const states = useMemo(() => listSeedStates(), []);
  const defaultState = states[0]?.slug ?? 'lagos';
  const [rows, setRows] = useState<CoverageRow[]>(() => rowsFromSlugs(areaSlugs, defaultState));

  const commit = (next: CoverageRow[]) => {
    setRows(next);
    onChange(areaSlugsFromRows(next));
  };

  const filledCount = rows.filter((row) => row.locationSlug).length;
  const atCap = filledCount >= maxServiceAreas;
  const hasStatewide = rows.some((row) => isStatewideLocation(row.locationSlug));

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
    if (atCap || hasStatewide) {
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

  const locationOptionsFor = (row: CoverageRow) => {
    const locations = listSeedLocationsForState(row.stateSlug);
    const selectedElsewhere = new Set(
      rows
        .filter((item) => item.key !== row.key && item.locationSlug)
        .map((item) => item.locationSlug),
    );
    const statewideTaken = selectedElsewhere.has(statewideSlugForState(row.stateSlug));
    return [
      { value: '', label: 'Select location' },
      ...locations
        .filter((loc) => {
          if (statewideTaken && !loc.statewide) {
            return false;
          }
          if (selectedElsewhere.has(loc.slug)) {
            return false;
          }
          if (
            loc.statewide &&
            rows.some(
              (item) =>
                item.key !== row.key &&
                item.stateSlug === row.stateSlug &&
                item.locationSlug &&
                !isStatewideLocation(item.locationSlug),
            )
          ) {
            return false;
          }
          return true;
        })
        .map((loc) => ({ value: loc.slug, label: loc.name })),
    ];
  };

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
        {rows.map((row, index) => (
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
                options={locationOptionsFor(row)}
                onChange={(event) => updateRow(row.key, { locationSlug: event.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="min-h-11 w-full sm:w-auto"
        disabled={atCap || hasStatewide}
        onClick={addRow}
      >
        + Add another location
      </Button>
      {hasStatewide ? (
        <p className="text-xs text-muted-foreground">
          All of Lagos already covers every location in Lagos.
        </p>
      ) : null}
      {atCap && !hasStatewide ? (
        <p className="text-xs text-muted-foreground">
          Free plans include {maxServiceAreas} locations. Upgrade later for more.
        </p>
      ) : null}
    </div>
  );
}
