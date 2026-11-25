import { type ReactNode } from 'react';
export type AccordionItem = {
    id: string;
    title: string;
    content: ReactNode;
};
export type AccordionProps = {
    items: AccordionItem[];
    className?: string;
    allowMultiple?: boolean;
};
export declare function Accordion({ items, className, allowMultiple }: AccordionProps): import("react").JSX.Element;
//# sourceMappingURL=accordion.d.ts.map