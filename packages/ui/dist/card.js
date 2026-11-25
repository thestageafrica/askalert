import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from './lib/cn';
export function Card({ children, className, ...props }) {
    return (_jsx("div", { className: cn('rounded-2xl border border-border/80 bg-card p-5 text-foreground shadow-sm shadow-navy-950/5', 'transition duration-200 hover:border-border hover:shadow-md hover:shadow-navy-950/8', 'dark:bg-navy-900 dark:shadow-navy-950/30', className), ...props, children: children }));
}
//# sourceMappingURL=card.js.map