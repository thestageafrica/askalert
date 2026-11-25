import type { ReactNode } from 'react';
import { RequireAuth } from '../../components/auth/require-auth';
import { VendorAppShell } from '../../components/vendor/vendor-app-shell';
import { PlanStoreProvider } from '../../lib/app/plan-store';
import { VendorStoreProvider } from '../../lib/vendor/vendor-store';

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <PlanStoreProvider audience="vendor">
        <VendorStoreProvider>
          <VendorAppShell>{children}</VendorAppShell>
        </VendorStoreProvider>
      </PlanStoreProvider>
    </RequireAuth>
  );
}
