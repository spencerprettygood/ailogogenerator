"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * Theme Provider Component
 * 
 * Wraps Next-Themes provider to provide theme context throughout the application.
 * Enables theme switching between light, dark, and system preference.
 * 
 * @param props - Theme provider props from next-themes
 * @returns ThemeProvider component
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Store theme preference in state for client-side rendering
  const [mounted, setMounted] = React.useState(false);

  // After component mounts, allow theme switching
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering provider regardless of mounted state
  // The suppressHydrationWarning on html element in layout.tsx handles the brief flash
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}

/**
 * Hook to get and set the current theme
 * 
 * @returns {Object} The theme API with current theme, set theme function, and system preference
 * @example
 * const { theme, setTheme, systemTheme, isDark } = useTheme();
 * 
 * // Toggle theme
 * <button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
 *   Toggle theme
 * </button>
 */
import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  
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

/**
 * Theme toggle button component
 * 
 * @component
 * @example
 * <ThemeToggle />
 */
export function ThemeToggle({ 
  className 
}: { 
  className?: string 
}) {
  const { setTheme, isDark } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}