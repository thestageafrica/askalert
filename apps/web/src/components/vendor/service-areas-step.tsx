'use client';

import { useMemo } from 'react';
import { resolveCoveragePlanCaps } from '@askalert/core';
import { listGeoSeedNodes } from '@askalert/geo';
import { CoveragePicker } from '@askalert/ui';

export function ServiceAreasStep({
  maxServiceAreas,
  allowStatewide = false,
  maxStates = 1,
  onChange,
}: {
  /** Kept for wizard draft compatibility; CoveragePicker starts empty per Prompt 42. */
  areaSlugs?: string[];
  maxServiceAreas: number;
  allowStatewide?: boolean;
  maxStates?: number;
  onChange: (slugs: string[]) => void;
}) {
  const nodes = useMemo(() => listGeoSeedNodes(), []);
  const caps = resolveCoveragePlanCaps({
    maxServiceAreas,
    maxCoverageLocations: maxServiceAreas,
    allowStatewide,
    maxStates,
  });

  return <CoveragePicker nodes={nodes} caps={caps} startEmpty onChange={onChange} />;
}
