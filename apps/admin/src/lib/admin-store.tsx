'use client';

import {
  createContext,
  useCallback,
  useContext,
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
import { createBlankCategory } from './blank-category';
import type { AdminRole } from './roles';

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

type AdminStore = {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
  categories: ManagedCategory[];
  getCategory: (id: string) => ManagedCategory | undefined;
  updateDraft: (id: string, draft: CategoryConfig) => void;
  publishCategory: (
    id: string,
    note: string,
    nextStatus?: CategoryStatus,
  ) => { ok: true } | { ok: false; errors: string[] };
  rollbackCategory: (id: string, versionId: string) => void;
  createCategory: (fromId?: string) => ManagedCategory;
  setReadiness: (id: string, key: keyof ManagedCategory['readiness'], value: boolean) => void;
};

const AdminStoreContext = createContext<AdminStore | null>(null);

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
    readiness: {
      verifiedVendors: config.status !== 'draft',
      fastResponders: config.status === 'pilot' || config.status === 'live',
      supplyOwner: true,
      termsReady: config.status !== 'draft',
      evaluationPassed: config.status === 'pilot' || config.status === 'live',
    },
  }));
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AdminRole>('super_admin');
  const [categories, setCategories] = useState<ManagedCategory[]>(() => seedManaged());

  const getCategory = useCallback(
    (id: string) => categories.find((category) => category.id === id),
    [categories],
  );

  const updateDraft = useCallback((id: string, draft: CategoryConfig) => {
    setCategories((current) =>
      current.map((category) => (category.id === id ? { ...category, draft } : category)),
    );
  }, []);

  const publishCategory = useCallback(
    (
      id: string,
      note: string,
      nextStatus: CategoryStatus = 'pilot',
    ): { ok: true } | { ok: false; errors: string[] } => {
      const managed = categories.find((category) => category.id === id);
      if (!managed) {
        return { ok: false, errors: ['Category not found.'] };
      }

      const candidate: CategoryConfig = {
        ...managed.draft,
        status: nextStatus,
      };
      const result = validateConfig(candidate);
      if (!result.ok) {
        return { ok: false, errors: result.errors };
      }

      const version: CategoryVersion = {
        id: `${id}_v${managed.versions.length + 1}`,
        note: note.trim() || 'Published update',
        createdAt: new Date().toISOString(),
        config: structuredClone(result.config),
        published: true,
      };

      setCategories((current) =>
        current.map((category) =>
          category.id === id
            ? {
                ...category,
                draft: structuredClone(result.config),
                versions: [version, ...category.versions],
              }
            : category,
        ),
      );

      return { ok: true };
    },
    [categories],
  );

  const rollbackCategory = useCallback((id: string, versionId: string) => {
    setCategories((current) =>
      current.map((category) => {
        if (category.id !== id) {
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
        ? categories.find((category) => category.id === fromId)?.draft
        : undefined;
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
        id: draft.slug,
        vendorsCount: 0,
        draft,
        versions: [],
        readiness: {
          verifiedVendors: false,
          fastResponders: false,
          supplyOwner: false,
          termsReady: false,
          evaluationPassed: false,
        },
      };

      setCategories((current) => [created, ...current]);
      return created;
    },
    [categories],
  );

  const setReadiness = useCallback(
    (id: string, key: keyof ManagedCategory['readiness'], value: boolean) => {
      setCategories((current) =>
        current.map((category) =>
          category.id === id
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
