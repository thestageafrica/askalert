'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AREA_CATALOGUE,
  listSeedLocationsForState,
  listSeedStates,
  mergeAreaCatalogues,
  normalizeRemoteAreas,
  publicSupabaseEnv,
  tryCreateBrowserClient,
  type AreaNode,
} from '@askalert/db';

function webEnv() {
  return publicSupabaseEnv({
    useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** Lagos seed + live admin-managed areas when Supabase is on. */
export function useServiceAreas() {
  const [nodes, setNodes] = useState<AreaNode[]>(() =>
    mergeAreaCatalogues([], AREA_CATALOGUE),
  );

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const client = tryCreateBrowserClient(webEnv());
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
      if (!cancelled) {
        setNodes(mergeAreaCatalogues(remote, AREA_CATALOGUE));
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      states: listSeedStates(nodes),
      locationsFor: (stateSlug: string) => listSeedLocationsForState(stateSlug, nodes),
      nodes,
    }),
    [nodes],
  );
}
