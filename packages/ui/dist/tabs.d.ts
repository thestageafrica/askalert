import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
export type TabsProps = {
    children: ReactNode;
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
};
export declare function Tabs({ children, defaultValue, value: controlledValue, onValueChange, className, }: TabsProps): import("react").JSX.Element;
export declare function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
};
export declare function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps): import("react").JSX.Element;
export type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
    value: string;
};
export declare function TabsContent({ value, className, children, ...props }: TabsContentProps): import("react").JSX.Element | null;
//# sourceMappingURL=tabs.d.ts.map