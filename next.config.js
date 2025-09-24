/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/mvforster-talent-solutions',
  images: {
    unoptimized: true,
  },
  distDir: 'out',
};

module.exports = nextConfig;
