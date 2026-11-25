'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useId } from 'react';
import { cn } from './lib/cn';
export const Input = forwardRef(function Input({ className, label, hint, error, id, name, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? name ?? generatedId;
    const inputName = name ?? inputId;
    return (_jsxs("label", { className: "flex w-full flex-col gap-1.5 text-sm text-foreground", htmlFor: inputId, children: [label ? _jsx("span", { className: "font-medium", children: label }) : null, _jsx("input", { ref: ref, id: inputId, name: inputName, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined, className: cn('min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-navy-900', 'placeholder:text-navy-700/50', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'focus-visible:ring-offset-background', 'disabled:cursor-not-allowed disabled:opacity-60', 'dark:bg-navy-900 dark:text-surface dark:placeholder:text-surface/40', error ? 'border-danger' : null, className), ...props }), error ? (_jsx("span", { id: `${inputId}-error`, className: "text-danger", children: error })) : hint ? (_jsx("span", { id: `${inputId}-hint`, className: "text-muted-foreground", children: hint })) : null] }));
});
//# sourceMappingURL=input.js.map