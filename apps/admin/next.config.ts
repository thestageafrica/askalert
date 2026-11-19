import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@askalert/ui', '@askalert/payments', '@askalert/category-engine'],
};

export default nextConfig;
