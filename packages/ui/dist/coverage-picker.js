'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { applyStatewideChoice, createEmptyCoverageRow, filledLocationCount, hasStatewideForState, isDuplicateLocation, listLocationsForState, listStates, locationSlugsFromRows, selectedStateSlugs, validateCoverageRows, } from '@askalert/geo';
import { Button } from './button';
import { cn } from './lib/cn';
import { Select } from './select';
function buildInitialRows(nodes, startEmpty, value) {
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
export function CoveragePicker({ nodes, caps, value, onChange, className, startEmpty = true, }) {
    const states = useMemo(() => listStates(nodes), [nodes]);
    const defaultState = states[0]?.slug ?? 'lagos';
    const [rows, setRows] = useState(() => buildInitialRows(nodes, startEmpty, value));
    const [pendingStatewide, setPendingStatewide] = useState(null);
    const validation = useMemo(() => validateCoverageRows(rows, caps, nodes), [caps, nodes, rows]);
    const filled = filledLocationCount(rows);
    const atCap = filled >= caps.maxCoverageLocations || rows.length >= caps.maxCoverageLocations;
    const stateCount = selectedStateSlugs(rows).length;
    const commit = (next) => {
        setRows(next);
        onChange(locationSlugsFromRows(next));
    };
    const locationOptions = (stateSlug) => {
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
    const updateRow = (key, patch) => {
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
                const others = rows.filter((row) => row.key !== key && row.stateSlug === stateSlug && row.locationSlug);
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
        commit(rows.map((row) => {
            if (row.key !== key) {
                return row;
            }
            const next = { ...row, ...patch };
            if (patch.stateSlug && patch.stateSlug !== row.stateSlug) {
                next.locationSlug = '';
            }
            return next;
        }));
    };
    const addRow = () => {
        if (atCap) {
            return;
        }
        if (stateCount >= caps.maxStates) {
            // Still allow another location in an already-selected state.
            const onlyStatewideStates = states.every((state) => hasStatewideForState(rows, state.slug, nodes));
            if (onlyStatewideStates && states.length > 0) {
                return;
            }
        }
        commit([...rows, createEmptyCoverageRow(defaultState)]);
    };
    const removeRow = (key) => {
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
        commit(applyStatewideChoice(rows, pendingStatewide.rowKey, pendingStatewide.statewideSlug, pendingStatewide.stateSlug));
        setPendingStatewide(null);
    };
    return (_jsxs("div", { className: cn('space-y-4', className), children: [_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", children: [_jsx("div", { children: _jsx("p", { className: "text-sm text-muted-foreground", children: "State on the left, location on the right. Same location list in every row." }) }), _jsxs("p", { className: "text-xs font-semibold text-muted-foreground", children: [filled, " of ", caps.maxCoverageLocations, " locations", caps.allowStatewide ? ' · statewide allowed' : ' · no statewide', ' · ', stateCount, "/", caps.maxStates, " states"] })] }), _jsx("div", { className: "space-y-3", children: rows.map((row, index) => {
                    const duplicate = isDuplicateLocation(row.locationSlug, rows, row.key);
                    const statewideLocked = Boolean(row.stateSlug) &&
                        hasStatewideForState(rows, row.stateSlug, nodes) &&
                        !row.locationSlug.endsWith('-all');
                    return (_jsxs("div", { className: "rounded-[1.35rem] border border-border bg-card p-3 shadow-sm sm:p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between gap-2", children: [_jsxs("p", { className: "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground", children: ["Location ", index + 1] }), rows.length > 1 ? (_jsx("button", { type: "button", className: "min-h-11 min-w-11 rounded-xl px-2 text-sm font-semibold text-danger", onClick: () => removeRow(row.key), "aria-label": `Remove location ${index + 1}`, children: "Remove" })) : null] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(Select, { label: "State", value: row.stateSlug, options: states.map((state) => ({
                                            value: state.slug,
                                            label: state.name,
                                        })), onChange: (event) => updateRow(row.key, { stateSlug: event.target.value }) }), _jsx(Select, { label: "Location", value: row.locationSlug, options: locationOptions(row.stateSlug), disabled: statewideLocked, onChange: (event) => updateRow(row.key, { locationSlug: event.target.value }) })] }), duplicate ? (_jsx("p", { className: "mt-2 text-sm font-semibold text-danger", role: "alert", children: "This location is already added. Choose another location." })) : null, statewideLocked ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "This state is already covered statewide." })) : null] }, row.key));
                }) }), _jsx(Button, { type: "button", variant: "secondary", className: "min-h-11 w-full sm:w-auto", disabled: atCap, onClick: addRow, children: "+ Add another location" }), !validation.ok && validation.errors.length > 0 ? (_jsx("ul", { className: "space-y-1 rounded-2xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger", children: validation.errors.map((error) => (_jsx("li", { children: error }, error))) })) : null, pendingStatewide ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 sm:items-center", role: "dialog", "aria-modal": "true", "aria-labelledby": "statewide-confirm-title", children: _jsxs("div", { className: "w-full max-w-md rounded-[1.5rem] border border-border bg-card p-5 shadow-lg", children: [_jsxs("h3", { id: "statewide-confirm-title", className: "text-lg font-extrabold text-foreground", children: ["Cover all of ", pendingStatewide.stateName, "?"] }), _jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: ["This clears other locations you added for ", pendingStatewide.stateName, " and counts as one location on your plan."] }), _jsxs("div", { className: "mt-5 grid grid-cols-2 gap-2", children: [_jsx(Button, { type: "button", variant: "secondary", className: "min-h-11", onClick: () => setPendingStatewide(null), children: "Cancel" }), _jsx(Button, { type: "button", className: "min-h-11", onClick: confirmStatewide, children: "Confirm" })] })] }) })) : null] }));
}
//# sourceMappingURL=coverage-picker.js.map