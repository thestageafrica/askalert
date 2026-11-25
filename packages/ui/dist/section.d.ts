import type { HTMLAttributes, ReactNode } from 'react';
export type SectionProps = HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    eyebrow?: string;
    title?: string;
    description?: string;
};
export declare function Section({ children, eyebrow, title, description, className, ...props }: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=section.d.ts.map