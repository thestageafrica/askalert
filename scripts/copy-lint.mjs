#!/usr/bin/env node
/**
 * Prompt 38 copy-lint: fail when user-facing *string* copy claims AskAlert holds or
 * protects customer funds while escrow is not live-approved.
 *
 * Scans quoted string literals and simple JSX text nodes (not code identifiers).
 * Allowed exact phrase: "Protected payments are coming soon".
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMING_SOON = 'Protected payments are coming soon';

const ESCROW_BANNED_PATTERNS = [
  /\bescrow\b/i,
  /\bheld funds?\b/i,
  /\bprotected funds?\b/i,
  /\brelease funds?\b/i,
  /\bsafekeeping\b/i,
  /\baskalert holds\b/i,
  /\bprotected by askalert\b/i,
  /\bhold(?:s|ing)? (?:your |customer )?money\b/i,
  /\bkeep(?:s|ing)? your money safe\b/i,
  /\bhold payment\b/i,
  /\bprotect(?:ed|ing)? (?:your )?payment(?!s are coming soon)\b/i,
];

const SCAN_ROOTS = ['apps/web/src', 'apps/admin/src', 'packages/ui/src', 'packages/emails'];
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', '.next', 'out', 'coverage', '.turbo']);

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());
}

function escrowWordingAllowed() {
  const enabled = truthy(process.env.ESCROW_ENABLED ?? process.env.NEXT_PUBLIC_ESCROW_ENABLED);
  const live = truthy(process.env.ESCROW_LIVE);
  const partnerComplete = [
    process.env.ESCROW_PARTNER_LEGAL_NAME,
    process.env.ESCROW_PARTNER_LICENCE_NUMBER,
    process.env.ESCROW_PARTNER_LICENCE_ISSUER,
    process.env.ESCROW_PARTNER_INSTITUTION_NAME,
  ].every((value) => Boolean(value && String(value).trim()));
  return enabled && live && partnerComplete;
}

function extractCopySnippets(source) {
  const snippets = [];
  const stringLiteral = /(['"`])(?:\\.|(?!\1)[\s\S])*\1/g;
  let match;
  while ((match = stringLiteral.exec(source)) !== null) {
    const raw = match[0];
    const text = raw.slice(1, -1);
    // Skip import paths and code identifiers / property keys (e.g. ['escrow']).
    if (raw.includes('/') && !text.includes(' ')) {
      continue;
    }
    if (/^[A-Za-z][A-Za-z0-9_]*$/.test(text)) {
      continue;
    }
    snippets.push({
      text,
      index: match.index,
    });
  }

  const jsxText = />([^<{]+)</g;
  while ((match = jsxText.exec(source)) !== null) {
    const text = match[1].trim();
    if (text) {
      snippets.push({ text, index: match.index });
    }
  }

  return snippets;
}

function snippetAllowed(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.toLowerCase().includes(COMING_SOON.toLowerCase())) {
    return true;
  }
  if (
    /\bstaged payout\b|\bfull payout now\b|\blater release\b|\bsandbox\b|\bis released after you confirm the job\b/i.test(
      trimmed,
    ) &&
    !/\bescrow\b|\baskalert holds\b|\bprotected funds?\b|\bheld funds?\b|\bprotect(?:ed|ing)? (?:your )?payment\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
      continue;
    }
    if (/\.(tsx?|jsx?|mdx?|html)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  if (escrowWordingAllowed()) {
    console.log('copy-lint: escrow wording allowed (live + partner details). OK');
    return;
  }

  const hits = [];
  for (const rel of SCAN_ROOTS) {
    const abs = path.join(root, rel);
    let files = [];
    try {
      files = await walk(abs);
    } catch {
      continue;
    }
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      for (const snippet of extractCopySnippets(text)) {
        if (snippetAllowed(snippet.text)) {
          continue;
        }
        for (const pattern of ESCROW_BANNED_PATTERNS) {
          if (pattern.test(snippet.text)) {
            hits.push({
              file: path.relative(root, file),
              line: lineNumberAt(text, snippet.index),
              pattern: pattern.source,
              excerpt: snippet.text.replace(/\s+/g, ' ').trim().slice(0, 140),
            });
          }
        }
      }
    }
  }

  if (hits.length > 0) {
    console.error(
      'copy-lint failed: escrow wording appears while ESCROW_ENABLED is not live-approved.\n',
    );
    for (const hit of hits.slice(0, 50)) {
      console.error(`- ${hit.file}:${hit.line} [${hit.pattern}] ${hit.excerpt}`);
    }
    if (hits.length > 50) {
      console.error(`…and ${hits.length - 50} more`);
    }
    process.exit(1);
  }

  console.log('copy-lint: no banned escrow wording in user-facing sources. OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
