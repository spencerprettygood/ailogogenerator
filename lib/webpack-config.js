/**
 * Enhanced webpack configuration for Next.js
 * Optimized for logo generation app with proper bundle optimization
 */

/**
 * Creates webpack configurations with optimizations
 * @param {Object} config - The existing webpack configuration
 * @param {Object} options - Build options including isServer flag
 * @returns {Object} The modified webpack configuration
 */
function createWebpackConfig(config, { isServer = false } = {}) {
  // Client-side optimizations
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      // Disable Node.js modules that don't work in browser
      async_hooks: false,
      util: false,
      stream: false,
      buffer: false,
    };
  }

  // Alias configuration - use our telemetry system
  config.resolve.alias = {
    ...config.resolve.alias,
    // No OpenTelemetry aliasing or hacks. Use only custom telemetry if needed.
  };

  // External dependencies that should not be bundled
  if (isServer) {
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        // External libraries for server-side only
        sharp: 'sharp',
        canvas: 'canvas',
      });
    }
  }

  return config;
}

/**
 * Production optimizations
 * @param {Object} config - The webpack configuration to optimize
 * @returns {Object} The optimized webpack configuration
 */
function addProductionOptimizations(config) {
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Bundle SVG libraries separately
        svgLibs: {
          test: /[\\/]node_modules[\\/](svgo|svg-parser|svg-pathdata)[\\/]/,
          name: 'svg-libs',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Bundle animation libraries separately
        animationLibs: {
          test: /[\\/]node_modules[\\/](framer-motion|popmotion|gsap)[\\/]/,
          name: 'animation-libs',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Bundle common framework libraries
        framework: {
          chunks: 'all',
          name: 'framework',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          priority: 40,
          enforce: true,
        },
        // Bundle UI libraries
        ui: {
          chunks: 'all',
          name: 'ui',
          test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|shadcn)[\\/]/,
          priority: 30,
          enforce: true,
        },
        telemetry: {
          test: /[\\/]lib[\\/]telemetry[\\/]/,
          name: 'telemetry',
          chunks: 'all',
          priority: 15,
        },
      },
    },
  };
  return config;
}

module.exports = { createWebpackConfig, addProductionOptimizations };
