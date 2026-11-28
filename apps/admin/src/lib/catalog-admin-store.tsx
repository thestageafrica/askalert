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
import type { CatalogCategorySeed } from '@askalert/catalog';
import { useAdminStore } from './admin-store';
import {
  addAliasFromGap,
  archiveCatalogService,
  exportCatalogJson,
  importCatalogJson,
  loadCatalogAdminState,
  persistCatalogAdminState,
  publishCatalogCategory,
  rollbackCatalogCategory,
  seedCatalogAdminState,
  upsertCatalogCategory,
  type CatalogAdminState,
} from './catalog-admin';

type CatalogAdminStore = {
  ready: boolean;
  state: CatalogAdminState;
  upsertCategory: (seed: CatalogCategorySeed) => { ok: true } | { ok: false; error: string };
  publish: (
    categorySlug: string,
    changeNote: string,
  ) => { ok: true } | { ok: false; error: string };
  rollback: (versionId: string) => { ok: true } | { ok: false; error: string };
  archiveService: (
    categorySlug: string,
    serviceSlug: string,
  ) => { ok: true } | { ok: false; error: string };
  resolveGapAlias: (
    gapId: string,
    serviceSlug: string,
  ) => { ok: true } | { ok: false; error: string };
  exportJson: () => string;
  importJson: (raw: string) => { ok: true } | { ok: false; error: string };
  resetToSeeds: () => void;
};

const CatalogAdminContext = createContext<CatalogAdminStore | null>(null);

export function CatalogAdminProvider({ children }: { children: ReactNode }) {
  const { role } = useAdminStore();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<CatalogAdminState>(seedCatalogAdminState);

  useEffect(() => {
    setState(loadCatalogAdminState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    persistCatalogAdminState(state);
  }, [ready, state]);

  const actor = role;

  const upsertCategory = useCallback(
    (seed: CatalogCategorySeed) => {
      const result = upsertCatalogCategory(state, seed, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const publish = useCallback(
    (categorySlug: string, changeNote: string) => {
      const result = publishCatalogCategory(state, categorySlug, changeNote, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const rollback = useCallback(
    (versionId: string) => {
      const result = rollbackCatalogCategory(state, versionId, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const archiveService = useCallback(
    (categorySlug: string, serviceSlug: string) => {
      const result = archiveCatalogService(state, categorySlug, serviceSlug, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const resolveGapAlias = useCallback(
    (gapId: string, serviceSlug: string) => {
      const result = addAliasFromGap(state, gapId, serviceSlug, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const exportJson = useCallback(() => exportCatalogJson(state), [state]);

  const importJson = useCallback(
    (raw: string) => {
      const result = importCatalogJson(state, raw, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const resetToSeeds = useCallback(() => {
    setState(seedCatalogAdminState());
  }, []);

  const value = useMemo(
    () => ({
      ready,
      state,
      upsertCategory,
      publish,
      rollback,
      archiveService,
      resolveGapAlias,
      exportJson,
      importJson,
      resetToSeeds,
    }),
    [
      archiveService,
      exportJson,
      importJson,
      publish,
      ready,
      resetToSeeds,
      resolveGapAlias,
      rollback,
      state,
      upsertCategory,
    ],
  );

  return (
    <CatalogAdminContext.Provider value={value}>{children}</CatalogAdminContext.Provider>
  );
}

export function useCatalogAdminStore(): CatalogAdminStore {
  const value = useContext(CatalogAdminContext);
  if (!value) {
    throw new Error('useCatalogAdminStore must be used inside CatalogAdminProvider.');
  }
  return value;
}
