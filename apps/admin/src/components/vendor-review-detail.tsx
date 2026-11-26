'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Input, Select } from '@askalert/ui';
import { createMoney, formatNaira } from '@askalert/payments';
import { useOpsStore } from '../lib/ops-store';
import { canApproveVendors, canReviewVendors } from '../lib/roles';
import { useAdminStore } from '../lib/admin-store';

export function VendorReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { vendors, reviewVendor, signedDocumentUrl } = useOpsStore();
  const { role } = useAdminStore();
  const vendor = vendors.find((item) => item.id === id);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [tier, setTier] = useState('id');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6">
        <p className="font-semibold">Vendor not found in this build.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Static export only includes demo vendor routes until live IDs are generated at build time.
        </p>
        <Button href="/vendors/" className="mt-4" variant="secondary">
          Back to queue
        </Button>
      </div>
    );
  }

  const canReview = canReviewVendors(role);
  const canApprove = canApproveVendors(role);

  const run = async (action: 'approve' | 'reject' | 'request_info' | 'suspend') => {
    setBusy(true);
    setNotice(null);
    const result = await reviewVendor({
      vendorId: vendor.id,
      action,
      reason,
      message,
      tier,
    });
    setBusy(false);
    setNotice(result.ok ? `Marked as ${action.replace('_', ' ')}.` : result.error);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Vendor review</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{vendor.displayName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {vendor.businessName || vendor.entityType} · {vendor.status.replace('_', ' ')}
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Profile</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Categories" value={vendor.categorySlugs.join(', ') || '—'} />
          <Row label="Areas" value={vendor.areaSlugs.join(', ') || '—'} />
          <Row label="Tiers" value={vendor.verificationTiers.join(', ') || '—'} />
          <Row
            label="Submitted"
            value={
              vendor.submittedAt
                ? new Date(vendor.submittedAt).toLocaleString('en-NG')
                : '—'
            }
          />
        </dl>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Rate cards</h2>
        <ul className="mt-3 space-y-2">
          {vendor.rateCards.length === 0 ? (
            <li className="text-sm text-muted-foreground">No rate cards on this record yet.</li>
          ) : (
            vendor.rateCards.map((card) => (
              <li key={card.categorySlug} className="flex justify-between gap-3 text-sm">
                <span className="font-semibold">{card.categorySlug}</span>
                <span>
                  {formatNaira(createMoney(card.startingPriceMinor))} / {card.unit}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Documents</h2>
        <ul className="mt-3 space-y-2">
          {vendor.documents.length === 0 ? (
            <li className="text-sm text-muted-foreground">No documents attached.</li>
          ) : (
            vendor.documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {doc.kind}: {doc.fileName}
                </span>
                <Button
                  variant="secondary"
                  className="min-h-10 text-xs"
                  onClick={() => {
                    void signedDocumentUrl(doc.path).then((url) => {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    });
                  }}
                >
                  Open signed URL (5 min)
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>

      {canReview ? (
        <section className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-extrabold">Actions</h2>
          <Select
            label="Set verification tier"
            value={tier}
            options={['phone', 'id', 'business', 'trusted'].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(event) => setTier(event.target.value)}
          />
          <Input
            label="Reason (required to reject)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Input
            label="Message to vendor (required for request info)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {notice ? <p className="text-sm font-medium text-foreground">{notice}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canApprove || busy}
              onClick={() => void run('approve')}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              disabled={!canApprove || busy}
              onClick={() => void run('reject')}
            >
              Reject
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void run('request_info')}
            >
              Request more information
            </Button>
            <Button
              variant="ghost"
              disabled={!canApprove || busy}
              onClick={() => void run('suspend')}
            >
              Suspend
            </Button>
          </div>
        </section>
      ) : null}

      <Button href="/vendors/" variant="secondary">
        Back to queue
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
