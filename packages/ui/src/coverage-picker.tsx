'use client';

import { useMemo, useState } from 'react';
import {
  applyStatewideChoice,
  createEmptyCoverageRow,
  filledLocationCount,
  hasStatewideForState,
  isDuplicateLocation,
  listLocationsForState,
  listStates,
  locationSlugsFromRows,
  selectedStateSlugs,
  validateCoverageRows,
  type CoveragePlanCaps,
  type CoverageRow,
  type GeoNode,
} from '@askalert/geo';
import { Button } from './button';
import { cn } from './lib/cn';
import { Select } from './select';

export type CoveragePickerProps = {
  nodes: readonly GeoNode[];
  caps: CoveragePlanCaps;
  /** Controlled location slugs; picker itself starts with one empty row. */
  value?: string[];
  onChange: (locationSlugs: string[]) => void;
  className?: string;
  /** When true, mount with a single empty row and ignore draft prefill. */
  startEmpty?: boolean;
};

function buildInitialRows(
  nodes: readonly GeoNode[],
  startEmpty: boolean,
  value: string[] | undefined,
): CoverageRow[] {
  const defaultState = listStates(nodes)[0]?.slug ?? 'lagos';
  if (startEmpty || !value || value.length === 0) {
    return [createEmptyCoverageRow(defaultState)];
  }
  // Editing mode (My Services later) can hydrate; onboarding uses startEmpty.
  return value.slice(0, 1).map((slug, index) => ({
    key: `hydrated-${slug}-${index}`,
    stateSlug: defaultState,
    locationSlug: slug,
  }));
}

export function CoveragePicker({
  nodes,
  caps,
  value,
  onChange,
  className,
  startEmpty = true,
}: CoveragePickerProps) {
  const states = useMemo(() => listStates(nodes), [nodes]);
  const defaultState = states[0]?.slug ?? 'lagos';
  const [rows, setRows] = useState<CoverageRow[]>(() =>
    buildInitialRows(nodes, startEmpty, value),
  );
  const [pendingStatewide, setPendingStatewide] = useState<{
    rowKey: string;
    stateSlug: string;
    statewideSlug: string;
    stateName: string;
  } | null>(null);

  const validation = useMemo(
    () => validateCoverageRows(rows, caps, nodes),
    [caps, nodes, rows],
  );

  const filled = filledLocationCount(rows);
  const atCap = filled >= caps.maxCoverageLocations || rows.length >= caps.maxCoverageLocations;
  const stateCount = selectedStateSlugs(rows).length;

  const commit = (next: CoverageRow[]) => {
    setRows(next);
    onChange(locationSlugsFromRows(next));
  };

  const locationOptions = (stateSlug: string) => {
    const includeStatewide = caps.allowStatewide;
    const locations = listLocationsForState(stateSlug, nodes, { includeStatewide });
    return [
      { value: '', label: 'Select location' },
      ...locations.map((node) => ({
        value: node.slug,
        label: node.isStatewide ? node.name : node.name,
      })),
    ];
  };

  const updateRow = (key: string, patch: Partial<CoverageRow>) => {
    const current = rows.find((row) => row.key === key);
    if (!current) {
      return;
    }

    if (patch.locationSlug) {
      const locations = listLocationsForState(patch.stateSlug ?? current.stateSlug, nodes, {
        includeStatewide: true,
      });
      const selected = locations.find((node) => node.slug === patch.locationSlug);
      if (selected?.isStatewide) {
        if (!caps.allowStatewide) {
          return;
        }
        const stateSlug = patch.stateSlug ?? current.stateSlug;
        const others = rows.filter(
          (row) => row.key !== key && row.stateSlug === stateSlug && row.locationSlug,
        );
        if (others.length > 0) {
          setPendingStatewide({
            rowKey: key,
            stateSlug,
            statewideSlug: selected.slug,
            stateName: states.find((state) => state.slug === stateSlug)?.name ?? stateSlug,
          });
          return;
        }
      }
    }

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
    if (atCap) {
      return;
    }
    if (stateCount >= caps.maxStates) {
      // Still allow another location in an already-selected state.
      const onlyStatewideStates = states.every((state) =>
        hasStatewideForState(rows, state.slug, nodes),
      );
      if (onlyStatewideStates && states.length > 0) {
        return;
      }
    }
    commit([...rows, createEmptyCoverageRow(defaultState)]);
  };

  const removeRow = (key: string) => {
    if (rows.length <= 1) {
      commit([createEmptyCoverageRow(defaultState)]);
      return;
    }
    commit(rows.filter((row) => row.key !== key));
  };

  const confirmStatewide = () => {
    if (!pendingStatewide) {
      return;
    }
    commit(
      applyStatewideChoice(
        rows,
        pendingStatewide.rowKey,
        pendingStatewide.statewideSlug,
        pendingStatewide.stateSlug,
      ),
    );
    setPendingStatewide(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            State on the left, location on the right. Same location list in every row.
          </p>
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          {filled} of {caps.maxCoverageLocations} locations
          {caps.allowStatewide ? ' · statewide allowed' : ' · no statewide'}
          {' · '}
          {stateCount}/{caps.maxStates} states
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const duplicate = isDuplicateLocation(row.locationSlug, rows, row.key);
          const statewideLocked =
            Boolean(row.stateSlug) &&
            hasStatewideForState(rows, row.stateSlug, nodes) &&
            !row.locationSlug.endsWith('-all');

          return (
            <div
              key={row.key}
              className="rounded-[1.35rem] border border-border bg-card p-3 shadow-sm sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Location {index + 1}
                </p>
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded-xl px-2 text-sm font-semibold text-danger"
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
                  options={states.map((state) => ({
                    value: state.slug,
                    label: state.name,
                  }))}
                  onChange={(event) => updateRow(row.key, { stateSlug: event.target.value })}
                />
                <Select
                  label="Location"
                  value={row.locationSlug}
                  options={locationOptions(row.stateSlug)}
                  disabled={statewideLocked}
                  onChange={(event) =>
                    updateRow(row.key, { locationSlug: event.target.value })
                  }
                />
              </div>

              {duplicate ? (
                <p className="mt-2 text-sm font-semibold text-danger" role="alert">
                  This location is already added. Choose another location.
                </p>
              ) : null}
              {statewideLocked ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  This state is already covered statewide.
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
        disabled={atCap}
        onClick={addRow}
      >
        + Add another location
      </Button>

      {!validation.ok && validation.errors.length > 0 ? (
        <ul className="space-y-1 rounded-2xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {pendingStatewide ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="statewide-confirm-title"
        >
          <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card p-5 shadow-lg">
            <h3 id="statewide-confirm-title" className="text-lg font-extrabold text-foreground">
              Cover all of {pendingStatewide.stateName}?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This clears other locations you added for {pendingStatewide.stateName} and counts as
              one location on your plan.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={() => setPendingStatewide(null)}
              >
                Cancel
              </Button>
              <Button type="button" className="min-h-11" onClick={confirmStatewide}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
