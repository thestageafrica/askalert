import { type InputHTMLAttributes } from 'react';
export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    label?: string;
    valueLabel?: string;
};
export declare const Slider: import("react").ForwardRefExoticComponent<Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label?: string;
    valueLabel?: string;
} & import("react").RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=slider.d.ts.map