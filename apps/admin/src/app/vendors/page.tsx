'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, cn } from '@askalert/ui';
import { useOpsStore } from '../../lib/ops-store';
import { canReviewVendors } from '../../lib/roles';
import { useAdminStore } from '../../lib/admin-store';

export default function VendorsPage() {
  const { vendors, loading } = useOpsStore();
  const { role } = useAdminStore();
  const [status, setStatus] = useState('pending_review');
  const canReview = canReviewVendors(role);

  const filtered = useMemo(
    () =>
      vendors.filter((vendor) => (status === 'all' ? true : vendor.status === status)),
    [status, vendors],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Vendor review</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pending applications and verification actions.
        </p>
      </div>

      {!canReview ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Your role cannot review vendors.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {['pending_review', 'approved', 'rejected', 'suspended', 'all'].map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              'min-h-10 rounded-full px-3 text-xs font-bold capitalize',
              status === value ? 'bg-navy-950 text-surface' : 'border border-border bg-card',
            )}
            onClick={() => setStatus(value)}
          >
            {value.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-card-muted" aria-busy="true" />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          No vendors in this filter. Demo seeds appear when Supabase has no pending rows yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((vendor) => (
            <li key={vendor.id}>
              <Link
                href={`/vendors/${vendor.id}/`}
                className="block rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-sm transition hover:border-orange-500/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-extrabold text-foreground">{vendor.displayName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {vendor.categorySlugs.join(', ') || 'No categories'} ·{' '}
                      {vendor.areaSlugs.join(', ') || 'No areas'}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-800">
                    {vendor.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button href="/" variant="secondary">
        Back to dashboard
      </Button>
    </div>
  );
}
