# Fixing Webpack Module Resolution in Next.js 15

This document provides the official approach to fixing webpack module resolution errors in Next.js 15, following best practices from the official documentation.

## Error Description

The error you're encountering:

```
TypeError: Cannot read properties of undefined (reading 'call')
at options.factory (webpack.js)
```

This is typically caused by issues with how webpack resolves modules, particularly at the boundary between client and server components in Next.js 15.

## Root Cause Analysis

Next.js 15 implements React Server Components (RSC) which require a clear boundary between server and client components. When these boundaries are not properly established, webpack can encounter issues resolving module dependencies, leading to the "cannot read properties of undefined" error.

Key problems that can cause this error:

1. **Improper Component Exports/Imports**: Using named exports instead of default exports can cause issues with webpack's module resolution.

2. **Missing 'use client' Directives**: Client components must be explicitly marked with 'use client'.

3. **Circular Dependencies**: Components importing each other in a circular pattern.

4. **Incorrect Path Aliases**: Incorrect configuration of path aliases in webpack and tsconfig.

## Solution Based on Official Documentation

### 1. Properly Configure webpack in next.config.js

We've updated the webpack configuration following best practices:

```javascript
webpack: config => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@components': path.resolve(__dirname, 'components'),
    '@lib': path.resolve(__dirname, 'lib'),
  };

  config.resolve.extensions = [
    '.tsx',
    '.ts',
    '.js',
    '.jsx',
    '.json',
    ...(config.resolve.extensions || []),
  ];

  return config;
};
```

### 2. Fix Client/Server Component Boundaries

- Ensure all client components are properly marked with 'use client'
- The root layout.tsx should be a server component (no 'use client' directive)
- Client components should use default exports when possible
- Server components importing client components should use dynamic imports with `next/dynamic`

### 3. Configure External Packages for Server Components

```javascript
experimental: {
  serverComponentsExternalPackages: ['next-themes'],
}
```

This tells Next.js to treat certain packages as external to server components, which is crucial for libraries that use browser APIs.

### 4. Clear Next.js Cache

We've provided a script (`scripts/clear-next-cache.sh`) to clear the Next.js cache, which often resolves webpack resolution issues.

## Testing the Fix

1. Run the cache clearing script:

   ```bash
   ./scripts/clear-next-cache.sh
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Verify that the application loads without the webpack error.

## Additional Best Practices

1. **Avoid Circular Dependencies**: Ensure components don't import each other in a circular pattern.

2. **Use Absolute Imports**: Configure path aliases in both tsconfig.json and webpack.

3. **Keep Client/Server Boundaries Clear**: Create wrapper components for client functionality.

4. **Use Modern Module Resolution**: Ensure tsconfig.json uses "moduleResolution": "bundler" for Next.js 15.

## References

- [Next.js Documentation on Webpack Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [React Server Components in Next.js](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Module Resolution in TypeScript](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Vercel Deployment Troubleshooting](https://vercel.com/docs/concepts/deployments/troubleshooting)

## Conclusion

This fix follows the official Next.js best practices for webpack configuration and client/server component boundaries. It should resolve the module resolution errors while maintaining a clean architecture that follows the React Server Components model.
