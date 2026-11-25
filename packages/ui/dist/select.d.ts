import { type SelectHTMLAttributes } from 'react';
export type SelectOption = {
    value: string;
    label: string;
};
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: SelectOption[];
    hint?: string;
};
export declare const Select: import("react").ForwardRefExoticComponent<SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: SelectOption[];
    hint?: string;
} & import("react").RefAttributes<HTMLSelectElement>>;
//# sourceMappingURL=select.d.ts.map