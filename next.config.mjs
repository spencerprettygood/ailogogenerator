// @ts-check
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

// Get directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env files
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.info('Loading environment variables in next.config.mjs');
console.info('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  // Output standalone for optimized deployment on Vercel
  output: 'standalone',

  // Exclude test pages from production builds
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      typedRoutes: true,
    },
    async rewrites() {
      return [
        {
          source: '/test/:path*',
          destination: '/404',
        },
        {
          source: '/test-:path*',
          destination: '/404',
        },
      ];
    },
  }),

  // Type checking and linting settings
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'development',
  },

  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'development',
  },

  // Image optimization configuration
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Reduce bundle size with file compression
  compress: true,

  // Trailing slash for consistency
  trailingSlash: false,

  // Enhance with security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },

  // Webpack configuration optimized based on Next.js 15 documentation
  webpack: (config, { isServer, dev }) => {
    // Add proper path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Only apply these optimizations for client bundles
    if (!isServer) {
      // Polyfill handling for browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        async_hooks: false,
      };

      // Production optimizations - simplified approach
      if (!dev) {
        // Simply exclude problematic modules from client bundle
        config.externals = config.externals || {};
        if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
          config.externals['node-fetch'] = 'node-fetch';
          config.externals['encoding'] = 'encoding';
        }
      }
    }

    // Ensure extensions are properly configured
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.js',
      '.jsx',
      '.json',
      ...(config.resolve.extensions || []),
    ];

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // External packages that should be transpiled
  serverExternalPackages: ['next-themes', '@anthropic-ai/sdk'],

  // Explicitly provide environment variables (only non-sensitive, client-side vars)
  env: {
    // NODE_ENV is handled automatically by Next.js - removed to prevent conflicts
    NEXT_PUBLIC_ENABLE_ANIMATION_FEATURES: process.env.ENABLE_ANIMATION_FEATURES || 'true',
    NEXT_PUBLIC_ENABLE_MOCKUPS: process.env.ENABLE_MOCKUPS || 'true',
    NEXT_PUBLIC_CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS || '3600',
  },
};

export default nextConfig;
