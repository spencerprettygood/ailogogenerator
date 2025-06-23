#!/bin/bash

# Standard approach to fixing webpack issues in Next.js 15
# Following official Next.js documentation

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Verifying next.config.js is valid..."
if [ -f "next.config.js" ]; then
  echo "  ✓ Found next.config.js"
else
  echo "  ✗ Could not find next.config.js"
  echo "  Creating standard next.config.js..."
  cat > next.config.js << 'EOL'
// @ts-check
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add proper path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
    };
    
    // Ensure extensions are properly configured
    config.resolve.extensions = [
      '.tsx', '.ts', '.js', '.jsx', '.json', 
      ...(config.resolve.extensions || [])
    ];
    
    return config;
  },
  
  experimental: {
    serverComponentsExternalPackages: ['next-themes'],
  },
};

module.exports = nextConfig;
EOL
  echo "  ✓ Created standard next.config.js"
fi

echo "🔄 Clearing module cache and restarting..."
echo "   Run: npm run dev"

# Instructions for testing
echo ""
echo "To test if the webpack error is fixed:"
echo "1. Run: npm run dev"
echo "2. Check if the application loads without the webpack error"
echo ""
echo "If you still encounter issues, consider:"
echo "- Checking for circular dependencies in your components"
echo "- Verifying proper 'use client' directives"
echo "- Updating all Next.js dependencies"
echo ""
echo "For more information, see WEBPACK_FIX_STANDARD.md"