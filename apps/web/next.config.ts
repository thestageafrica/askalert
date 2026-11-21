import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import { securityHeaders } from './src/lib/security-headers';

// Serwist (Workbox successor): first-class Next App Router support, precache +
// runtime caching, and offline document fallbacks without hand-rolling a SW.
const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [
    { url: '/offline', revision },
    { url: '/app', revision },
  ],
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  transpilePackages: [
    '@askalert/ui',
    '@askalert/payments',
    '@askalert/category-engine',
    '@askalert/db',
  ],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['@askalert/ui'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default withSerwist(nextConfig);
