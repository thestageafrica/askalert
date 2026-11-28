import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src/seeds');
const destDir = join(root, 'dist/seeds');

mkdirSync(destDir, { recursive: true });

for (const name of readdirSync(srcDir)) {
  if (!name.endsWith('.json') && !name.endsWith('.csv')) {
    continue;
  }
  copyFileSync(join(srcDir, name), join(destDir, name));
}

console.log('Copied geo seed files into dist/seeds');
