import { categoryConfigSchema, listSeedCategories, findSeedCategoryBySlug, validateConfig, } from '@askalert/category-engine';
import { isSupabaseEnabled } from './feature-flag';
function parseConfig(raw) {
    const result = categoryConfigSchema.safeParse(raw);
    if (!result.success) {
        throw new Error(`Invalid category config in database: ${result.error.message}`);
    }
    return result.data;
}
/** Public web: Live categories from Supabase, or mock seeds when the flag is off. */
export async function listPublicCategories(client, env = process.env) {
    if (!isSupabaseEnabled(env) || !client) {
        return [...listSeedCategories()];
    }
    const { data: categories, error } = await client
        .from('categories')
        .select('id, slug, name, icon, status, current_version_id')
        .in('status', ['live', 'pilot'])
        .order('name');
    if (error) {
        throw new Error(`Failed to list live categories: ${error.message}`);
    }
    if (!categories || categories.length === 0) {
        return [];
    }
    const versionIds = categories
        .map((row) => row.current_version_id)
        .filter((id) => Boolean(id));
    if (versionIds.length === 0) {
        return [];
    }
    const { data: versions, error: versionError } = await client
        .from('category_versions')
        .select('id, config')
        .in('id', versionIds)
        .eq('published', true);
    if (versionError) {
        throw new Error(`Failed to load category versions: ${versionError.message}`);
    }
    const byId = new Map((versions ?? []).map((row) => [row.id, row.config]));
    return categories
        .map((category) => {
        if (!category.current_version_id) {
            return null;
        }
        const raw = byId.get(category.current_version_id);
        if (!raw) {
            return null;
        }
        return parseConfig(raw);
    })
        .filter((config) => config !== null);
}
export async function getPublicCategoryBySlug(slug, client, env = process.env) {
    if (!isSupabaseEnabled(env) || !client) {
        return findSeedCategoryBySlug(slug);
    }
    const { data: category, error } = await client
        .from('categories')
        .select('id, current_version_id, status')
        .eq('slug', slug)
        .in('status', ['live', 'pilot'])
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to load category "${slug}": ${error.message}`);
    }
    if (!category?.current_version_id) {
        return undefined;
    }
    const { data: version, error: versionError } = await client
        .from('category_versions')
        .select('config, published')
        .eq('id', category.current_version_id)
        .eq('published', true)
        .maybeSingle();
    if (versionError) {
        throw new Error(`Failed to load version for "${slug}": ${versionError.message}`);
    }
    if (!version) {
        return undefined;
    }
    return parseConfig(version.config);
}
/**
 * Admin publish flow (service-role client).
 * Validates config, inserts a new version + attributes + requirements,
 * and points the category at the new version.
 */
export async function publishCategoryVersion(client, input) {
    const nextStatus = input.nextStatus ?? input.config.status;
    const candidate = { ...input.config, status: nextStatus };
    const validation = validateConfig(candidate);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors };
    }
    const { data: existingVersions, error: countError } = await client
        .from('category_versions')
        .select('version_number')
        .eq('category_id', input.categoryId)
        .order('version_number', { ascending: false })
        .limit(1);
    if (countError) {
        return { ok: false, errors: [countError.message] };
    }
    const versionNumber = (existingVersions?.[0]?.version_number ?? 0) + 1;
    const published = nextStatus === 'live' || nextStatus === 'pilot';
    const { data: version, error: insertError } = await client
        .from('category_versions')
        .insert({
        category_id: input.categoryId,
        version_number: versionNumber,
        note: input.note.trim() || 'Published update',
        status: nextStatus,
        published,
        published_at: published ? new Date().toISOString() : null,
        config: validation.config,
        created_by: input.actor ?? 'admin',
    })
        .select('id, version_number')
        .single();
    if (insertError || !version) {
        return { ok: false, errors: [insertError?.message ?? 'Failed to insert version.'] };
    }
    const attributeRows = validation.config.attributes.map((attr, index) => ({
        category_version_id: version.id,
        key: attr.key,
        label: attr.label,
        type: attr.type,
        required: attr.required,
        applies_to: attr.applies_to,
        options: (attr.options ?? null),
        unit: attr.unit ?? null,
        validation: (attr.validation ?? null),
        sort_order: index,
    }));
    if (attributeRows.length > 0) {
        const { error: attrError } = await client.from('category_attributes').insert(attributeRows);
        if (attrError) {
            return { ok: false, errors: [attrError.message] };
        }
    }
    const requirementRows = validation.config.vendor_requirements.map((requirement, index) => ({
        category_version_id: version.id,
        requirement,
        sort_order: index,
    }));
    if (requirementRows.length > 0) {
        const { error: reqError } = await client.from('vendor_requirements').insert(requirementRows);
        if (reqError) {
            return { ok: false, errors: [reqError.message] };
        }
    }
    const { error: updateError } = await client
        .from('categories')
        .update({
        name: validation.config.name,
        icon: validation.config.icon,
        status: nextStatus,
        current_version_id: version.id,
    })
        .eq('id', input.categoryId);
    if (updateError) {
        return { ok: false, errors: [updateError.message] };
    }
    return { ok: true, versionId: version.id, versionNumber: version.version_number };
}
/** Admin list (service role): all categories with current config. */
export async function listManagedCategories(client) {
    const { data: categories, error } = await client
        .from('categories')
        .select('*')
        .order('name');
    if (error) {
        throw new Error(`Failed to list categories: ${error.message}`);
    }
    const results = [];
    for (const category of categories ?? []) {
        if (!category.current_version_id) {
            continue;
        }
        const { data: version, error: versionError } = await client
            .from('category_versions')
            .select('config')
            .eq('id', category.current_version_id)
            .single();
        if (versionError || !version) {
            throw new Error(`Failed to load version for ${category.slug}: ${versionError?.message ?? 'missing'}`);
        }
        const { data: attributes, error: attrError } = await client
            .from('category_attributes')
            .select('*')
            .eq('category_version_id', category.current_version_id)
            .order('sort_order');
        if (attrError) {
            throw new Error(`Failed to load attributes for ${category.slug}: ${attrError.message}`);
        }
        results.push({
            ...category,
            config: parseConfig(version.config),
            attributes: attributes ?? [],
        });
    }
    return results;
}
export async function listAreas(client) {
    const { data, error } = await client
        .from('areas')
        .select('*')
        .order('sort_order');
    if (error) {
        throw new Error(`Failed to list areas: ${error.message}`);
    }
    return data ?? [];
}
//# sourceMappingURL=categories.js.map