/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'images.unsplash.com', 'example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Disable image optimization warnings for invalid remote URLs
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Optimize for production
  swcMinify: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Skip ESLint during builds when SKIP_LINT is set (useful for Docker builds)
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_LINT === 'true',
  },
  // Ensure native modules are properly bundled
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/bcrypt/**/*'],
    },
  },
};

module.exports = nextConfig;
