import { NextResponse } from 'next/server';
import { categoryConfigSchema } from '@askalert/category-engine';
import {
  createServerClient,
  isSupabaseEnabled,
  publishCategoryVersion,
  resolveCategoryId,
} from '@askalert/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  config: categoryConfigSchema,
  note: z.string().default(''),
  nextStatus: z.enum(['draft', 'pilot', 'live', 'paused']).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json(
        { error: 'Supabase is disabled. Publishing stays in the mock admin store.' },
        { status: 400 },
      );
    }

    const { id } = await params;
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid publish payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = createServerClient(process.env, { useServiceRole: true });
    const categoryId = await resolveCategoryId(client, id);
    if (!categoryId) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            `No category found for "${id}". Load categories from Supabase first, then publish.`,
          ],
        },
        { status: 404 },
      );
    }

    const result = await publishCategoryVersion(client, {
      categoryId,
      config: parsed.data.config,
      note: parsed.data.note,
      nextStatus: parsed.data.nextStatus,
      actor: 'admin',
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      categoryId,
      versionId: result.versionId,
      versionNumber: result.versionNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
