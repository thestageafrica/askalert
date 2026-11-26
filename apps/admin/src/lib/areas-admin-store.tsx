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
    return [...AREA_CATALOGUE];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...AREA_CATALOGUE];
    }
    const parsed = JSON.parse(raw) as AreaNode[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...AREA_CATALOGUE];
    }
    return parsed;
  } catch {
    return [...AREA_CATALOGUE];
  }
}

function persistLocal(nodes: AreaNode[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
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
  resetToSeed: () => void;
};

const AreasAdminContext = createContext<AreasAdminStore | null>(null);

export function AreasAdminProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<AreaNode[]>([...AREA_CATALOGUE]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!adminSupabaseEnabled()) {
        if (!cancelled) {
          setNodes(loadLocal());
          setReady(true);
        }
        return;
      }
      const client = adminBrowserClient();
      if (!client) {
        if (!cancelled) {
          setNodes(loadLocal());
          setReady(true);
        }
        return;
      }
      const { data, error } = await client.from('areas').select('*').order('sort_order');
      if (cancelled) {
        return;
      }
      if (error || !data?.length) {
        setNodes(loadLocal());
        setReady(true);
        return;
      }
      setNodes(
        data.map((row) => ({
          id: String(row.id),
          slug: String(row.slug),
          name: String(row.name),
          parentId: (row.parent_id as string | null) ?? null,
          sortOrder: Number(row.sort_order ?? 0),
          statewide: String(row.slug).endsWith('-all'),
        })),
      );
      setReady(true);
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: AreaNode[]) => {
    setNodes(next);
    persistLocal(next);
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
      const statewideSlug = `${slug}-all`;
      const nextSort =
        Math.max(0, ...nodes.filter((node) => node.parentId == null).map((n) => n.sortOrder)) + 1;
      const next: AreaNode[] = [
        ...nodes,
        {
          id: stateId,
          slug,
          name: trimmed,
          parentId: null,
          sortOrder: nextSort,
        },
        {
          id: crypto.randomUUID(),
          slug: statewideSlug,
          name: `All of ${trimmed}`,
          parentId: stateId,
          sortOrder: 0,
          statewide: true,
        },
      ];
      commit(next);
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
      const nextSort = options?.statewide
        ? 0
        : Math.max(0, ...siblings.map((item) => item.sortOrder)) + 1;
      commit([
        ...nodes,
        {
          id: crypto.randomUUID(),
          slug,
          name: options?.statewide ? `All of ${state.name}` : trimmed,
          parentId: state.id,
          sortOrder: nextSort,
          statewide: Boolean(options?.statewide),
        },
      ]);
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
      if (!nodes.some((node) => node.slug === slug)) {
        return { ok: false as const, error: 'Area not found.' };
      }
      commit(nodes.map((node) => (node.slug === slug ? { ...node, name: trimmed } : node)));
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const resetToSeed = useCallback(() => {
    commit([...AREA_CATALOGUE]);
  }, [commit]);

  const value = useMemo<AreasAdminStore>(
    () => ({
      nodes,
      ready,
      states: listSeedStates(nodes),
      locationsFor: (stateSlug: string) => listSeedLocationsForState(stateSlug, nodes),
      addState,
      addLocation,
      renameNode,
      resetToSeed,
    }),
    [addLocation, addState, nodes, ready, renameNode, resetToSeed],
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
