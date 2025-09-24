import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mvforster-talent-solutions',
  images: {
    unoptimized: true,
  },
  // Remove duplicate experimental config as it's not needed
  distDir: 'out', // Explicitly set the output directory
};

export default nextConfig;
