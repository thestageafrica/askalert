'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from './lib/cn';
export const Select = forwardRef(function Select({ className, label, options, hint, id, ...props }, ref) {
    const selectId = id ?? props.name;
    return (_jsxs("label", { className: "flex w-full flex-col gap-1.5 text-sm text-foreground", children: [label ? _jsx("span", { className: "font-medium", children: label }) : null, _jsx("select", { ref: ref, id: selectId, className: cn('min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-navy-900', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'focus-visible:ring-offset-background', 'disabled:cursor-not-allowed disabled:opacity-60', 'dark:bg-navy-900 dark:text-surface', className), ...props, children: options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), hint ? _jsx("span", { className: "text-muted-foreground", children: hint }) : null] }));
});
//# sourceMappingURL=select.js.map