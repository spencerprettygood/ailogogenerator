/**
 * Design Tokens for the Monochrome + #FF4233 Accent Design System
 * 
 * This file centralizes all design tokens for the asymmetric design system.
 * Use these values when you need programmatic access to design values.
 */

export const colors = {
  // Base palette
  background: '#FFFFFF',
  foreground: '#0D0D0D',
  
  // Accent colors
  accent: {
    DEFAULT: '#FF4233',
    light: '#FF6B5D',
    dark: '#D32E20',
    foreground: '#FFFFFF',
  },
  
  // Grayscale
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
  
  // UI Colors
  primary: {
    DEFAULT: '#FF4233',
    light: '#FF6B5D',
    dark: '#D32E20',
    foreground: '#FFFFFF',
  },
  
  secondary: {
    DEFAULT: '#0D0D0D',
    foreground: '#FFFFFF',
  },
  
  muted: {
    DEFAULT: '#F5F5F5',
    foreground: '#737373',
  },
  
  border: '#D4D4D4',
  input: '#E5E5E5',
  ring: '#FF4233',
  
  destructive: {
    DEFAULT: '#FF4233',
    foreground: '#FFFFFF',
  },
};

export const typography = {
  fontFamily: {
    inter: 'Inter, sans-serif',
    mono: 'IBM Plex Mono, monospace',
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const spacing = {
  // Asymmetric spacing scale
  uneven: {
    1: '0.375rem',  // 6px
    2: '0.625rem',  // 10px
    3: '1.125rem',  // 18px
    4: '1.875rem',  // 30px
    5: '3.125rem',  // 50px
  },
  
  // Standard spacing scale
  0: '0',
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  
  // Asymmetric border radius values
  uneven: '0.25rem 0.5rem 0.25rem 0.75rem',
  asymmetric: '1rem 0 1rem 0.25rem',
  accent: '0.75rem 0.25rem',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Asymmetric shadows
  'asymmetric-sm': '2px 3px 10px -3px rgba(0, 0, 0, 0.1)',
  'asymmetric-md': '4px 6px 16px -2px rgba(0, 0, 0, 0.12)',
  'asymmetric-lg': '6px 8px 24px -4px rgba(0, 0, 0, 0.15)',
  'accent': '3px 3px 0 0 #FF4233',
  'accent-light': '2px 2px 0 0 rgba(255, 66, 51, 0.6)',
};

export const animations = {
  durations: {
    quick: '120ms',
    standard: '240ms',
    emphasized: '400ms',
  },
  
  timingFunctions: {
    asymmetric: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  
  keyframes: {
    'off-center-fade': {
      '0%': { transform: 'scale(0.94) translateX(-6px)', opacity: '0' },
      '100%': { transform: 'scale(1) translateX(0)', opacity: '1' },
    },
    'slide-up-right': {
      '0%': { transform: 'translateY(10px) translateX(-3px)', opacity: '0' },
      '100%': { transform: 'translateY(0) translateX(0)', opacity: '1' },
    },
    'skewed-fade': {
      '0%': { transform: 'skewX(3deg) scale(0.97)', opacity: '0' },
      '100%': { transform: 'skewX(0) scale(1)', opacity: '1' },
    },
    'accent-pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(255, 66, 51, 0.4)' },
      '50%': { boxShadow: '0 0 0 10px rgba(255, 66, 51, 0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(255, 66, 51, 0)' },
    },
  },
};

export const grid = {
  asymmetric: {
    '2-1': '2fr 1fr',
    '1-2': '1fr 2fr',
    '3-2-1': '3fr 2fr 1fr',
    '1-3': '1fr 3fr',
  },
};

export const clipPaths = {
  triangle: 'polygon(0 0, 100% 0, 100% 100%)',
  asymmetric1: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)',
  asymmetric2: 'polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 85%)',
  asymmetric3: 'polygon(0 15%, 15% 0, 100% 0, 100% 100%, 0 100%)',
};

// Export the design system object for easy access
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  grid,
  clipPaths,
};

export default designSystem;