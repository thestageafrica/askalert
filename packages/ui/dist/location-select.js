'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { listLocationsForState, listStates, matchGeoAlias, } from '@askalert/geo';
import { cn } from './lib/cn';
import { Input } from './input';
import { Select } from './select';
export function LocationSelect({ nodes, value, onChange, locationRule = 'specific', className, disabled, stateLabel = 'State', locationLabel = 'Location', }) {
    const [query, setQuery] = useState('');
    const states = useMemo(() => listStates(nodes), [nodes]);
    const includeStatewide = locationRule === 'state';
    const locations = useMemo(() => {
        if (!value.stateSlug) {
            return [];
        }
        return listLocationsForState(value.stateSlug, nodes, { includeStatewide });
    }, [includeStatewide, nodes, value.stateSlug]);
    const filtered = useMemo(() => {
        if (query.trim().length < 1) {
            return locations;
        }
        const hits = matchGeoAlias(query, locations, { limit: 20 });
        const hitIds = new Set(hits.map((hit) => hit.node.id));
        return locations.filter((node) => hitIds.has(node.id));
    }, [locations, query]);
    if (locationRule === 'none') {
        return (_jsx("p", { className: "rounded-2xl border border-dashed border-border bg-surface-subtle px-4 py-3 text-sm text-muted-foreground", children: "This category does not need a location." }));
    }
    return (_jsxs("div", { className: cn('space-y-3', className), children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(Select, { label: stateLabel, disabled: disabled, value: value.stateSlug, options: [
                            { value: '', label: 'Select state' },
                            ...states.map((state) => ({ value: state.slug, label: state.name })),
                        ], onChange: (event) => onChange({ stateSlug: event.target.value, locationSlug: '' }) }), _jsx(Input, { label: `Search ${locationLabel.toLowerCase()}`, value: query, disabled: disabled || !value.stateSlug, placeholder: "VI, Lekki Ph1\u2026", onChange: (event) => setQuery(event.target.value) })] }), _jsxs("div", { children: [_jsx("p", { className: "mb-1.5 text-sm font-medium text-foreground", children: locationLabel }), _jsx("div", { className: "max-h-56 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 sm:max-h-72", role: "listbox", "aria-label": locationLabel, children: !value.stateSlug ? (_jsx("p", { className: "px-3 py-4 text-sm text-muted-foreground", children: "Pick a state first." })) : filtered.length === 0 ? (_jsx("p", { className: "px-3 py-4 text-sm text-muted-foreground", children: "No locations match." })) : (filtered.map((node) => {
                            const active = value.locationSlug === node.slug;
                            return (_jsxs("button", { type: "button", role: "option", "aria-selected": active, disabled: disabled, onClick: () => onChange({ stateSlug: value.stateSlug, locationSlug: node.slug }), className: cn('flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold transition', active
                                    ? 'bg-orange-500 text-navy-900'
                                    : 'text-foreground hover:bg-surface-subtle'), children: [_jsx("span", { children: node.name }), node.isStatewide ? (_jsx("span", { className: cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', active ? 'bg-navy-950 text-orange-400' : 'bg-navy-950 text-orange-400'), children: "Statewide" })) : null] }, node.id));
                        })) })] })] }));
}
//# sourceMappingURL=location-select.js.map