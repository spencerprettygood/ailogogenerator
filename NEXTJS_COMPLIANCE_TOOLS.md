# Next.js 15 Compliance Tools

This document outlines tools and packages that can help automate compliance with Next.js 15 best practices and conventions.

## Official Tools

### 1. `@next/eslint-plugin-next`

The official ESLint plugin for Next.js provides rules specific to Next.js applications.

```bash
npm install --save-dev eslint @next/eslint-plugin-next
```

**Configuration (.eslintrc.json):**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@next/next/recommended"
  ],
  "plugins": ["@next/next"],
  "rules": {
    "@next/next/no-html-link-for-pages": "error",
    "@next/next/no-img-element": "error",
    "@next/next/no-unwanted-polyfillio": "error",
    "@next/next/no-sync-scripts": "error"
  }
}
```

### 2. `@vercel/style-guide`

Official Vercel style guide includes configurations for Next.js, TypeScript, React, and more.

```bash
npm install --save-dev @vercel/style-guide eslint typescript
```

**Configuration (.eslintrc.js):**
```js
module.exports = {
  extends: [
    '@vercel/style-guide/eslint/node',
    '@vercel/style-guide/eslint/browser',
    '@vercel/style-guide/eslint/typescript',
    '@vercel/style-guide/eslint/react',
    '@vercel/style-guide/eslint/next'
  ],
  parserOptions: {
    project: 'tsconfig.json'
  }
};
```

### 3. `next-lint`

Built-in Next.js linting command:

```bash
npx next lint --fix
```

Add to package.json:
```json
"scripts": {
  "lint": "next lint --fix",
}
```

## Community Tools

### 1. `next-transpile-modules`

For handling external modules in Next.js.

```bash
npm install --save-dev next-transpile-modules
```

**Usage in next.config.js:**
```js
const withTM = require('next-transpile-modules')(['module-to-transpile']);

module.exports = withTM({
  // Next.js config
});
```

### 2. `next-compose-plugins`

Simplifies the composition of multiple Next.js plugins.

```bash
npm install --save-dev next-compose-plugins
```

**Usage in next.config.js:**
```js
const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')(['module-a']);
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

module.exports = withPlugins([
  withTM,
  withBundleAnalyzer
], {
  // Next.js config
});
```

### 3. `typescript-plugin-css-modules`

Provides TypeScript support for CSS Modules.

```bash
npm install --save-dev typescript-plugin-css-modules
```

**Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "typescript-plugin-css-modules" }
    ]
  }
}
```

## Automated Fixes

### 1. Converting to App Router Structure

Install the conversion tool:

```bash
npm install --global next-app-router-converter
```

Run the conversion:

```bash
npx next-app-router-converter --dir .
```

### 2. next-runtime-env-vars

Type-safe runtime environment variables for Next.js.

```bash
npm install next-runtime-env-vars
```

## Continuous Integration

### 1. GitHub Actions Workflow

Create `.github/workflows/nextjs.yml`:

```yaml
name: Next.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

### 2. Husky + lint-staged

Automatic linting on commit.

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Configuration (package.json):**
```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

## Custom Scripts

### 1. Next.js Compliance Audit

A custom script to audit your Next.js project for compliance issues:

```bash
./scripts/nextjs-compliance-audit.sh
```

### 2. Standard Webpack Fix

A script to fix webpack configuration issues:

```bash
./scripts/standard-webpack-fix.sh
```

## IDE Extensions

### VS Code Extensions

1. **ESLint**: Integrates ESLint into VS Code
2. **Prettier - Code formatter**: Automatic code formatting
3. **Next.js Snippets**: Provides snippets for Next.js components
4. **Error Lens**: Shows errors and warnings inline
5. **Import Cost**: Shows size of imported packages

## Documentation References

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [ESLint Documentation](https://eslint.org/docs/user-guide/configuring/)