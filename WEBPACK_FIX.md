# Next.js 15 Webpack Error Fix

This guide addresses the error:
```
TypeError: Cannot read properties of undefined (reading 'call')
at options.factory (webpack.js)
```

## Root Cause Analysis

The error occurs due to a combination of factors in Next.js 15.2.3:

1. **Module Resolution Issues**: Webpack struggles to properly resolve the relationship between server and client components

2. **Component Export Problems**: Default vs. named exports can cause conflicts in React Server Components

3. **Webpack Configuration**: The default configuration doesn't handle certain edge cases properly

4. **Circular Dependencies**: Potential circular dependencies between components

## Implemented Fixes

1. **Updated Component Exports**
   - Converted `LogoGeneratorApp` to use `export default` for cleaner importing
   - Added named export for backward compatibility

2. **Enhanced Webpack Configuration**
   - Created a new `next.config.mjs` file (ESM format for better compatibility)
   - Added proper module parsing rules for exports
   - Fixed React Server Components configuration

3. **Cleanup Script**
   - Created a cleanup script that clears caches and reinstalls dependencies
   - Updates tsconfig.json with Next.js 15 compatibility settings

## How to Fix

### Option 1: Run the Cleanup Script

```bash
# Make the script executable if needed
chmod +x scripts/fix-webpack-issues.sh

# Run the cleanup script
./scripts/fix-webpack-issues.sh
```

### Option 2: Manual Steps

1. **Clear Next.js cache**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

2. **Use the new next.config.mjs**
   - Delete or rename the old next.config.js
   - The new next.config.mjs has been created with proper settings

3. **Start the development server**
   ```bash
   npm run dev
   ```

## Technical Details

The fix addresses several aspects of Next.js 15 module resolution:

1. **ESM vs. CommonJS**: Next.js 15 prefers ESM modules, so the config was converted to .mjs

2. **Module Parser Configuration**: Added explicit error checks for exports/imports

3. **External Packages**: Added `next-themes` to the serverComponentsExternalPackages list to avoid RSC issues

4. **Client/Server Boundary**: Ensured proper 'use client' directives and component structure

## Preventing Future Issues

1. Always use `export default` for primary component exports

2. Be cautious with circular dependencies

3. Ensure proper 'use client' directives at the top of client component files

4. Regularly update dependencies to stay compatible with Next.js 15

5. Use ESM-compatible syntax and configurations