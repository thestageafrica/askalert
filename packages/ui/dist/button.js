'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from './lib/cn';
const sizeClasses = {
    md: 'h-11 px-5 text-sm leading-none',
    lg: 'h-12 px-7 text-base leading-none sm:h-14 sm:px-8',
};
const variantClasses = {
    primary: cn('border border-orange-400/40 bg-gradient-to-r from-orange-500 to-orange-400 text-navy-900', 'shadow-[0_10px_28px_var(--glow-orange)]', 'hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--glow-orange-strong)] hover:brightness-[1.03]', 'active:translate-y-0 active:brightness-95'),
    secondary: cn('border border-navy-900/15 bg-surface text-navy-900', 'hover:-translate-y-0.5 hover:bg-surface-subtle', 'dark:border-surface/35 dark:bg-surface/10 dark:text-surface dark:hover:bg-surface/15'),
    ghost: cn('border border-transparent bg-transparent text-foreground', 'hover:bg-surface-subtle dark:hover:bg-navy-700/70'),
};
function buttonClassName({ className, variant = 'primary', size = 'md', disabled, }) {
    return cn('inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap', 'transition duration-200 ease-out', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2', 'focus-visible:ring-offset-background', disabled ? 'pointer-events-none cursor-not-allowed opacity-70' : null, sizeClasses[size], variantClasses[variant], className);
}
function LoadingSpinner({ variant }) {
    return (_jsx("span", { className: cn('inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-r-transparent', variant === 'primary'
            ? 'border-navy-900/25 border-t-navy-900'
            : 'border-current/25 border-t-current'), "aria-hidden": true }));
}
export function Button(props) {
    const { children, className, variant = 'primary', size = 'md', loading = false, loadingText, disabled, ...rest } = props;
    const isDisabled = Boolean(disabled || loading);
    const classes = buttonClassName({ className, variant, size, disabled: isDisabled });
    const content = loading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { variant: variant }), _jsx("span", { className: "opacity-90", children: loadingText ?? children })] })) : (children);
    if ('href' in props && props.href) {
        const { href, ...anchorProps } = rest;
        return (_jsx("a", { href: isDisabled ? undefined : href, "aria-disabled": isDisabled || undefined, "aria-busy": loading || undefined, className: classes, ...anchorProps, children: content }));
    }
    const buttonProps = rest;
    return (_jsx("button", { type: buttonProps.type ?? 'button', disabled: isDisabled, "aria-busy": loading || undefined, className: classes, ...buttonProps, children: content }));
}
//# sourceMappingURL=button.js.map