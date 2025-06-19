/**
 * Enhanced webpack configuration for Next.js
 * Optimized for logo generation app with telemetry support
 * 
 * IMPORTANT: This configuration completely disables OpenTelemetry
 * to prevent issues with async_hooks and other Node.js-specific APIs
 * in browser environments.
 */

/**
 * Creates webpack configurations with telemetry support
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
    // '@telemetry': require.resolve('./telemetry'), // Path resolution issues in config
    // Completely disable all OpenTelemetry modules
    '@opentelemetry/api': false,
    '@opentelemetry/context-async-hooks': false,
    '@opentelemetry/instrumentation': false,
    '@opentelemetry/sdk-trace-base': false,
    '@opentelemetry/sdk-trace-node': false,
    '@opentelemetry/auto-instrumentations-node': false,
    '@opentelemetry/core': false,
    '@opentelemetry/resources': false,
    '@opentelemetry/semantic-conventions': false,
    '@opentelemetry/sdk-metrics': false,
    '@opentelemetry/sdk-trace-web': false,
    '@opentelemetry/sdk-metrics-base': false,
    '@opentelemetry/web': false,
    '@opentelemetry/tracing': false,
    '@opentelemetry/exporter-trace-otlp-http': false,
    '@opentelemetry/exporter-metrics-otlp-http': false,
    '@opentelemetry/exporter-collector': false,
    '@opentelemetry/exporter-zipkin': false,
    '@opentelemetry/exporter-jaeger': false,
    '@opentelemetry/context-zone': false,
    '@opentelemetry/context-zone-peer-dep': false,
    '@opentelemetry/plugin-http': false,
    '@opentelemetry/plugin-https': false,
    '@opentelemetry/plugin-express': false,
    '@opentelemetry/plugin-user-interaction': false,
    '@opentelemetry/instrumentation-http': false,
    '@opentelemetry/instrumentation-https': false,
    '@opentelemetry/instrumentation-express': false,
    '@opentelemetry/instrumentation-fetch': false,
    '@opentelemetry/instrumentation-xml-http-request': false,
    '@opentelemetry/instrumentation-grpc': false,
    '@opentelemetry/node': false,
    '@opentelemetry/propagator-b3': false,
    '@opentelemetry/propagator-jaeger': false,
    '@opentelemetry/sdk': false,
    // Block all telemetry-related packages to be safe
    'opentelemetry-node': false,
    'opentelemetry-web': false,
    'opentelemetry': false,
    'applicationinsights': false,
    // Block ai package - we've replaced it with our own implementation
    'ai': false,
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
 */
function addProductionOptimizations(config) {
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        telemetry: {
          test: /[\\/]lib[\\/]telemetry[\\/]/,
          name: 'telemetry',
          chunks: 'all',
        },
      },
    },
  };
  return config;
}

module.exports = { createWebpackConfig, addProductionOptimizations };