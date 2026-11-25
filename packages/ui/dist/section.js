import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from './lib/cn';
export function Section({ children, eyebrow, title, description, className, ...props }) {
    return (_jsxs("section", { className: cn('py-14 sm:py-20', className), ...props, children: [(eyebrow || title || description) && (_jsxs("header", { className: "mb-8 max-w-2xl sm:mb-10", children: [eyebrow ? (_jsx("p", { className: "mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-400", children: eyebrow })) : null, title ? (_jsx("h2", { className: "text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl", children: title })) : null, description ? (_jsx("p", { className: "mt-3 text-base text-muted-foreground sm:text-lg", children: description })) : null] })), children] }));
}
//# sourceMappingURL=section.js.map