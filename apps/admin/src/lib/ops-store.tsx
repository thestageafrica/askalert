'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminRpc } from './admin-rpc';
import { adminBrowserClient } from './supabase-browser';

export type ReviewVendor = {
  id: string;
  userId: string;
  displayName: string;
  businessName: string;
  entityType: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
  verificationTiers: string[];
  categorySlugs: string[];
  areaSlugs: string[];
  submittedAt: string | null;
  rateCards: Array<{
    categorySlug: string;
    startingPriceMinor: number;
    unit: string;
  }>;
  documents: Array<{
    id: string;
    kind: string;
    fileName: string;
    path: string;
  }>;
};

export type AdminUserRow = {
  userId: string;
  email: string;
  displayName: string;
  phoneE164: string;
  roles: string[];
  createdAt: string;
};

export type AuditRow = {
  id: string;
  actor: string;
  action: string;
  tableName: string;
  recordId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

const SEED_VENDORS: ReviewVendor[] = [
  {
    id: 'vp_demo_1',
    userId: 'user_demo_1',
    displayName: 'Chioma Events',
    businessName: 'Chioma Celebrations',
    entityType: 'business',
    status: 'pending_review',
    verificationTiers: ['phone', 'id'],
    categorySlugs: ['events'],
    areaSlugs: ['lekki', 'victoria-island'],
    submittedAt: new Date(Date.now() - 3600_000).toISOString(),
    rateCards: [{ categorySlug: 'events', startingPriceMinor: 250_000_00, unit: 'event' }],
    documents: [
      {
        id: 'doc_1',
        kind: 'id',
        fileName: 'cac.pdf',
        path: 'user_demo_1/doc_1-cac.pdf',
      },
    ],
  },
  {
    id: 'vp_demo_2',
    userId: 'user_demo_2',
    displayName: 'Lagos Nest Host',
    businessName: '',
    entityType: 'individual',
    status: 'pending_review',
    verificationTiers: ['phone'],
    categorySlugs: ['shortlets'],
    areaSlugs: ['lekki-phase-1', 'ikoyi'],
    submittedAt: new Date(Date.now() - 7200_000).toISOString(),
    rateCards: [{ categorySlug: 'shortlets', startingPriceMinor: 85_000_00, unit: 'night' }],
    documents: [
      {
        id: 'doc_2',
        kind: 'portfolio',
        fileName: 'living-room.jpg',
        path: 'user_demo_2/doc_2-living-room.jpg',
      },
    ],
  },
];

const SEED_USERS: AdminUserRow[] = [
  {
    userId: 'user_demo_1',
    email: 'chioma@example.com',
    displayName: 'Chioma Events',
    phoneE164: '+2348011111111',
    roles: ['buyer', 'vendor'],
    createdAt: new Date(Date.now() - 86400_000 * 12).toISOString(),
  },
  {
    userId: 'user_demo_2',
    email: 'host@example.com',
    displayName: 'Lagos Nest Host',
    phoneE164: '+2348022222222',
    roles: ['buyer', 'vendor'],
    createdAt: new Date(Date.now() - 86400_000 * 5).toISOString(),
  },
];

const SEED_AUDIT: AuditRow[] = [
  {
    id: 'aud_1',
    actor: 'ops@askalert.com',
    action: 'admin.invite',
    tableName: 'admin_invitations',
    recordId: 'inv_1',
    payload: { email: 'ops@askalert.com', role: 'admin_operations' },
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

type OpsStore = {
  vendors: ReviewVendor[];
  users: AdminUserRow[];
  audit: AuditRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  reviewVendor: (input: {
    vendorId: string;
    action: 'approve' | 'reject' | 'request_info' | 'suspend';
    reason?: string;
    message?: string;
    tier?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  setUserRoleStatus: (input: {
    userId: string;
    role: string;
    status: string;
    reason: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  inviteStaff: (input: {
    email: string;
    role: string;
    note?: string;
  }) => Promise<{ ok: true; id?: string } | { ok: false; error: string }>;
  signedDocumentUrl: (path: string) => Promise<string>;
};

const OpsStoreContext = createContext<OpsStore | null>(null);

export function OpsStoreProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<ReviewVendor[]>(SEED_VENDORS);
  const [users, setUsers] = useState<AdminUserRow[]>(SEED_USERS);
  const [audit, setAudit] = useState<AuditRow[]>(SEED_AUDIT);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const client = adminBrowserClient();
    if (!client) {
      return;
    }
    setLoading(true);
    try {
      const [vendorRes, userRes, auditRes] = await Promise.all([
        adminRpc<Array<Record<string, unknown>>>(client, 'admin_list_pending_vendors'),
        adminRpc<Array<Record<string, unknown>>>(client, 'admin_list_users', { p_query: '' }),
        adminRpc<Array<Record<string, unknown>>>(client, 'admin_list_audit', {
          p_action: null,
          p_table_name: null,
          p_limit: 100,
        }),
      ]);
      if (!vendorRes.error && vendorRes.data && vendorRes.data.length > 0) {
        setVendors(
          vendorRes.data.map((row) => ({
            id: String(row.id),
            userId: String(row.user_id),
            displayName: String(row.display_name ?? ''),
            businessName: String(row.business_name ?? ''),
            entityType: String(row.entity_type ?? 'individual'),
            status: row.status as ReviewVendor['status'],
            verificationTiers: (row.verification_tiers as string[]) ?? [],
            categorySlugs: (row.category_slugs as string[]) ?? [],
            areaSlugs: (row.area_slugs as string[]) ?? [],
            submittedAt: (row.submitted_at as string | null) ?? null,
            rateCards: [],
            documents: [],
          })),
        );
      }
      if (!userRes.error && userRes.data && userRes.data.length > 0) {
        setUsers(
          userRes.data.map((row) => ({
            userId: String(row.user_id),
            email: String(row.email ?? ''),
            displayName: String(row.display_name ?? ''),
            phoneE164: String(row.phone_e164 ?? ''),
            roles: (row.roles as string[]) ?? [],
            createdAt: String(row.created_at ?? ''),
          })),
        );
      }
      if (!auditRes.error && auditRes.data && auditRes.data.length > 0) {
        setAudit(
          auditRes.data.map((row) => ({
            id: String(row.id),
            actor: String(row.actor ?? ''),
            action: String(row.action ?? ''),
            tableName: String(row.table_name ?? ''),
            recordId: (row.record_id as string | null) ?? null,
            payload: (row.payload as Record<string, unknown>) ?? {},
            createdAt: String(row.created_at ?? ''),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reviewVendor = useCallback<OpsStore['reviewVendor']>(async (input) => {
    if (input.action === 'reject' && !input.reason?.trim()) {
      return { ok: false, error: 'Reject requires a reason.' };
    }
    if (input.action === 'request_info' && !input.message?.trim()) {
      return { ok: false, error: 'Request info requires a message to the vendor.' };
    }
    const client = adminBrowserClient();
    if (client) {
      const { error } = await adminRpc(client, 'admin_review_vendor', {
        p_vendor_id: input.vendorId,
        p_action: input.action,
        p_reason: input.reason ?? '',
        p_message: input.message ?? '',
        p_tier: input.tier ?? null,
      });
      if (!error) {
        await refresh();
        return { ok: true };
      }
    }
    setVendors((current) =>
      current.map((vendor) => {
        if (vendor.id !== input.vendorId) {
          return vendor;
        }
        const status =
          input.action === 'approve'
            ? 'approved'
            : input.action === 'reject'
              ? 'rejected'
              : input.action === 'suspend'
                ? 'suspended'
                : 'draft';
        return {
          ...vendor,
          status,
          verificationTiers: input.tier
            ? unlockTiers(vendor.verificationTiers, input.tier)
            : vendor.verificationTiers,
        };
      }),
    );
    setAudit((current) => [
      {
        id: `aud_${Date.now()}`,
        actor: 'local-admin',
        action: `vendor.${input.action}`,
        tableName: 'vendor_profiles',
        recordId: input.vendorId,
        payload: {
          reason: input.reason,
          message: input.message,
          tier: input.tier,
        },
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { ok: true };
  }, [refresh]);

  const setUserRoleStatus = useCallback<OpsStore['setUserRoleStatus']>(async (input) => {
    if (!input.reason.trim()) {
      return { ok: false, error: 'Reason is required.' };
    }
    const client = adminBrowserClient();
    if (client) {
      const { error } = await adminRpc(client, 'admin_set_user_role_status', {
        p_user_id: input.userId,
        p_role: input.role,
        p_status: input.status,
        p_reason: input.reason,
      });
      if (!error) {
        await refresh();
        return { ok: true };
      }
    }
    setUsers((current) =>
      current.map((user) =>
        user.userId === input.userId
          ? {
              ...user,
              roles:
                input.status === 'suspended'
                  ? user.roles.filter((role) => role !== input.role)
                  : Array.from(new Set([...user.roles, input.role])),
            }
          : user,
      ),
    );
    setAudit((current) => [
      {
        id: `aud_${Date.now()}`,
        actor: 'local-admin',
        action: 'user.role_status',
        tableName: 'user_roles',
        recordId: input.userId,
        payload: input,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { ok: true };
  }, [refresh]);

  const inviteStaff = useCallback<OpsStore['inviteStaff']>(async (input) => {
    const client = adminBrowserClient();
    if (client) {
      const { data, error } = await adminRpc(client, 'admin_invite_staff', {
        p_email: input.email,
        p_role: input.role,
        p_note: input.note ?? '',
      });
      if (!error) {
        await refresh();
        return { ok: true, id: String(data) };
      }
      return { ok: false, error: error.message };
    }
    setAudit((current) => [
      {
        id: `aud_${Date.now()}`,
        actor: 'local-admin',
        action: 'admin.invite',
        tableName: 'admin_invitations',
        recordId: `inv_${Date.now()}`,
        payload: input,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { ok: true, id: `inv_${Date.now()}` };
  }, [refresh]);

  const signedDocumentUrl = useCallback(async (path: string) => {
    const client = adminBrowserClient();
    if (client) {
      const { data, error } = await client.storage
        .from('vendor-documents')
        .createSignedUrl(path, 300);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    }
    return `https://signed.local/${encodeURIComponent(path)}?exp=300`;
  }, []);

  const value = useMemo(
    () => ({
      vendors,
      users,
      audit,
      loading,
      refresh,
      reviewVendor,
      setUserRoleStatus,
      inviteStaff,
      signedDocumentUrl,
    }),
    [
      audit,
      inviteStaff,
      loading,
      refresh,
      reviewVendor,
      setUserRoleStatus,
      signedDocumentUrl,
      users,
      vendors,
    ],
  );

  return <OpsStoreContext.Provider value={value}>{children}</OpsStoreContext.Provider>;
}

export function useOpsStore() {
  const ctx = useContext(OpsStoreContext);
  if (!ctx) {
    throw new Error('useOpsStore must be used within OpsStoreProvider');
  }
  return ctx;
}

function unlockTiers(current: string[], next: string): string[] {
  const order = ['phone', 'id', 'business', 'trusted'];
  const index = order.indexOf(next);
  if (index < 0) {
    return current;
  }
  return Array.from(new Set([...current, ...order.slice(0, index + 1)]));
}
