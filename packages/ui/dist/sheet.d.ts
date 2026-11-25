import { type ReactNode } from 'react';
export type SheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    className?: string;
};
export declare function Sheet({ open, onOpenChange, title, children, className }: SheetProps): import("react").JSX.Element | null;
//# sourceMappingURL=sheet.d.ts.map