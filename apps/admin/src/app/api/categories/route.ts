import { NextResponse } from 'next/server';
import {
  createServerClient,
  isSupabaseEnabled,
  listManagedCategories,
} from '@askalert/db';
import { listSeedCategories } from '@askalert/category-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({
        source: 'mock',
        categories: listSeedCategories(),
      });
    }

    const client = createServerClient(process.env, { useServiceRole: true });
    const categories = await listManagedCategories(client);
    return NextResponse.json({
      source: 'supabase',
      categories: categories.map((row) => ({
        id: row.id,
        slug: row.slug,
        vendorsCount: 0,
        draft: row.config,
        status: row.status,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
