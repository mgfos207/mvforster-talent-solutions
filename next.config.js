/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/mvforster-talent-solutions',
  images: {
    unoptimized: true,
  },
  experimental: {
    images: {
      unoptimized: true,
    },
  },
};

export default nextConfig;
