'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useId, useMemo, useState, } from 'react';
import { cn } from './lib/cn';
const TabsContext = createContext(null);
function useTabsContext() {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('Tabs components must be used within Tabs');
    }
    return context;
}
export function Tabs({ children, defaultValue, value: controlledValue, onValueChange, className, }) {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const value = controlledValue ?? uncontrolled;
    const baseId = useId();
    const setValue = useCallback((next) => {
        if (controlledValue === undefined) {
            setUncontrolled(next);
        }
        onValueChange?.(next);
    }, [controlledValue, onValueChange]);
    const context = useMemo(() => ({ value, setValue, baseId }), [value, setValue, baseId]);
    return (_jsx(TabsContext.Provider, { value: context, children: _jsx("div", { className: cn('flex w-full flex-col gap-4', className), children: children }) }));
}
export function TabsList({ className, ...props }) {
    return (_jsx("div", { role: "tablist", className: cn('inline-flex flex-wrap gap-2 rounded-full border border-border bg-card-muted p-1', className), ...props }));
}
export function TabsTrigger({ value, className, children, ...props }) {
    const { value: active, setValue, baseId } = useTabsContext();
    const selected = active === value;
    return (_jsx("button", { type: "button", role: "tab", id: `${baseId}-tab-${value}`, "aria-selected": selected, "aria-controls": `${baseId}-panel-${value}`, tabIndex: selected ? 0 : -1, className: cn('min-h-11 rounded-full px-4 text-sm font-semibold transition', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'focus-visible:ring-offset-background', selected
            ? 'bg-orange-500 text-navy-900 shadow-[var(--shadow-orange-glow)]'
            : 'text-muted-foreground hover:text-foreground', className), onClick: () => setValue(value), ...props, children: children }));
}
export function TabsContent({ value, className, children, ...props }) {
    const { value: active, baseId } = useTabsContext();
    if (active !== value) {
        return null;
    }
    return (_jsx("div", { role: "tabpanel", id: `${baseId}-panel-${value}`, "aria-labelledby": `${baseId}-tab-${value}`, className: cn('outline-none', className), ...props, children: children }));
}
//# sourceMappingURL=tabs.js.map