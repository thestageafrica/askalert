import type { PlanLimits } from './types';

export type CoveragePlanCaps = {
  maxCoverageLocations: number;
  allowStatewide: boolean;
  maxStates: number;
};

export function resolveCoveragePlanCaps(limits: PlanLimits | undefined): CoveragePlanCaps {
  return {
    maxCoverageLocations: limits?.maxCoverageLocations ?? limits?.maxServiceAreas ?? 3,
    allowStatewide: limits?.allowStatewide ?? false,
    maxStates: limits?.maxStates ?? 1,
  };
}
