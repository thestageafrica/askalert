'use client';

import { GeographyExplorer } from '../../components/geography/geography-explorer';
import { AreasManagerPanel } from '../../components/geography/areas-manager-panel';

export default function AreasPage() {
  return (
    <div className="space-y-8">
      <GeographyExplorer />
      <AreasManagerPanel />
    </div>
  );
}
