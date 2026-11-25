'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { cn } from './lib/cn';
export function Sheet({ open, onOpenChange, title, children, className }) {
    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onOpenChange]);
    if (!open) {
        return null;
    }
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center", children: [_jsx("button", { type: "button", "aria-label": "Close sheet", className: "absolute inset-0 bg-navy-950/50", onClick: () => onOpenChange(false) }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": title, className: cn('relative z-10 w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 shadow-xl', 'sm:rounded-2xl', 'max-h-[85vh] overflow-y-auto', className), children: [_jsxs("div", { className: "mb-4 flex items-start justify-between gap-3", children: [_jsx("h2", { className: "text-lg font-bold text-foreground", children: title }), _jsx("button", { type: "button", className: cn('inline-flex min-h-11 min-w-11 items-center justify-center rounded-full', 'text-muted-foreground hover:bg-card-muted hover:text-foreground', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'), onClick: () => onOpenChange(false), children: "Close" })] }), children] })] }));
}
//# sourceMappingURL=sheet.js.map