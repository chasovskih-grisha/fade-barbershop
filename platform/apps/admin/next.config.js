const path = require('path');

/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.ADMIN_API_UPSTREAM || 'http://localhost:13000';

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  transpilePackages: ['@fade/contracts', '@fade/domain-shared', '@fade/design-tokens', '@fade/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // Dev containers keep node_modules from the image and bind-mount packages/.
    // Alias the kit so a stale image still resolves the lockup.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@fade/brand-assets/assets': path.resolve(__dirname, '../../packages/brand-assets/assets'),
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: `${API_ORIGIN}/admin/:path*`,
      },
      {
        source: '/identity/:path*',
        destination: `${API_ORIGIN}/identity/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
