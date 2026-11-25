import { type ImgHTMLAttributes } from 'react';
export type LogoVariant = 'default' | 'reversed';
export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
    variant?: LogoVariant;
    alt?: string;
};
export declare function Logo({ variant, alt, className, ...props }: LogoProps): import("react").JSX.Element;
//# sourceMappingURL=logo.d.ts.map