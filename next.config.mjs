// @ts-check
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  
  // Output standalone for optimized deployment on Vercel
  output: 'standalone',
  
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
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
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
        'fs': false,
        'path': false,
        'os': false,
        'crypto': false,
        'stream': false,
        'http': false,
        'https': false,
        'zlib': false,
        'async_hooks': false,
      };
      
      // Production optimizations
      if (!dev) {
        const webpack = require('webpack');
        
        // Ignore certain modules in the browser
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^(node-fetch|encoding)$/,
          })
        );
      }
    }
    
    // Ensure extensions are properly configured
    config.resolve.extensions = [
      '.tsx', 
      '.ts', 
      '.js', 
      '.jsx', 
      '.json', 
      ...(config.resolve.extensions || [])
    ];
    
    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // Package optimization (no longer experimental in Next.js 15)
  optimizePackageImports: ['@lucide-react', '@radix-ui/react-*'],
  
  // External packages that should be transpiled (renamed from serverComponentsExternalPackages)
  transpilePackages: [
    'next-themes',
    '@opentelemetry/api',
    '@opentelemetry/core',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/instrumentation',
    '@opentelemetry/exporter-trace-otlp-proto',
    '@anthropic-ai/sdk',
  ],
};

export default nextConfig;