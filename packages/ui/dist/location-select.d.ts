import { type GeoNode, type LocationRule } from '@askalert/geo';
export type LocationSelectValue = {
    stateSlug: string;
    locationSlug: string;
};
export type LocationSelectProps = {
    nodes: readonly GeoNode[];
    value: LocationSelectValue;
    onChange: (value: LocationSelectValue) => void;
    locationRule?: LocationRule;
    /** Hide statewide unless category location_rule is `state`. */
    className?: string;
    disabled?: boolean;
    stateLabel?: string;
    locationLabel?: string;
};
export declare function LocationSelect({ nodes, value, onChange, locationRule, className, disabled, stateLabel, locationLabel, }: LocationSelectProps): import("react").JSX.Element;
//# sourceMappingURL=location-select.d.ts.map