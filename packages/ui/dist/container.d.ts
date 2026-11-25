import type { HTMLAttributes, ReactNode } from 'react';
export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    width?: 'sm' | 'md' | 'lg' | 'xl';
};
export declare function Container({ children, className, width, ...props }: ContainerProps): import("react").JSX.Element;
//# sourceMappingURL=container.d.ts.map