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
    // Custom telemetry system instead of OpenTelemetry
    // Block all OpenTelemetry modules completely by redirecting to our blocker
    '@opentelemetry/api': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/context-async-hooks': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/sdk-trace-base': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/sdk-trace-node': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/auto-instrumentations-node': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/core': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/resources': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/semantic-conventions': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/sdk-metrics': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/sdk-trace-web': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/sdk-metrics-base': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/web': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/tracing': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/exporter-trace-otlp-http': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/exporter-metrics-otlp-http': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/exporter-collector': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/exporter-zipkin': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/exporter-jaeger': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/context-zone': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/context-zone-peer-dep': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/plugin-http': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/plugin-https': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/plugin-express': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/plugin-user-interaction': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation-http': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation-https': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation-express': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation-fetch': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation-xml-http-request': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/instrumentation-grpc': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/node': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/propagator-b3': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/propagator-jaeger': require.resolve('./opentelemetry-blocker.js'),
    '@opentelemetry/sdk': require.resolve('./opentelemetry-blocker.js'),
    // Block all telemetry-related packages to be safe
    'opentelemetry-node': false,
    'opentelemetry-web': false,
    'opentelemetry': false,
    'applicationinsights': false,
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