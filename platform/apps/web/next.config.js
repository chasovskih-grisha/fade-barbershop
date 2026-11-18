const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const createNextIntlPlugin = require('next-intl/plugin');

// next-intl: локалі й каталоги повідомлень живуть у `src/i18n.ts` (T-4612b).
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  transpilePackages: ['@fade/contracts', '@fade/domain-shared', '@fade/design-tokens', '@fade/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { dev, isServer }) {
    // Dev containers keep node_modules from image build (ADR 0018) and bind-mount
    // packages/. Alias the kit so a stale image still resolves the lockup.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@fade/brand-assets/assets': path.resolve(__dirname, '../../packages/brand-assets/assets'),
    };

    if (!dev && !isServer) {
      config.plugins.push(
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      );
    }

    return config;
  },
  async rewrites() {
    const api = process.env.API_ORIGIN ?? 'http://localhost:13000';
    return [
      { source: '/locations/nearest', destination: `${api}/locations/nearest` },
      { source: '/booking/:path*', destination: `${api}/booking/:path*` },
      { source: '/appointments/:path*', destination: `${api}/appointments/:path*` },
      { source: '/haircut-ai/:path*', destination: `${api}/haircut-ai/:path*` },
      { source: '/identity/:path*', destination: `${api}/identity/:path*` },
      { source: '/content/articles/:path*', destination: `${api}/content/articles/:path*` },
      // RUM-маяк Core Web Vitals (T-4204) — той самий origin, без CORS.
      { source: '/telemetry/:path*', destination: `${api}/telemetry/:path*` },
    ];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

module.exports = withNextIntl(nextConfig);
