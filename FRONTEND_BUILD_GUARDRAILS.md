# AI Logo Generator – Frontend & Build Guardrails (Single Source of Truth)

## Purpose
This document defines the non-negotiable guardrails and best practices for maintaining a robust, maintainable, and production-ready Next.js frontend. It is intended as the single source of truth for all contributors and should be referenced before any structural or configuration changes.

---

## 1. Tailwind CSS & PostCSS Configuration

- **There must be a single `postcss.config.mjs` (or `.js`) at the project root:**
  ```js
  export default {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
  ```
- **`tailwind.config.ts` must include all relevant content paths:**
  ```ts
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.svg',
    './app/globals.css',
  ],
  ```
- **`app/globals.css` is the only source of global styles.**
  - Must start with `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`.
  - All custom CSS variables and `@layer` rules go here.
- **No duplicate or legacy CSS files in `styles/` or `src/app/`.**

---

## 2. Static Asset Loading

- **All static assets (SVG, PNG, etc.) must be in `/public` or subfolders.**
- **No direct imports of assets from outside `/public`.**
- **All asset URLs must be relative to `/public` (e.g., `/assets/logo.svg`).**

---

## 3. Module Import/Export Hygiene

- **All imports must use path aliases as defined in `tsconfig.json`.**
- **No imports from files or modules that do not exist.**
- **All exports must be explicitly defined.**
- **No circular dependencies.**

---

## 4. Edge Runtime Compatibility

- **No Node.js APIs (e.g., `process.memoryUsage`, `fs`, `path`) in any code that runs in Edge API routes or middleware.**
- **If Edge runtime is required, use only Web APIs.**
- **All Edge routes must be clearly documented.**

---

## 5. React Context & Prerendering

- **All context providers (e.g., ThemeProvider) must wrap the app in `app/layout.tsx`.**
- **No context usage outside of a provider.**
- **All pages/components must be SSR/SSG safe.**
- **No direct DOM access in server components.**

---

## 6. Directory Structure

- **There must be only one `app/` directory at the project root.**
- **`src/app/` is forbidden. If present, it must be deleted.**
- **`tsconfig.json` and `next.config.ts` must not reference `src/app/`.**
- **All components must be in `/components` or subfolders.**

---

## 7. Build & Linting

- **`npm run build` must succeed with zero errors.**
- **All warnings must be triaged and fixed or explicitly documented.**
- **ESLint and TypeScript must be enabled and pass on all code.**

---

## 8. Verification Checklist (Before PR Merge)

- [ ] `npm run build` passes with zero errors
- [ ] No duplicate or legacy directories (`src/app/`, `styles/`)
- [ ] No unknown Tailwind or PostCSS errors in the browser or build logs
- [ ] All static assets load correctly in the browser
- [ ] No import/export errors in the build
- [ ] No Node.js APIs in Edge code
- [ ] All context providers are present in `app/layout.tsx`
- [ ] All lint and type errors are resolved

---

## 9. Ongoing Maintenance

- **This document must be updated with every structural or configuration change.**
- **All contributors must review this document before making changes.**
- **Any deviation must be justified and approved in a PR discussion.**

---

## 10. Rationale

- **Single source of truth prevents drift and confusion.**
- **Strict directory and config rules prevent build/runtime errors.**
- **Clear verification steps ensure production readiness.**

---

## 11. Appendix: Common Pitfalls

- Multiple `app/` or `src/app/` directories
- Unprocessed Tailwind/PostCSS (missing config or import)
- Node.js APIs in Edge runtime
- Context not provided at the root
- Asset paths not relative to `/public`
- Import/export mismatches

---

**This file is the canonical reference for all frontend and build system decisions.**
