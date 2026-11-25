'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from './lib/cn';
export const Slider = forwardRef(function Slider({ className, label, valueLabel, id, ...props }, ref) {
    const sliderId = id ?? props.name;
    return (_jsxs("label", { className: "flex w-full flex-col gap-2 text-sm text-foreground", children: [label || valueLabel ? (_jsxs("span", { className: "flex items-center justify-between gap-3 font-medium", children: [_jsx("span", { children: label }), valueLabel ? _jsx("span", { className: "text-muted-foreground", children: valueLabel }) : null] })) : null, _jsx("input", { ref: ref, id: sliderId, type: "range", className: cn('h-11 w-full cursor-pointer appearance-none bg-transparent', '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full', '[&::-webkit-slider-runnable-track]:bg-border', '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5', '[&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:rounded-full', '[&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-[var(--shadow-orange-glow)]', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'focus-visible:ring-offset-background', className), ...props })] }));
});
//# sourceMappingURL=slider.js.map