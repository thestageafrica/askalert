/**
 * Prefer: pnpm exec / PowerShell script next to this file.
 * Source of truth: public/brand/askalert-icon.png
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ps1 = join(__dirname, 'generate-pwa-icons.ps1');
const result = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1], {
  encoding: 'utf-8',
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
