"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeSafe } from "@/components/providers/theme-fixed";
import { Button } from "./button";

/**
 * Theme Toggle Component
 * 
 * Provides a button to toggle between light and dark mode.
 * Shows appropriate icon based on current theme.
 * 
 * @returns ThemeToggle component
 */
export function ThemeToggle() {
  const { theme, setTheme } = useThemeSafe();
  
  // Toggle between light and dark theme
  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 overflow-hidden rounded-md"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun icon */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      
      {/* Moon icon */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}