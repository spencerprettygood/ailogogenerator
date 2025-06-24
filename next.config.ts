import { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { Configuration as WebpackConfig } from 'webpack';

/**
 * Next.js configuration with proper handling for browser/server environments
 * @type {import('next').NextConfig}
 */
const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  
  return {
    reactStrictMode: true,
    
    // Specify asset handling for images and other static files
    images: {
      domains: [],
      unoptimized: isDev,
    },
    
    // Output standalone to help with deployment
    output: 'standalone',
    
    // Re-enable type checking during build
    typescript: {
      ignoreBuildErrors: false,
    },
    
    // Re-enable ESLint during build
    eslint: {
      ignoreDuringBuilds: false,
    },
    
    // Handle trailing slashes consistently
    trailingSlash: false,
    
    // Add security headers
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
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
      ];
    },
    // Properly configured webpack for browser compatibility
    webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
      // Ensure module and rules are defined
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      
      // Add SVG support
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      });
      
      // Only apply Node.js polyfills in browser environments
      if (!isServer) {
        // Properly handle Node.js modules in browser
        config.resolve = config.resolve || {};
        config.resolve.fallback = {
          ...(config.resolve.fallback || {}),
          fs: false,
          path: false,
          os: false,
          async_hooks: false,
          http: false,
          https: false,
          net: false,
          perf_hooks: false,
          child_process: false,
          tls: false,
        };
      }
      
      return config;
    },
    
    // Explicitly list externals that should not be bundled in server components
    serverExternalPackages: [
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/instrumentation',
      '@opentelemetry/exporter-trace-otlp-proto',
      '@anthropic-ai/sdk',
      'async_hooks'
    ],
  };
};

export default nextConfig;