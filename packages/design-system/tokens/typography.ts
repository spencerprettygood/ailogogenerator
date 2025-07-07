/**
 * @file typography.ts
 * @description Typography tokens for the design system
 *
 * This file defines all typography-related tokens:
 * - Font families
 * - Font weights
 * - Font sizes
 * - Line heights
 * - Letter spacing
 * - Text styles (combinations of the above)
 */

// Font families
export const fontFamily = {
  // Primary typefaces
  heading: 'Raleway, sans-serif',
  body: 'Arimo, sans-serif',
  mono: 'IBM Plex Mono, monospace',
};

// Font weights per design spec
export const fontWeight = {
  thin: '200', // Primary heading weight per spec
  light: '300', // Secondary heading weight
  regular: '400', // Body text
  medium: '500', // Emphasis
  semibold: '600', // Strong emphasis
  bold: '700', // Maximum emphasis
};

// Font sizes with 12px base
export const fontSize = {
  xs: '10px', // Extra small text
  sm: '11px', // Small text
  base: '12px', // Base body text size
  md: '14px', // Medium text
  lg: '16px', // Large text
  xl: '18px', // Extra large text
  '2xl': '20px', // 2x large text
  '3xl': '24px', // 3x large text (2x base)
  '4xl': '32px', // 4x large text
  '5xl': '40px', // 5x large text
  '6xl': '48px', // 6x large text
};

// Letter spacing
export const letterSpacing = {
  tightest: '-0.05em',
  tighter: '-0.025em',
  tight: '-0.01em',
  normal: '0',
  wide: '0.01em',
  wider: '0.05em', // +5% for headings
  widest: '0.1em', // +10% for headings
};

// Line heights
export const lineHeight = {
  none: '1',
  tight: '1.1', // Headings
  snug: '1.2', // Subheadings
  normal: '1.5', // Body text
  relaxed: '1.625',
  loose: '2',
  // Specific values
  '3': '12px', // 3x base grid
  '4': '16px', // 4x base grid
  '5': '20px', // 5x base grid
  '6': '24px', // 6x base grid
  '7': '28px', // 7x base grid
  '8': '32px', // 8x base grid
  '9': '36px', // 9x base grid
  '10': '40px', // 10x base grid
};

// Text styles - combinations of the above properties
export const textStyle = {
  // Headings
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.thin,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.widest,
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.thin,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wider,
  },
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.thin,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.wider,
  },
  h4: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.thin,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.wider,
  },
  h5: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.thin,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.wider,
  },
  h6: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.thin,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.wider,
  },

  // Body text
  'body-large': {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  'body-small': {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Special styles
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.tight,
  },
  button: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wide,
  },
};

// Helper function to get a complete text style
export function getTextStyle(style: keyof typeof textStyle) {
  return textStyle[style];
}
