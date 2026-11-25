'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { cn } from './lib/cn';
/** Color wordmark for light surfaces (navy + orange). */
const DEFAULT_SOURCES = [
    '/brand/askalert-logo-1.png',
    '/brand/AskAlert%20-Logo-1.png',
    '/brand/askalert-logo-color.png',
];
/** Light/white wordmark for dark surfaces. */
const REVERSED_SOURCES = [
    '/brand/askalert-logo-reversed.png',
    '/brand/askalert-logo-all-white.png',
];
function Wordmark({ className, onDark = false }) {
    return (_jsxs("span", { className: cn('text-lg font-extrabold tracking-tight', onDark ? 'text-surface' : 'text-navy-900', className), children: ["Ask", _jsx("span", { className: "text-orange-500", children: "Alert" })] }));
}
export function Logo({ variant = 'default', alt = 'AskAlert', className, ...props }) {
    const [defaultIndex, setDefaultIndex] = useState(0);
    const [reversedIndex, setReversedIndex] = useState(0);
    const wantsReversed = variant === 'reversed';
    const defaultExhausted = !wantsReversed && defaultIndex >= DEFAULT_SOURCES.length;
    const reversedExhausted = wantsReversed && reversedIndex >= REVERSED_SOURCES.length;
    if (defaultExhausted) {
        return _jsx(Wordmark, { className: className });
    }
    if (reversedExhausted) {
        return _jsx(Wordmark, { className: className, onDark: true });
    }
    const src = wantsReversed ? REVERSED_SOURCES[reversedIndex] : DEFAULT_SOURCES[defaultIndex];
    return (_jsx("img", { src: src, alt: alt, width: 160, height: 32, decoding: "async", className: cn('h-8 w-auto', className), onError: () => {
            if (wantsReversed) {
                setReversedIndex((current) => current + 1);
                return;
            }
            setDefaultIndex((current) => current + 1);
        }, ...props }));
}
//# sourceMappingURL=logo.js.map