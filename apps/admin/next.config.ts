import { createRequire } from 'node:module';
import type { NextConfig } from 'next';
import { securityHeaders } from './src/lib/security-headers';

const require = createRequire(import.meta.url);
const { loadMonorepoEnv } = require('./load-monorepo-env.cjs') as {
  loadMonorepoEnv: (appDir: string) => void;
};
loadMonorepoEnv(__dirname);

const nextConfig: NextConfig = {
  transpilePackages: [
    '@askalert/ui',
    '@askalert/payments',
    '@askalert/category-engine',
    '@askalert/db',
  ],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
