import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from './lib/cn';
export function Chip({ children, statusDot = false, className, ...props }) {
    return (_jsxs("span", { className: cn('inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5', 'text-sm font-medium text-foreground backdrop-blur-md', className), ...props, children: [statusDot ? (_jsxs("span", { className: "relative flex size-2.5", "aria-hidden": true, children: [_jsx("span", { className: "absolute inline-flex size-full rounded-full bg-success opacity-40 motion-safe:animate-ping" }), _jsx("span", { className: "relative inline-flex size-2.5 rounded-full bg-success" })] })) : null, children] }));
}
//# sourceMappingURL=chip.js.map