/**
 * @file colors.ts
 * @description Design token system for colors - single source of truth
 * 
 * This file defines all color tokens for the design system.
 * Color values should NEVER be hardcoded anywhere in the application.
 * Always import and use these tokens.
 */

export const colors = {
  // Base monochrome palette
  monochrome: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0D0D0D',
    },
  },

  // Accent color - the ONLY non-monochrome color in the system
  accent: {
    main: '#FF4233', // Primary accent color
    light: '#FF6B5D', // Light variant
    dark: '#D32E20', // Dark variant
  },

  // Semantic color tokens for light mode
  light: {
    // Background colors
    background: '#FFFFFF',
    backgroundAlt: '#F5F5F5', // Secondary background
    backgroundMuted: '#FAFAFA', // Muted background

    // Text colors
    text: '#0D0D0D', // Primary text
    textSecondary: '#525252', // Secondary text
    textMuted: '#737373', // Muted text
    textDisabled: '#A3A3A3', // Disabled text

    // Border colors
    border: '#E5E5E5', // Default border
    borderHover: '#D4D4D4', // Border on hover
    borderFocus: '#FF4233', // Border on focus (uses accent)

    // UI element colors
    surface: '#FFFFFF', // Card/component background
    surfaceHover: '#F5F5F5', // Card/component background on hover
    divider: '#E5E5E5', // Divider lines

    // State colors
    focus: '#FF4233', // Focus indicator (uses accent)
    selection: 'rgba(255, 66, 51, 0.1)', // Selection background
    
    // Status colors
    info: '#0D0D0D', // Informational (uses gray instead of blue)
    success: '#0D0D0D', // Success (uses gray instead of green)
    warning: '#0D0D0D', // Warning (uses gray instead of yellow)
    error: '#FF4233', // Error (uses accent)
  },

  // Semantic color tokens for dark mode
  dark: {
    // Background colors
    background: '#0D0D0D',
    backgroundAlt: '#171717',
    backgroundMuted: '#262626',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#D4D4D4',
    textMuted: '#A3A3A3',
    textDisabled: '#737373',

    // Border colors
    border: '#404040',
    borderHover: '#525252',
    borderFocus: '#FF5A4A', // Slightly lightened accent for contrast

    // UI element colors
    surface: '#171717',
    surfaceHover: '#262626',
    divider: '#404040',

    // State colors
    focus: '#FF5A4A', // Lightened accent for better contrast in dark mode
    selection: 'rgba(255, 90, 74, 0.2)',
    
    // Status colors
    info: '#D4D4D4',
    success: '#D4D4D4',
    warning: '#D4D4D4',
    error: '#FF5A4A', // Lightened accent for errors in dark mode
  },
};

// HSL color values for CSS variables
export const colorHsl = {
  accent: {
    main: '5 100% 60%', // #FF4233
    light: '5 100% 68%', // #FF6B5D
    dark: '5 74% 48%', // #D32E20
  },
  
  // Grayscale HSL values
  gray: {
    50: '0 0% 98%', // #FAFAFA
    100: '0 0% 96%', // #F5F5F5
    200: '0 0% 90%', // #E5E5E5
    300: '0 0% 83%', // #D4D4D4
    400: '0 0% 64%', // #A3A3A3
    500: '0 0% 45%', // #737373
    600: '0 0% 32%', // #525252
    700: '0 0% 25%', // #404040
    800: '0 0% 15%', // #262626
    900: '0 0% 9%', // #171717
    950: '0 0% 5%', // #0D0D0D
  },
};

// Export specific colors for strict type checking
export const accentColor = colors.accent.main; // #FF4233
export const backgroundColor = colors.light.background; // #FFFFFF
export const textColor = colors.light.text; // #0D0D0D

// Types for color system
export type ColorToken = keyof typeof colors.light | keyof typeof colors.dark;
export type AccentToken = keyof typeof colors.accent;
export type MonochromeToken = keyof typeof colors.monochrome.gray;

// Helper function to get a color safely with fallbacks
export function getColor(token: ColorToken, mode: 'light' | 'dark' = 'light'): string {
  return mode === 'light' 
    ? colors.light[token as keyof typeof colors.light] || colors.light.text
    : colors.dark[token as keyof typeof colors.dark] || colors.dark.text;
}

// Helper function to get accent color
export function getAccentColor(variant: AccentToken = 'main'): string {
  return colors.accent[variant];
}