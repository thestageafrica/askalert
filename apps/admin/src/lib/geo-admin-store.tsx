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
import type { GeoNode } from '@askalert/geo';
import { useAdminStore } from './admin-store';
import {
  archiveGeoNode,
  exportGeoCsv,
  importGeoCsv,
  loadGeoAdminState,
  mergeGeoAdminNodes,
  persistGeoAdminState,
  publishGeoAdmin,
  seedGeoAdminState,
  setCategoryActivation,
  upsertGeoNode,
  type GeoAdminState,
} from './geo-admin';

type GeoAdminStore = {
  ready: boolean;
  state: GeoAdminState;
  upsertNode: (node: GeoNode) => void;
  archiveNode: (nodeId: string) => { ok: true } | { ok: false; error: string };
  mergeNodes: (
    sourceId: string,
    targetId: string,
  ) => { ok: true } | { ok: false; error: string };
  publish: (changeNote: string) => { ok: true } | { ok: false; error: string };
  importCsv: (csv: string) => { ok: true } | { ok: false; error: string };
  exportCsv: () => string;
  setActivation: (categorySlug: string, locationSlugs: string[]) => void;
  resetToSeeds: () => void;
};

const GeoAdminContext = createContext<GeoAdminStore | null>(null);

export function GeoAdminProvider({ children }: { children: ReactNode }) {
  const { role } = useAdminStore();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<GeoAdminState>(seedGeoAdminState);

  useEffect(() => {
    setState(loadGeoAdminState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    persistGeoAdminState(state);
  }, [ready, state]);

  const actor = role;

  const upsertNode = useCallback(
    (node: GeoNode) => {
      setState((current) => upsertGeoNode(current, node, actor));
    },
    [actor],
  );

  const archiveNode = useCallback(
    (nodeId: string) => {
      const result = archiveGeoNode(state, nodeId, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const mergeNodes = useCallback(
    (sourceId: string, targetId: string) => {
      const result = mergeGeoAdminNodes(state, sourceId, targetId, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const publish = useCallback(
    (changeNote: string) => {
      const result = publishGeoAdmin(state, changeNote, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const importCsv = useCallback(
    (csv: string) => {
      const result = importGeoCsv(state, csv, actor);
      if (!result.ok) {
        return result;
      }
      setState(result.state);
      return { ok: true as const };
    },
    [actor, state],
  );

  const exportCsv = useCallback(() => exportGeoCsv(state), [state]);

  const setActivation = useCallback(
    (categorySlug: string, locationSlugs: string[]) => {
      setState((current) => setCategoryActivation(current, categorySlug, locationSlugs, actor));
    },
    [actor],
  );

  const resetToSeeds = useCallback(() => {
    setState(seedGeoAdminState());
  }, []);

  const value = useMemo(
    () => ({
      ready,
      state,
      upsertNode,
      archiveNode,
      mergeNodes,
      publish,
      importCsv,
      exportCsv,
      setActivation,
      resetToSeeds,
    }),
    [
      archiveNode,
      exportCsv,
      importCsv,
      mergeNodes,
      publish,
      ready,
      resetToSeeds,
      setActivation,
      state,
      upsertNode,
    ],
  );

  return <GeoAdminContext.Provider value={value}>{children}</GeoAdminContext.Provider>;
}

export function useGeoAdminStore(): GeoAdminStore {
  const value = useContext(GeoAdminContext);
  if (!value) {
    throw new Error('useGeoAdminStore must be used inside GeoAdminProvider.');
  }
  return value;
}
