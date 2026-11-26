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
import {
  listSeedCategories,
  validateConfig,
  type CategoryConfig,
  type CategoryStatus,
} from '@askalert/category-engine';
import {
  ensureCategoryId,
  listManagedCategories,
  publishCategoryVersion,
} from '@askalert/db';
import { createBlankCategory } from './blank-category';
import { useAdminAuth } from './admin-auth';
import type { AdminRole } from './roles';
import { adminBrowserClient, adminSupabaseEnabled } from './supabase-browser';

export type CategoryVersion = {
  id: string;
  note: string;
  createdAt: string;
  config: CategoryConfig;
  published: boolean;
};

export type ManagedCategory = {
  id: string;
  vendorsCount: number;
  draft: CategoryConfig;
  versions: CategoryVersion[];
  readiness: {
    verifiedVendors: boolean;
    fastResponders: boolean;
    supplyOwner: boolean;
    termsReady: boolean;
    evaluationPassed: boolean;
  };
};

type PublishOutcome = { ok: true } | { ok: false; errors: string[] };

type AdminStore = {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
  categories: ManagedCategory[];
  categoriesLoading: boolean;
  getCategory: (id: string) => ManagedCategory | undefined;
  updateDraft: (id: string, draft: CategoryConfig) => void;
  publishCategory: (
    id: string,
    note: string,
    nextStatus?: CategoryStatus,
  ) => Promise<PublishOutcome>;
  rollbackCategory: (id: string, versionId: string) => void;
  createCategory: (fromId?: string) => ManagedCategory;
  setReadiness: (id: string, key: keyof ManagedCategory['readiness'], value: boolean) => void;
};

const AdminStoreContext = createContext<AdminStore | null>(null);

function supabaseEnabledOnClient(): boolean {
  return adminSupabaseEnabled();
}

function readinessFromStatus(status: CategoryStatus): ManagedCategory['readiness'] {
  return {
    verifiedVendors: status !== 'draft',
    fastResponders: status === 'pilot' || status === 'live',
    supplyOwner: true,
    termsReady: status !== 'draft',
    evaluationPassed: status === 'pilot' || status === 'live',
  };
}

function seedManaged(): ManagedCategory[] {
  return listSeedCategories().map((config, index) => ({
    id: config.slug,
    vendorsCount: 8 + index * 3,
    draft: structuredClone(config),
    versions: [
      {
        id: `${config.slug}_v1`,
        note: 'Seed import',
        createdAt: new Date().toISOString(),
        config: structuredClone(config),
        published: config.status === 'pilot' || config.status === 'live',
      },
    ],
    readiness: readinessFromStatus(config.status),
  }));
}

function fromSupabaseRows(
  rows: Array<{
    id: string;
    slug: string;
    vendorsCount?: number;
    draft: CategoryConfig;
    status?: CategoryStatus;
  }>,
): ManagedCategory[] {
  return rows.map((row, index) => {
    const status = row.status ?? row.draft.status;
    const draft: CategoryConfig = {
      ...structuredClone(row.draft),
      status,
    };
    return {
      id: row.id,
      vendorsCount: row.vendorsCount ?? 8 + index * 3,
      draft,
      versions: [
        {
          id: `${row.slug}_v1`,
          note: 'Loaded from Supabase',
          createdAt: new Date().toISOString(),
          config: structuredClone(draft),
          published: status === 'pilot' || status === 'live',
        },
      ],
      readiness: readinessFromStatus(status),
    };
  });
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const useRemote = supabaseEnabledOnClient();
  const { role: authRole, supabaseConfigured } = useAdminAuth();
  const [role, setRole] = useState<AdminRole>('super_admin');
  const [categories, setCategories] = useState<ManagedCategory[]>(() =>
    useRemote ? [] : seedManaged(),
  );
  const [categoriesLoading, setCategoriesLoading] = useState(useRemote);

  useEffect(() => {
    if (supabaseConfigured && authRole) {
      setRole(authRole);
    }
  }, [authRole, supabaseConfigured]);

  useEffect(() => {
    if (!useRemote) {
      return;
    }

    let cancelled = false;
    setCategoriesLoading(true);
    const client = adminBrowserClient();
    if (!client) {
      setCategories(seedManaged());
      setCategoriesLoading(false);
      return;
    }
    void listManagedCategories(client)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        if (rows.length === 0) {
          setCategories(seedManaged());
          return;
        }
        setCategories(
          fromSupabaseRows(
            rows.map((row) => ({
              id: row.id,
              slug: row.slug,
              draft: row.config,
              status: row.status,
            })),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCategories(seedManaged());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [useRemote]);

  const getCategory = useCallback(
    (id: string) =>
      categories.find(
        (category) => category.id === id || category.draft.slug === id,
      ),
    [categories],
  );

  const updateDraft = useCallback((id: string, draft: CategoryConfig) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === id || category.draft.slug === id
          ? { ...category, draft }
          : category,
      ),
    );
  }, []);

  const publishCategory = useCallback(
    async (
      id: string,
      note: string,
      nextStatus: CategoryStatus = 'pilot',
    ): Promise<PublishOutcome> => {
      const managed = categories.find(
        (category) => category.id === id || category.draft.slug === id,
      );
      if (!managed) {
        return { ok: false, errors: ['Category not found.'] };
      }

      const candidate: CategoryConfig = {
        ...managed.draft,
        status: nextStatus,
        vendor_requirements: managed.draft.vendor_requirements
          .map((line) => line.trim())
          .filter(Boolean),
      };
      const result = validateConfig(candidate);
      if (!result.ok) {
        return { ok: false, errors: result.errors };
      }

      let resolvedId = managed.id;
      if (useRemote) {
        try {
          const client = adminBrowserClient();
          if (!client) {
            return {
              ok: false,
              errors: [
                'Supabase URL/anon key missing from this admin build. Set all three NEXT_PUBLIC_* vars and redeploy.',
              ],
            };
          }
          const categoryId = await ensureCategoryId(client, {
            idOrSlug:
              managed.id === 'new' ? managed.draft.slug : managed.id,
            config: result.config,
          });
          const published = await publishCategoryVersion(client, {
            categoryId,
            config: result.config,
            note: note.trim() || 'Published update',
            nextStatus,
            actor: 'admin',
          });
          if (!published.ok) {
            return {
              ok: false,
              errors: published.errors,
            };
          }
          resolvedId = categoryId;
        } catch (error) {
          return {
            ok: false,
            errors: [
              error instanceof Error ? error.message : 'Could not publish to Supabase.',
            ],
          };
        }
      }

      const version: CategoryVersion = {
        id: `${resolvedId}_v${managed.versions.length + 1}`,
        note: note.trim() || 'Published update',
        createdAt: new Date().toISOString(),
        config: structuredClone(result.config),
        published: true,
      };

      setCategories((current) =>
        current.map((category) =>
          category.id === managed.id || category.draft.slug === managed.draft.slug
            ? {
                ...category,
                id: resolvedId,
                draft: structuredClone(result.config),
                versions: [version, ...category.versions],
                readiness: readinessFromStatus(result.config.status),
              }
            : category,
        ),
      );

      return { ok: true };
    },
    [categories, useRemote],
  );

  const rollbackCategory = useCallback((id: string, versionId: string) => {
    setCategories((current) =>
      current.map((category) => {
        if (category.id !== id && category.draft.slug !== id) {
          return category;
        }
        const version = category.versions.find((item) => item.id === versionId);
        if (!version) {
          return category;
        }
        return { ...category, draft: structuredClone(version.config) };
      }),
    );
  }, []);

  const createCategory = useCallback(
    (fromId?: string) => {
      const source = fromId
        ? categories.find(
            (category) => category.id === fromId || category.draft.slug === fromId,
          )?.draft
        : undefined;
      // Static export only has /categories/new/ for drafts — keep id "new" for routing.
      const slugBase = source ? `${source.slug}-copy` : `category-${Date.now()}`;
      const draft = source
        ? {
            ...structuredClone(source),
            slug: slugBase,
            name: `${source.name} copy`,
            status: 'draft' as CategoryStatus,
          }
        : createBlankCategory(slugBase);

      const created: ManagedCategory = {
        id: 'new',
        vendorsCount: 0,
        draft,
        versions: [],
        readiness: readinessFromStatus('draft'),
      };

      setCategories((current) => [
        created,
        ...current.filter((category) => category.id !== 'new'),
      ]);
      return created;
    },
    [categories],
  );

  const setReadiness = useCallback(
    (id: string, key: keyof ManagedCategory['readiness'], value: boolean) => {
      setCategories((current) =>
        current.map((category) =>
          category.id === id || category.draft.slug === id
            ? { ...category, readiness: { ...category.readiness, [key]: value } }
            : category,
        ),
      );
    },
    [],
  );

  const value = useMemo<AdminStore>(
    () => ({
      role,
      setRole,
      categories,
      categoriesLoading,
      getCategory,
      updateDraft,
      publishCategory,
      rollbackCategory,
      createCategory,
      setReadiness,
    }),
    [
      role,
      categories,
      categoriesLoading,
      getCategory,
      updateDraft,
      publishCategory,
      rollbackCategory,
      createCategory,
      setReadiness,
    ],
  );

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore(): AdminStore {
  const store = useContext(AdminStoreContext);
  if (!store) {
    throw new Error('useAdminStore must be used inside AdminStoreProvider.');
  }
  return store;
}
