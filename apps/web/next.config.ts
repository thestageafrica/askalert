import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const require = createRequire(import.meta.url);
const { loadMonorepoEnv } = require('./load-monorepo-env.cjs') as {
  loadMonorepoEnv: (appDir: string) => void;
};
const { assertProductionEnv } = require('./assert-production-env.cjs') as {
  assertProductionEnv: () => void;
};
loadMonorepoEnv(__dirname);
// Only enforce during `next build` so lint/dev stay unblocked.
if (process.argv.includes('build')) {
  assertProductionEnv();
}

// Serwist: precache + offline fallback for the static Cloudflare Pages export.
const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [
    { url: '/offline/', revision },
    { url: '/app/', revision },
  ],
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@askalert/ui',
    '@askalert/payments',
    '@askalert/category-engine',
    '@askalert/channels',
    '@askalert/geo',
    '@askalert/core',
    '@askalert/db',
  ],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['@askalert/ui'],
  },
};

export default withSerwist(nextConfig);
