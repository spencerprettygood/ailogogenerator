import { createWebpackConfig } from './lib/webpack-config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Telemetry system replaces OpenTelemetry
  // External packages for server components
  serverExternalPackages: ['sharp'],
  
  // Modern experimental features
  experimental: {
    // Add any Next.js 15 experimental features here
  },
  reactStrictMode: true,
  
  // Specify asset handling for images and other static files
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Asset prefix for production (if needed)
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // Output standalone to help with deployment
  output: 'standalone',

  // Disable type checking during build (temporarily for development)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build (temporarily for development)
  eslint: {
    ignoreDuringBuilds: true,
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
  
  // Webpack configuration with telemetry support
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle SVG files with SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Apply our custom webpack configuration with telemetry
    config = createWebpackConfig(config, { isServer });
    
    return config;
  },
};

export default nextConfig;