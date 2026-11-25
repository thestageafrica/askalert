'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useState, } from 'react';
import { cn } from './lib/cn';
const ToastContext = createContext(null);
const toneClasses = {
    default: 'border-border bg-card text-foreground',
    success: 'border-success/40 bg-card text-foreground',
    warning: 'border-warning/50 bg-card text-foreground',
    danger: 'border-danger/40 bg-card text-foreground',
};
export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const dismiss = useCallback((id) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);
    const toast = useCallback((input) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const item = {
            id,
            tone: 'default',
            durationMs: 3500,
            ...input,
        };
        setItems((current) => [...current, item]);
        window.setTimeout(() => dismiss(id), item.durationMs);
    }, [dismiss]);
    const value = useMemo(() => ({ toast }), [toast]);
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, _jsx("div", { className: "pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4", "aria-live": "polite", children: items.map((item) => (_jsxs("div", { className: cn('pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 shadow-lg', toneClasses[item.tone ?? 'default']), role: "status", children: [_jsx("p", { className: "font-semibold", children: item.title }), item.description ? (_jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: item.description })) : null] }, item.id))) })] }));
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
//# sourceMappingURL=toast.js.map