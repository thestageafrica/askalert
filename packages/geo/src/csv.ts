import { geoNodeSchema, type GeoNode } from './schemas';
import { ensureStatewideNodes } from './tree';

export type GeoCsvRow = {
  id: string;
  parent_id: string;
  level: string;
  slug: string;
  name: string;
  aliases: string;
  lat: string;
  lng: string;
  is_statewide: string;
  status: string;
  sort: string;
};

function parseAliases(raw: string): string[] {
  if (!raw.trim()) {
    return [];
  }
  return raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNullableNumber(raw: string): number | null {
  if (!raw.trim()) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Minimal CSV parser for quoted fields and commas. */
export function parseGeoCsv(text: string): GeoCsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]!).map((header) => header.trim().toLowerCase());
  const rows: GeoCsvRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const record: Record<string, string> = {};
    for (const [index, header] of headers.entries()) {
      record[header] = (cells[index] ?? '').trim();
    }
    rows.push({
      id: record.id ?? '',
      parent_id: record.parent_id ?? '',
      level: record.level ?? '',
      slug: record.slug ?? '',
      name: record.name ?? '',
      aliases: record.aliases ?? '',
      lat: record.lat ?? '',
      lng: record.lng ?? '',
      is_statewide: record.is_statewide ?? 'false',
      status: record.status ?? 'active',
      sort: record.sort ?? '0',
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

export function geoNodesFromCsv(text: string): GeoNode[] {
  const rows = parseGeoCsv(text);
  const nodes = rows.map((row) =>
    geoNodeSchema.parse({
      id: row.id,
      parentId: row.parent_id ? row.parent_id : null,
      level: row.level,
      slug: row.slug,
      name: row.name,
      aliases: parseAliases(row.aliases),
      lat: parseNullableNumber(row.lat),
      lng: parseNullableNumber(row.lng),
      isStatewide: row.is_statewide === 'true' || row.is_statewide === '1',
      status: row.status || 'active',
      sort: Number(row.sort) || 0,
    }),
  );
  return ensureStatewideNodes(nodes);
}

export function geoNodesToCsv(nodes: readonly GeoNode[]): string {
  const header =
    'id,parent_id,level,slug,name,aliases,lat,lng,is_statewide,status,sort';
  const lines = nodes.map((node) =>
    [
      node.id,
      node.parentId ?? '',
      node.level,
      node.slug,
      quote(node.name),
      quote(node.aliases.join('|')),
      node.lat ?? '',
      node.lng ?? '',
      node.isStatewide ? 'true' : 'false',
      node.status,
      String(node.sort),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

function quote(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}
