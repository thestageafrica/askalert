import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from './lib/cn';
const widths = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
};
export function Container({ children, className, width = 'lg', ...props }) {
    return (_jsx("div", { className: cn('mx-auto w-full px-4 sm:px-6', widths[width], className), ...props, children: children }));
}
//# sourceMappingURL=container.js.map