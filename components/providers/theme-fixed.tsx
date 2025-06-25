'use client'

import React from 'react'

// Create a simple theme context
const ThemeContext = React.createContext({
  theme: 'light',
  setTheme: (theme: string) => {},
  systemTheme: 'light',
  isDark: false
})

// This exports a simplified theme provider and hook
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState('light')
  
  // Check if we're in the browser
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Set up isDark calculation
  const isDark = theme === 'dark'
  
  // Create theme context value
  const contextValue = {
    theme,
    setTheme: setThemeState,
    systemTheme: 'light',
    isDark
  }
  
  // Only show children after mounting to prevent hydration issues
  return (
    <ThemeContext.Provider value={contextValue}>
      {mounted ? children : null}
    </ThemeContext.Provider>
  )
}

// Hook to access theme context
export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Safe hook that doesn't throw errors
export function useThemeSafe() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    return { theme: 'light', setTheme: () => {}, systemTheme: 'light', isDark: false }
  }
  return context
}

// Export a default component for ease of use
export default function ThemedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}