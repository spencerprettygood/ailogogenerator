# Theme Provider Consolidation Plan

## Current State

The codebase currently has multiple ThemeProvider implementations:

1. `/components/providers/theme-provider.tsx` - Includes ThemeProvider, useTheme, and ThemeToggle
2. `/components/ui/theme-provider.tsx` - Similar implementation with ThemeProvider, useTheme, and ThemeToggle
3. `/components/providers/theme-provider-client.tsx` - A simplified client-side ThemeProvider wrapper (used in app layout)
4. `/components/ui/theme-toggle.tsx` - A separate ThemeToggle component that imports useTheme directly from next-themes

These multiple implementations are causing confusion and potentially inconsistent behavior across the application.

## Consolidation Strategy

### 1. Standardize on a Single Implementation

Keep and enhance `/components/providers/theme-provider-client.tsx` as the primary implementation:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import * as React from 'react';

/**
 * Client-side ThemeProvider wrapper
 * This separate client component is needed since ThemeProvider uses client-side
 * functionality and the root layout should be a server component in Next.js 15+
 */
export function ThemeProviderClient({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

/**
 * Hook to get and set the current theme
 *
 * @returns {Object} The theme API with current theme, set theme function, and system preference
 */
export function useTheme() {
  const { theme, setTheme, systemTheme } = NextThemesProvider.useTheme();

  // Check if current theme is dark (either explicitly set to dark or system preference is dark)
  const isDark = React.useMemo(() => {
    if (theme === 'system' && systemTheme) {
      return systemTheme === 'dark';
    }
    return theme === 'dark';
  }, [theme, systemTheme]);

  return {
    theme,
    setTheme,
    systemTheme,
    isDark,
  };
}
```

### 2. Create a Consolidated Theme Toggle Component

Create a consolidated theme toggle component in `/components/ui/theme-toggle.tsx`:

```tsx
'use client';

import * as React from 'react';
import { useTheme } from '@/components/providers/theme-provider-client';
import { Button } from './button';

/**
 * Theme Toggle Component
 *
 * Provides a button to toggle between light and dark mode.
 * Shows appropriate icon based on current theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </Button>
  );
}

// Icon components...
```

### 3. Migration Steps

1. Update theme-provider-client.tsx to include the useTheme hook
2. Update all imports of useTheme to use the consolidated implementation
3. Update the ThemeToggle component to use the consolidated useTheme
4. Mark other ThemeProvider implementations as deprecated with comments
5. Remove the deprecated implementations once all references are updated

### 4. Import Updates

Update imports in files like:

- components/logo-generator/logo-display.tsx
- Any other component using useTheme or ThemeToggle

## Benefits

1. Eliminates confusion about which theme implementation to use
2. Ensures consistent theme behavior across the application
3. Follows Next.js 15 best practices with proper client/server component boundaries
4. Simplifies maintenance and future updates

## Implementation Timeline

1. Implement the consolidation without removing old files (to avoid breaking changes)
2. Gradually migrate components to use the new implementation
3. Once all components are migrated, remove the deprecated implementations
