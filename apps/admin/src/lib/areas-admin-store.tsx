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

function upsertOrder(nodes: AreaNode[]): AreaNode[] {
  const states = nodes.filter((node) => node.parentId == null);
  const locations = nodes.filter((node) => node.parentId != null);
  return [...states, ...locations];
}

async function syncUpsert(node: AreaNode): Promise<string | null> {
  if (!adminSupabaseEnabled()) {
    return 'Supabase is not configured on admin.';
  }
  const client = adminBrowserClient();
  if (!client) {
    return 'Could not create Supabase client.';
  }
  const { error } = await client.from('areas').upsert({
    id: node.id,
    slug: node.slug,
    name: node.name,
    parent_id: node.parentId,
    sort_order: node.sortOrder,
  });
  return error?.message ?? null;
}

async function syncDelete(id: string): Promise<string | null> {
  if (!adminSupabaseEnabled()) {
    return null;
  }
  const client = adminBrowserClient();
  if (!client) {
    return 'Could not create Supabase client.';
  }
  const { error } = await client.from('areas').delete().eq('id', id);
  return error?.message ?? null;
}

async function pushAllToRemote(nodes: AreaNode[]): Promise<string | null> {
  for (const node of upsertOrder(nodes)) {
    const error = await syncUpsert(node);
    if (error) {
      return error;
    }
  }
  return null;
}

type AreasAdminStore = {
  nodes: AreaNode[];
  ready: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
  states: AreaNode[];
  locationsFor: (stateSlug: string) => AreaNode[];
  addState: (name: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  addLocation: (
    stateSlug: string,
    name: string,
    options?: { statewide?: boolean },
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  renameNode: (slug: string, name: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeLocation: (slug: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  publishToServer: () => Promise<{ ok: true } | { ok: false; error: string }>;
  resetToSeed: () => void;
};

const AreasAdminContext = createContext<AreasAdminStore | null>(null);

export function AreasAdminProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<AreaNode[]>(() => mergeAreaCatalogues([], AREA_CATALOGUE));
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

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
      if (cancelled) {
        return;
      }
      if (!error && data?.length) {
        const remote = normalizeRemoteAreas(
          data.map((row) => ({
            id: String(row.id),
            slug: String(row.slug),
            name: String(row.name),
            parent_id: (row.parent_id as string | null) ?? null,
            sort_order: Number(row.sort_order ?? 0),
          })),
        );
        next = mergeAreaCatalogues(next, remote);
        if (!cancelled) {
          setNodes(next);
          persistLocal(next);
        }
      }

      // Push local/admin catalogue to Supabase so vendor onboarding can read it.
      const pushError = await pushAllToRemote(next);
      if (cancelled) {
        return;
      }
      if (pushError) {
        setSyncError(
          `Could not sync areas to the server: ${pushError}. Vendor onboarding will not see new states until this works.`,
        );
        return;
      }
      setSyncError(null);
      setLastSyncedAt(new Date().toISOString());
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
    return merged;
  }, []);

  const addState = useCallback(
    async (name: string) => {
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
      const stateError = await syncUpsert(state);
      if (stateError) {
        setSyncError(stateError);
        return {
          ok: false as const,
          error: `Saved in admin only. Server sync failed: ${stateError}`,
        };
      }
      const statewideError = await syncUpsert(statewide);
      if (statewideError) {
        setSyncError(statewideError);
        return {
          ok: false as const,
          error: `Saved in admin only. Server sync failed: ${statewideError}`,
        };
      }
      setSyncError(null);
      setLastSyncedAt(new Date().toISOString());
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const addLocation = useCallback(
    async (stateSlug: string, name: string, options?: { statewide?: boolean }) => {
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
      const error = await syncUpsert(location);
      if (error) {
        setSyncError(error);
        return {
          ok: false as const,
          error: `Saved in admin only. Server sync failed: ${error}`,
        };
      }
      setSyncError(null);
      setLastSyncedAt(new Date().toISOString());
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const renameNode = useCallback(
    async (slug: string, name: string) => {
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
      const error = await syncUpsert(updated);
      if (error) {
        setSyncError(error);
        return { ok: false as const, error: `Rename saved locally only: ${error}` };
      }
      setSyncError(null);
      setLastSyncedAt(new Date().toISOString());
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const removeLocation = useCallback(
    async (slug: string) => {
      const existing = nodes.find((node) => node.slug === slug);
      if (!existing) {
        return { ok: false as const, error: 'Location not found.' };
      }
      if (existing.parentId == null) {
        return { ok: false as const, error: 'Remove locations, not the state itself.' };
      }
      commit(nodes.filter((node) => node.slug !== slug));
      const error = await syncDelete(existing.id);
      if (error) {
        setSyncError(error);
        return { ok: false as const, error: `Removed locally only: ${error}` };
      }
      setSyncError(null);
      setLastSyncedAt(new Date().toISOString());
      return { ok: true as const };
    },
    [commit, nodes],
  );

  const publishToServer = useCallback(async () => {
    const error = await pushAllToRemote(nodes);
    if (error) {
      setSyncError(error);
      return { ok: false as const, error };
    }
    setSyncError(null);
    setLastSyncedAt(new Date().toISOString());
    return { ok: true as const };
  }, [nodes]);

  const resetToSeed = useCallback(() => {
    const seeded = mergeAreaCatalogues([], AREA_CATALOGUE);
    setNodes(seeded);
    persistLocal(seeded);
  }, []);

  const value = useMemo<AreasAdminStore>(
    () => ({
      nodes,
      ready,
      syncError,
      lastSyncedAt,
      states: listSeedStates(nodes),
      locationsFor: (stateSlug: string) => listSeedLocationsForState(stateSlug, nodes),
      addState,
      addLocation,
      renameNode,
      removeLocation,
      publishToServer,
      resetToSeed,
    }),
    [
      addLocation,
      addState,
      lastSyncedAt,
      nodes,
      ready,
      removeLocation,
      renameNode,
      publishToServer,
      resetToSeed,
      syncError,
    ],
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
