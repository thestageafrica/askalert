import type { HTMLAttributes } from 'react';
export type BadgeVariant = 'verified' | 'protected' | 'direct-payment';
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant: BadgeVariant;
};
export declare function Badge({ variant, className, ...props }: BadgeProps): import("react").JSX.Element;
//# sourceMappingURL=badge.d.ts.map