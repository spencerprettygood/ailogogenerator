"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

// Create a global context that will be accessible throughout the app
export interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  systemTheme?: string;
  isDark: boolean;
  resolvedTheme?: string; // The actual theme being used (resolves 'system')
  forcedTheme?: string; // Forced theme override
  toggleTheme: () => void; // Helper function to toggle between light/dark
  accent: {
    color: string;
    cssVar: string;
  };
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

/**
 * Enhanced ThemeProvider component with accent color support and improved context
 * 
 * @component
 * @example
 * // In layout.tsx
 * <ThemeProvider
 *   attribute="class"
 *   defaultTheme="system"
 *   enableSystem
 * >
 *   {children}
 * </ThemeProvider>
 */
export function ThemeProvider({ 
  children,
  ...props
}: ThemeProviderProps) {
  // Initialize the base theme context values
  const [isContextReady, setIsContextReady] = React.useState(false);
  
  // Handle initial SSR and hydration
  React.useEffect(() => {
    setIsContextReady(true);
  }, []);
  
  return (
    <NextThemesProvider {...props}>
      <ThemeContextProvider isContextReady={isContextReady}>
        {children}
      </ThemeContextProvider>
    </NextThemesProvider>
  );
}

// Separate provider component to handle the context logic
function ThemeContextProvider({ 
  children, 
  isContextReady 
}: { 
  children: React.ReactNode;
  isContextReady: boolean;
}) {
  // Get the base theme values from next-themes
  const { theme, setTheme, systemTheme, resolvedTheme, forcedTheme } = React.useContext(
    // @ts-ignore - Next themes doesn't export its context type
    NextThemesProvider.Context
  );
  
  // Handle the initial SSR state where theme isn't yet available
  const safeTheme = theme || 'system';
  const safeSystemTheme = systemTheme || 'light';
  
  // Determine if current theme is dark
  const isDark = React.useMemo(() => {
    if (!isContextReady) {
      // Use a safer default during SSR
      return false;
    }
    
    if (safeTheme === 'system') {
      return safeSystemTheme === 'dark';
    }
    return safeTheme === 'dark';
  }, [isContextReady, safeTheme, safeSystemTheme]);
  
  // Helper function to toggle theme
  const toggleTheme = React.useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);
  
  // Define the accent color
  const accent = React.useMemo(() => {
    return {
      color: '#ff4233', // The hex value of our accent color
      cssVar: 'var(--accent)' // The CSS variable reference
    };
  }, []);
  
  // Create the context value
  const contextValue = React.useMemo(() => ({
    theme: safeTheme,
    setTheme,
    systemTheme: safeSystemTheme,
    isDark,
    resolvedTheme,
    forcedTheme,
    toggleTheme,
    accent
  }), [
    safeTheme, 
    setTheme, 
    safeSystemTheme, 
    isDark, 
    resolvedTheme, 
    forcedTheme, 
    toggleTheme, 
    accent
  ]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Enhanced hook to access theme context with improved error handling and types
 * 
 * @returns {ThemeContextType} The theme context with robust APIs
 * @example
 * const { theme, setTheme, isDark, toggleTheme } = useTheme();
 * 
 * // Toggle theme with one call
 * <button onClick={toggleTheme}>
 *   Toggle theme
 * </button>
 */
export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}

/**
 * Enhanced theme toggle button with smooth transitions and improved accessibility
 * 
 * @component
 * @example
 * <ThemeToggle />
 */
export function ThemeToggle({ 
  className,
  buttonClassName,
  iconClassName = "h-5 w-5"
}: { 
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
}) {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className={className}>
      <button
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-md transition-colors",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
          buttonClassName
        )}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      >
        <div className="relative w-5 h-5">
          {/* Use transform to create a smooth cross-fade effect */}
          <SunIcon className={cn(
            iconClassName,
            "absolute top-0 left-0 transition-transform duration-300",
            isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"
          )} />
          <MoonIcon className={cn(
            iconClassName,
            "absolute top-0 left-0 transition-transform duration-300",
            !isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"
          )} />
        </div>
      </button>
    </div>
  );
}

// Utility for class names merging
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Enhanced icon components with better props handling
function SunIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
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

function MoonIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}