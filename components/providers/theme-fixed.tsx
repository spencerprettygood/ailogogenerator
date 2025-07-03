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
    
    // Initialize theme from localStorage or system preference
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setThemeState(savedTheme)
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setThemeState(prefersDark ? 'dark' : 'light')
      }
    } catch (error) {
      console.warn('Failed to initialize theme:', error)
    }
  }, [])
  
  // Save theme to localStorage and apply class
  React.useEffect(() => {
    if (!mounted) return
    
    try {
      localStorage.setItem('theme', theme)
      
      // Apply theme class to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    } catch (error) {
      console.warn('Failed to save theme:', error)
    }
  }, [theme, mounted])
  
  // Set up isDark calculation
  const isDark = theme === 'dark'
  
  // Create theme context value
  const contextValue = React.useMemo(() => ({
    theme,
    setTheme: setThemeState,
    systemTheme: 'light',
    isDark
  }), [theme, isDark])
  
  // Only show children after mounting to prevent hydration issues
  return (
    <ThemeContext.Provider value={contextValue}>
      {mounted ? children : <div className="min-h-screen bg-white" />}
    </ThemeContext.Provider>
  )
}

// Hook to access theme context - now safe by default
export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    // Instead of throwing, return a safe default
    console.warn('useTheme was called outside ThemeProvider, using safe defaults')
    return { theme: 'light', setTheme: () => {}, systemTheme: 'light', isDark: false }
  }
  return context
}

// Safe hook that doesn't throw errors - explicitly typed for better webpack resolution
export const useThemeSafe = () => {
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