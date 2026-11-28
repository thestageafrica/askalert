#!/usr/bin/env node
/**
 * Admin-friendly geo CSV import helper.
 * Usage: node packages/geo/scripts/import-csv.mjs path/to/nodes.csv
 * Prints validated node count and duplicate check summary (JSON to stdout).
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node packages/geo/scripts/import-csv.mjs <file.csv>');
    process.exit(1);
  }

  // Dynamic import of built package when available; fall back to src via tsx in tests.
  const { geoNodesFromCsv } = await import('../dist/index.js');
  const text = readFileSync(file, 'utf8');
  const nodes = geoNodesFromCsv(text);
  const slugs = nodes.map((node) => node.slug);
  const unique = new Set(slugs);
  console.log(
    JSON.stringify(
      {
        count: nodes.length,
        uniqueSlugs: unique.size,
        duplicates: slugs.length - unique.size,
        states: nodes.filter((node) => node.level === 'state').map((node) => node.slug),
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
