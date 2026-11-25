import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';
type SharedProps = {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    /** Shown next to the spinner while loading. Defaults to the children. */
    loadingText?: string;
    className?: string;
};
export type ButtonAsButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
};
export type ButtonAsLinkProps = SharedProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & {
    href: string;
    disabled?: boolean;
};
export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;
export declare function Button(props: ButtonProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=button.d.ts.map