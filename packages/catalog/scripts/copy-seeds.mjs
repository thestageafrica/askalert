import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src/seeds');
const destDir = join(root, 'dist/seeds');

mkdirSync(destDir, { recursive: true });

for (const name of readdirSync(srcDir)) {
  if (!name.endsWith('.json')) {
    continue;
  }
  copyFileSync(join(srcDir, name), join(destDir, name));
}

console.log('Copied catalog seed JSON into dist/seeds');