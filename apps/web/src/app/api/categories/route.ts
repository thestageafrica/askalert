import { NextResponse } from 'next/server';
import { loadPublicCategories } from '../../../lib/categories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await loadPublicCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
