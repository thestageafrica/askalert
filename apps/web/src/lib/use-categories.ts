'use client';

import { useEffect, useState } from 'react';
import {
  findSeedCategoryBySlug,
  listSeedCategories,
  type CategoryConfig,
} from '@askalert/category-engine';
import { isSupabaseEnabled } from '@askalert/db';

function supabaseOnClient(): boolean {
  return isSupabaseEnabled({
    NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE,
    USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function useCategories(): {
  categories: CategoryConfig[];
  loading: boolean;
  error: string | null;
} {
  const useRemote = supabaseOnClient();
  const [categories, setCategories] = useState<CategoryConfig[]>(() =>
    useRemote ? [] : [...listSeedCategories()],
  );
  const [loading, setLoading] = useState(useRemote);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useRemote) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch('/api/categories')
      .then(async (response) => {
        const body = (await response.json()) as {
          categories?: CategoryConfig[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? 'Could not load categories');
        }
        if (!cancelled) {
          setCategories(body.categories ?? []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load categories');
          setCategories([...listSeedCategories()]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [useRemote]);

  return { categories, loading, error };
}

export function useCategory(slug: string): {
  category: CategoryConfig | undefined;
  loading: boolean;
  error: string | null;
} {
  const useRemote = supabaseOnClient();
  const [category, setCategory] = useState<CategoryConfig | undefined>(() =>
    useRemote ? undefined : findSeedCategoryBySlug(slug),
  );
  const [loading, setLoading] = useState(useRemote);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useRemote) {
      setCategory(findSeedCategoryBySlug(slug));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/categories/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const body = (await response.json()) as {
          category?: CategoryConfig;
          error?: string;
        };
        if (response.status === 404) {
          if (!cancelled) {
            setCategory(undefined);
            setError(null);
          }
          return;
        }
        if (!response.ok) {
          throw new Error(body.error ?? 'Could not load category');
        }
        if (!cancelled) {
          setCategory(body.category);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load category');
          setCategory(findSeedCategoryBySlug(slug));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, useRemote]);

  return { category, loading, error };
}
