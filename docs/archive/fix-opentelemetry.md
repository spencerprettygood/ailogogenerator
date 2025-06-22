# OpenTelemetry Fix Documentation

## Issue Description

The application was experiencing errors related to OpenTelemetry, specifically:

```
Error: Cannot find module 'async_hooks'
```

This error occurred because OpenTelemetry's `@opentelemetry/context-async-hooks` package attempts to use Node.js's `async_hooks` module, which is not available in browser environments. This is a common issue with Next.js applications that use OpenTelemetry, as Next.js code runs in both Node.js (server-side) and browser (client-side) environments.

## Root Cause Analysis

1. **Dependency Chain**: OpenTelemetry is a transitive dependency of Next.js (listed as a peer dependency)
2. **Module Resolution**: When code runs in the browser, it attempts to load the `async_hooks` module which only exists in Node.js
3. **Environment Mismatch**: The OpenTelemetry package is not properly handling the browser environment

## Solution Implemented

We took a multi-faceted approach to resolve this issue:

### 1. Custom Webpack Configuration for OpenTelemetry

We didn't need to use `experimental.instrumentationHook` option in `next.config.ts` as it's no longer necessary in Next.js 15.3.3. Instead, we focused on fixing the module resolution through webpack:

```javascript
// This is handled in the webpack configuration instead of experimental options
const nextConfig = {
  // OpenTelemetry is disabled through webpack configuration
  // ...other configuration
};
```

### 2. Create Shims for Problematic Modules

Created custom shim implementations for:

- **async_hooks**: Created a minimal implementation that provides empty functions with the same API surface
- **OpenTelemetry API**: Created a no-op implementation that maintains the API but doesn't try to use Node.js modules

These shims are located in:
- `/lib/shims/async-hooks.js`
- `/lib/shims/opentelemetry-api.js`

### 3. Customize Webpack Configuration

Modified the webpack configuration to use our shims and disable problematic modules:

```javascript
// In lib/webpack-config.js
function createWebpackConfig(config) {
  // Add our custom resolvers
  config.resolve.alias = {
    ...config.resolve.alias,
    // Use our shim for async_hooks
    'async_hooks': require.resolve('./shims/async-hooks.js'),
    // Replace OpenTelemetry with our shim
    '@opentelemetry/api': require.resolve('./shims/opentelemetry-api.js'),
    // Disable problematic OpenTelemetry packages
    '@opentelemetry/context-async-hooks': false,
    '@opentelemetry/instrumentation': false,
    '@opentelemetry/sdk-trace-base': false,
  };

  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
    child_process: false,
    async_hooks: false,
  };

  return config;
}
```

## Alternative Approaches Considered

1. **Keep OpenTelemetry but fix the environment detection**: This would require modifying the OpenTelemetry code or creating complex wrappers.
2. **Use a different telemetry system**: Considered but unnecessary as we weren't actively using OpenTelemetry features.
3. **Downgrade Next.js**: Not a viable option as we need the features from the current version.

## Impact and Benefits

1. **Resolved Error**: The application now builds and runs without the `async_hooks` module error
2. **Maintained Performance**: No impact on application performance or functionality
3. **Forward Compatibility**: Solution is compatible with future Next.js versions
4. **No Loss of Functionality**: We weren't using OpenTelemetry features directly, so disabling it had no negative impact

## Future Considerations

1. **Re-enable OpenTelemetry if needed**: If telemetry becomes important, we can re-enable it with proper environment detection
2. **Monitor for similar issues**: Watch for other Node.js-specific modules being used in browser environments
3. **Consider alternative telemetry solutions**: If detailed performance monitoring is needed, consider browser-compatible alternatives

## References

1. [Next.js OpenTelemetry Documentation](https://nextjs.org/docs/advanced-features/instrumentation)
2. [OpenTelemetry JS SDK](https://github.com/open-telemetry/opentelemetry-js)
3. [Webpack Module Resolution](https://webpack.js.org/configuration/resolve/)