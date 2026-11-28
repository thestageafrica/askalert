import { type CoveragePlanCaps, type GeoNode } from '@askalert/geo';
export type CoveragePickerProps = {
    nodes: readonly GeoNode[];
    caps: CoveragePlanCaps;
    /** Controlled location slugs; picker itself starts with one empty row. */
    value?: string[];
    onChange: (locationSlugs: string[]) => void;
    className?: string;
    /** When true, mount with a single empty row and ignore draft prefill. */
    startEmpty?: boolean;
};
export declare function CoveragePicker({ nodes, caps, value, onChange, className, startEmpty, }: CoveragePickerProps): import("react").JSX.Element;
//# sourceMappingURL=coverage-picker.d.ts.map