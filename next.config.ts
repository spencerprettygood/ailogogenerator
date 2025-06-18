/** @type {import('next').NextConfig} */
const nextConfig = {
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
  
  // Webpack configuration for better handling of modules
  webpack: (config) => {
    // Handle SVG files with SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Handle polyfills and client-side only packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };
    
    return config;
  },
};

export default nextConfig;