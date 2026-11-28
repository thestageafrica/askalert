import { createRequire } from 'node:module';
import type { NextConfig } from 'next';

const require = createRequire(import.meta.url);
const { loadMonorepoEnv } = require('./load-monorepo-env.cjs') as {
  loadMonorepoEnv: (appDir: string) => void;
};
loadMonorepoEnv(__dirname);

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
    '@askalert/catalog',
    '@askalert/conversation',
    '@askalert/geo',
    '@askalert/core',
    '@askalert/db',
  ],
  poweredByHeader: false,
};

export default nextConfig;
