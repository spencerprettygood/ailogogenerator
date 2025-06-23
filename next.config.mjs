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
  
  // Webpack configuration optimized based on official documentation
  webpack: (config) => {
    // Add proper path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
    };
    
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
  
  // Experimental features
  experimental: {
    // Optimize for Vercel deployments
    optimizePackageImports: ['@lucide-react', '@radix-ui/react-*'],
    // Statically typed routes
    typedRoutes: true,
    // External packages that should be treated as external
    serverComponentsExternalPackages: ['next-themes'],
  },
};

export default nextConfig;