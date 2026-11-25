import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from './lib/cn';
export function Skeleton({ className, ...props }) {
    return (_jsx("div", { "aria-hidden": true, className: cn('animate-pulse rounded-xl bg-card-muted', className), ...props }));
}
//# sourceMappingURL=skeleton.js.map