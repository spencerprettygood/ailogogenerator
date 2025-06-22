# AI Logo Generator - Project Structure

This document outlines the standardized project structure for the AI Logo Generator project. Following this structure ensures consistent organization and makes it easier for developers to navigate and maintain the codebase.

## Current Issues and Solutions

1. **Duplicate Next.js App Directories**
   - We have both `/app` and `/src/app` directories causing routing conflicts
   - **Solution**: Use only `/app` as the main Next.js directory and phase out `/src/app`

2. **Inconsistent CSS Files**
   - Multiple `globals.css` files exist in different locations
   - **Solution**: Consolidated to a single `app/globals.css` with placeholder imports elsewhere

3. **Component Import Inconsistencies**
   - Components are imported with inconsistent paths
   - **Solution**: Use path aliases consistently (`@/components/*`, etc.)

## Directory Structure

```
/ailogogenerator/
├── app/                       # Main Next.js App Router directory
│   ├── api/                   # API routes
│   │   ├── generate-logo/     # Logo generation endpoint
│   │   │   └── route.ts       # API handler
│   │   └── ...                # Other API endpoints
│   ├── globals.css            # Global styles (single source of truth)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── test-components/       # Test pages
│       └── page.tsx           # Test components page
├── components/                # Shared React components
│   ├── logo-generator/        # Logo generator components
│   │   ├── logo-display.tsx   # Logo display component
│   │   └── ...                # Other logo components
│   ├── providers/             # Context providers
│   │   └── theme-provider.tsx # Theme provider
│   └── ui/                    # UI components
│       ├── button.tsx         # Button component
│       └── ...                # Other UI components
├── lib/                       # Shared utilities and business logic
│   ├── agents/                # Agent-related code
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # Service layer
│   ├── utils/                 # Utility functions
│   └── types.ts               # TypeScript types
├── public/                    # Static assets
├── src/                       # Legacy src directory (compatibility only)
│   └── app/                   # Contains compatibility imports only
│       ├── globals.css        # Imports from app/globals.css
│       ├── layout.tsx         # Simple re-export of app/layout
│       └── page.tsx           # Simple re-export of app/page
├── styles/                    # Legacy styles directory
│   └── globals.css            # Imports from app/globals.css
├── scripts/                   # Utility scripts
│   └── fix-structure.js       # Script to fix app structure
├── next.config.ts             # Next.js configuration
├── package.json               # Project dependencies
└── tailwind.config.ts         # Tailwind CSS configuration
```

## Key Files

- **app/layout.tsx**: Root layout component that wraps all pages
- **app/page.tsx**: Main home page component
- **app/globals.css**: Global CSS styles
- **components/logo-generator/logo-generator-app.tsx**: Main application component
- **lib/utils/env.ts**: Environment variable handling
- **next.config.ts**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration

## Import Paths

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Import from components directory
import { Button } from '@/components/ui/button';

// Import from lib directory
import { useLogoGeneration } from '@/lib/hooks/use-logo-generation';

// Import from app directory
import '@/app/globals.css';
```

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the project for production
- `npm run start`: Start the production server
- `npm run fix-structure`: Fix the app directory structure
- `npm run reset`: Clean and reset the project

## Environment Variables

Environment variables are handled through the `lib/utils/env.ts` module, which provides type-safe access to environment variables and handles client vs. server-side usage.

## Styling

The project uses Tailwind CSS for styling, with custom theme configuration in `tailwind.config.ts`. Global styles are defined in `app/globals.css`.

## Component Guidelines

1. All components should be placed in the appropriate subdirectory of the `components` directory.
2. UI components should be placed in `components/ui/`.
3. Logo generator-specific components should be placed in `components/logo-generator/`.
4. Context providers should be placed in `components/providers/`.
5. Components should use named exports by default.

## API Routes

API routes are defined in the `app/api` directory using Next.js App Router conventions. Each API route should have its own subdirectory with a `route.ts` file.

## Testing

Tests should be placed alongside the files they test, with a `.test.ts` or `.test.tsx` extension.

## Documentation

Further documentation can be found in the `docs` directory.

## Scripts

The `scripts` directory contains utility scripts for development and deployment.

## Troubleshooting

If you encounter issues with the project structure, try running:

```bash
npm run reset
```

This will clean the build cache, fix the app structure, and restart the development server.