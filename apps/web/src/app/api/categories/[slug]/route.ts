import { NextResponse } from 'next/server';
import { loadPublicCategoryBySlug } from '../../../../lib/categories';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const category = await loadPublicCategoryBySlug(slug);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
