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
  AREA_CATALOGUE,
  listSeedLocationsForState,
  listSeedStates,
  mergeAreaCatalogues,
  normalizeRemoteAreas,
  type AreaNode,
} from '@askalert/db';
import { adminBrowserClient, adminSupabaseEnabled } from './supabase-browser';

const STORAGE_KEY = 'askalert.admin.areas.v1';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function loadLocal(): AreaNode[] {
  if (typeof window === 'undefined') {
    return mergeAreaCatalogues([], AREA_CATALOGUE);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return mergeAreaCatalogues([], AREA_CATALOGUE);
    }
    const parsed = JSON.parse(raw) as AreaNode[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return mergeAreaCatalogues([], AREA_CATALOGUE);
    }
    return mergeAreaCatalogues(parsed, AREA_CATALOGUE);
  } catch {
    return mergeAreaCatalogues([], AREA_CATALOGUE);
  }
}

function persistLocal(nodes: AreaNode[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}

async function syncUpsert(node: AreaNode) {
  if (!adminSupabaseEnabled()) {
    return;
  }
  const client = adminBrowserClient();
  if (!client) {
    return;
  }
  await client.from('areas').upsert({
    id: node.id,
    slug: node.slug,
    name: node.name,
    parent_id: node.parentId,
    sort_order: node.sortOrder,
  });
}

async function syncDelete(id: string) {
  if (!adminSupabaseEnabled()) {
    return;
  }
  const client = adminBrowserClient();
  if (!client) {
    return;
  }
  await client.from('areas').delete().eq('id', id);
}

type AreasAdminStore = {
  nodes: AreaNode[];
  ready: boolean;
  states: AreaNode[];
  locationsFor: (stateSlug: string) => AreaNode[];
  addState: (name: string) => { ok: true } | { ok: false; error: string };
  addLocation: (
    stateSlug: string,
    name: string,
    options?: { statewide?: boolean },
  ) => { ok: true } | { ok: false; error: string };
  renameNode: (slug: string, name: string) => { ok: true } | { ok: false; error: string };
  removeLocation: (slug: string) => { ok: true } | { ok: false; error: string };
  resetToSeed: () => void;
};

const AreasAdminContext = createContext<AreasAdminStore | null>(null);

export function AreasAdminProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<AreaNode[]>(() => mergeAreaCatalogues([], AREA_CATALOGUE));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      // Local + seed first so admin always sees Lagos locations and keeps edits across reload.
      let next = loadLocal();
      if (!cancelled) {
        setNodes(next);
        setReady(true);
      }

      if (!adminSupabaseEnabled()) {
        return;
      }
      const client = adminBrowserClient();
      if (!client) {
        return;
      }
      const { data, error } = await client.from('areas').select('*').order('sort_order');
      if (cancelled || error || !data?.length) {
        return;
      }
      const remote = normalizeRemoteAreas(
        data.map((row) => ({
          id: String(row.id),
          slug: String(row.slug),
          name: String(row.name),
          parent_id: (row.parent_id as string | null) ?? null,
          sort_order: Number(row.sort_order ?? 0),
        })),
      );
      // Keep local/admin additions; fill gaps from remote + seed.
      next = mergeAreaCatalogues(next, remote);
      if (!cancelled) {
        setNodes(next);
        persistLocal(next);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: AreaNode[]) => {
    const merged = mergeAreaCatalogues(next, AREA_CATALOGUE);
    setNodes(merged);
    persistLocal(merged);
  }, []);

  const addState = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return { ok: false as const, error: 'Enter a state name.' };
      }
      const slug = slugify(trimmed);
      if (!slug) {
        return { ok: false as const, error: 'Enter a valid state name.' };
      }
      if (nodes.some((node) => node.slug === slug)) {
        return { ok: false as const, error: 'That state already exists.' };
      }
      const stateId = crypto.randomUUID();
      const statewide: AreaNode = {
        id: crypto.randomUUID(),
        slug: `${slug}-all`,
        name: `All of ${trimmed}`,
        parentId: stateId,
        sortOrder: 0,
        statewide: true,
      };
      const state: AreaNode = {
        id: stateId,
        slug,
        name: trimmed,
        parentId: null,
        sortOrder:
          Math.max(0, ...nodes.filter((node) => node.parentId == null).map((n) => n.sortOrder)) +
          1,
      };
      commit([...nodes, state, statewide]);
      void syncUpsert(state);
      void syncUpsert(statewide);
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const addLocation = useCallback(
    (stateSlug: string, name: string, options?: { statewide?: boolean }) => {
      const state = nodes.find((node) => node.slug === stateSlug && node.parentId == null);
      if (!state) {
        return { ok: false as const, error: 'Pick a state first.' };
      }
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return { ok: false as const, error: 'Enter a location name.' };
      }
      const slug = options?.statewide ? `${stateSlug}-all` : slugify(trimmed);
      if (!slug) {
        return { ok: false as const, error: 'Enter a valid location name.' };
      }
      if (nodes.some((node) => node.slug === slug)) {
        return { ok: false as const, error: 'That location already exists.' };
      }
      const siblings = nodes.filter((node) => node.parentId === state.id);
      const location: AreaNode = {
        id: crypto.randomUUID(),
        slug,
        name: options?.statewide ? `All of ${state.name}` : trimmed,
        parentId: state.id,
        sortOrder: options?.statewide
          ? 0
          : Math.max(0, ...siblings.map((item) => item.sortOrder)) + 1,
        statewide: Boolean(options?.statewide),
      };
      commit([...nodes, location]);
      void syncUpsert(location);
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const renameNode = useCallback(
    (slug: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return { ok: false as const, error: 'Enter a name.' };
      }
      const existing = nodes.find((node) => node.slug === slug);
      if (!existing) {
        return { ok: false as const, error: 'Area not found.' };
      }
      const updated = { ...existing, name: trimmed };
      commit(nodes.map((node) => (node.slug === slug ? updated : node)));
      void syncUpsert(updated);
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const removeLocation = useCallback(
    (slug: string) => {
      const existing = nodes.find((node) => node.slug === slug);
      if (!existing) {
        return { ok: false as const, error: 'Location not found.' };
      }
      if (existing.parentId == null) {
        return { ok: false as const, error: 'Remove locations, not the state itself.' };
      }
      commit(nodes.filter((node) => node.slug !== slug));
      void syncDelete(existing.id);
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const resetToSeed = useCallback(() => {
    const seeded = mergeAreaCatalogues([], AREA_CATALOGUE);
    setNodes(seeded);
    persistLocal(seeded);
  }, []);

  const value = useMemo<AreasAdminStore>(
    () => ({
      nodes,
      ready,
      states: listSeedStates(nodes),
      locationsFor: (stateSlug: string) => listSeedLocationsForState(stateSlug, nodes),
      addState,
      addLocation,
      renameNode,
      removeLocation,
      resetToSeed,
    }),
    [addLocation, addState, nodes, ready, removeLocation, renameNode, resetToSeed],
  );

  return <AreasAdminContext.Provider value={value}>{children}</AreasAdminContext.Provider>;
}

export function useAreasAdmin() {
  const ctx = useContext(AreasAdminContext);
  if (!ctx) {
    throw new Error('useAreasAdmin must be used within AreasAdminProvider');
  }
  return ctx;
}
