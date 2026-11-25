import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from './lib/cn';
const labels = {
    verified: 'Verified',
    protected: 'Protected by AskAlert',
    'direct-payment': 'Direct payment',
};
const styles = {
    verified: 'bg-success/15 text-navy-900 dark:text-surface',
    protected: 'bg-navy-700 text-surface',
    'direct-payment': 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
};
export function Badge({ variant, className, ...props }) {
    return (_jsx("span", { className: cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide', styles[variant], className), ...props, children: labels[variant] }));
}
//# sourceMappingURL=badge.js.map