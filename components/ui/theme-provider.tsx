"use client";

/**
 * DEPRECATED: This file is deprecated in favor of @/components/providers/theme-fixed
 * Re-exporting the correct theme provider to maintain compatibility
 */

// Re-export everything from the fixed theme provider
export {
  ThemeProvider,
  useTheme,
  useThemeSafe,
  default as ThemedLayout
} from '@/components/providers/theme-fixed';

// Legacy compatibility - redirect to the safe hook
export function useThemeCompat() {
  const { useThemeSafe } = require('@/components/providers/theme-fixed');
  return useThemeSafe();
}

// Fallback ThemeToggle component
export function ThemeToggle({ 
  className,
  buttonClassName,
  iconClassName = "h-5 w-5"
}: { 
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
}) {
  const { useThemeSafe } = require('@/components/providers/theme-fixed');
  const { isDark, setTheme } = useThemeSafe();
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  return (
    <div className={className}>
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${buttonClassName || ''}`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      >
        <div className="relative w-5 h-5">
          {isDark ? (
            <SunIcon className={iconClassName} />
          ) : (
            <MoonIcon className={iconClassName} />
          )}
        </div>
      </button>
    </div>
  );
}

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