import type { AliasEntity, AliasLanguage } from './schemas';

export type AliasRecord = {
  entity: AliasEntity;
  entityId: string;
  entitySlug: string;
  alias: string;
  language: AliasLanguage;
};

export type AliasMatchResult = {
  entity: AliasEntity;
  entityId: string;
  alias: string;
  language: AliasLanguage;
  confidence: number;
};

const ENTITY_PRIORITY: Record<AliasEntity, number> = {
  service: 3,
  type: 2,
  category: 1,
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(input: string): Set<string> {
  return new Set(normalizeText(input).split(' ').filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function matchAlias(
  text: string,
  aliases: readonly AliasRecord[],
): AliasMatchResult | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const textTokens = tokenSet(normalized);
  let best: AliasMatchResult | undefined;

  for (const record of aliases) {
    const aliasNorm = normalizeText(record.alias);
    if (!aliasNorm) {
      continue;
    }

    let confidence = 0;
    if (normalized === aliasNorm) {
      confidence = 1;
    } else if (
      normalized.includes(aliasNorm) ||
      aliasNorm.includes(normalized)
    ) {
      confidence = 0.92;
    } else {
      const aliasTokens = tokenSet(aliasNorm);
      confidence = jaccard(textTokens, aliasTokens);
      if (confidence < 0.5) {
        continue;
      }
      confidence = Math.min(0.89, confidence);
    }

    const candidate: AliasMatchResult = {
      entity: record.entity,
      entityId: record.entityId,
      alias: record.alias,
      language: record.language,
      confidence,
    };

    if (!best || confidence > best.confidence) {
      best = candidate;
      continue;
    }
    if (confidence < best.confidence) {
      continue;
    }

    const entityScore = ENTITY_PRIORITY[record.entity] - ENTITY_PRIORITY[best.entity];
  if (entityScore > 0 || (entityScore === 0 && record.alias.length > best.alias.length)) {
      best = candidate;
    }
  }

  return best;
}

export function flattenSnapshotAliases(
  records: readonly {
    entity: AliasEntity;
    entity_slug: string;
    alias: string;
    language: AliasLanguage;
  }[],
  categorySlug: string,
): AliasRecord[] {
  return records.map((row) => ({
    entity: row.entity,
    entityId: `${categorySlug}:${row.entity_slug}`,
    entitySlug: row.entity_slug,
    alias: row.alias,
    language: row.language,
  }));
}