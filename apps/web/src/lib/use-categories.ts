'use client';

import { useEffect, useState } from 'react';
import {
  findSeedCategoryBySlug,
  listSeedCategories,
  type CategoryConfig,
} from '@askalert/category-engine';
import { getPublicCategoryBySlug, listPublicCategories } from '@askalert/db';
import { webBrowserClient, webSupabaseEnabled, webSupabaseEnv } from './supabase-browser';

export function useCategories(): {
  categories: CategoryConfig[];
  loading: boolean;
  error: string | null;
} {
  const useRemote = webSupabaseEnabled();
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

    const client = webBrowserClient();
    if (!client) {
      setCategories([...listSeedCategories()]);
      setError('Supabase is on but URL/anon key are missing from this build.');
      setLoading(false);
      return;
    }

    void listPublicCategories(client, webSupabaseEnv())
      .then((rows) => {
        if (!cancelled) {
          setCategories(rows.length > 0 ? rows : [...listSeedCategories()]);
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
  const useRemote = webSupabaseEnabled();
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

    const client = webBrowserClient();
    if (!client) {
      setCategory(findSeedCategoryBySlug(slug));
      setError('Supabase is on but URL/anon key are missing from this build.');
      setLoading(false);
      return;
    }

    void getPublicCategoryBySlug(slug, client, webSupabaseEnv())
      .then((row) => {
        if (!cancelled) {
          setCategory(row ?? findSeedCategoryBySlug(slug));
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
