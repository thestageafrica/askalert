import type { HTMLAttributes, ReactNode } from 'react';
export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
    children: ReactNode;
    statusDot?: boolean;
};
export declare function Chip({ children, statusDot, className, ...props }: ChipProps): import("react").JSX.Element;
//# sourceMappingURL=chip.d.ts.map