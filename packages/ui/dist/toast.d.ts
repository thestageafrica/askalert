import { type ReactNode } from 'react';
export type ToastTone = 'default' | 'success' | 'warning' | 'danger';
export type ToastInput = {
    title: string;
    description?: string;
    tone?: ToastTone;
    durationMs?: number;
};
type ToastContextValue = {
    toast: (input: ToastInput) => void;
};
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useToast(): ToastContextValue;
export {};
//# sourceMappingURL=toast.d.ts.map