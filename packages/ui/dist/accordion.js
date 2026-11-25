'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { cn } from './lib/cn';
export function Accordion({ items, className, allowMultiple = false }) {
    const baseId = useId();
    const [openIds, setOpenIds] = useState([]);
    const toggle = (id) => {
        setOpenIds((current) => {
            const isOpen = current.includes(id);
            if (allowMultiple) {
                return isOpen ? current.filter((item) => item !== id) : [...current, id];
            }
            return isOpen ? [] : [id];
        });
    };
    return (_jsx("div", { className: cn('flex w-full flex-col gap-3', className), children: items.map((item) => {
            const open = openIds.includes(item.id);
            const panelId = `${baseId}-panel-${item.id}`;
            const buttonId = `${baseId}-button-${item.id}`;
            return (_jsxs("div", { className: cn('overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm', 'transition hover:border-border'), children: [_jsx("h3", { children: _jsxs("button", { type: "button", id: buttonId, "aria-expanded": open, "aria-controls": panelId, className: cn('flex min-h-12 w-full items-center justify-between gap-3 px-5 py-4 text-left', 'text-base font-bold text-foreground', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'), onClick: () => toggle(item.id), children: [_jsx("span", { children: item.title }), _jsx("span", { "aria-hidden": true, className: cn('inline-flex size-8 items-center justify-center rounded-full bg-surface-subtle text-sm text-muted-foreground', 'dark:bg-navy-700'), children: open ? '−' : '+' })] }) }), open ? (_jsx("div", { id: panelId, role: "region", "aria-labelledby": buttonId, className: "px-5 pb-5", children: _jsx("div", { className: "text-sm leading-relaxed text-muted-foreground", children: item.content }) })) : null] }, item.id));
        }) }));
}
//# sourceMappingURL=accordion.js.map