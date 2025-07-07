/**
 * @file spacing.ts
 * @description Spacing tokens for the design system
 *
 * This file defines all spacing-related tokens based on a 4px grid system.
 * All UI elements should align to this grid for consistent spacing.
 */

// Base unit for the grid system (4px)
export const baseUnit = 4;

// Generate spacing scale based on baseUnit
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: `${baseUnit / 2}px`, // 2px
  1: `${baseUnit * 1}px`, // 4px
  1.5: `${baseUnit * 1.5}px`, // 6px
  2: `${baseUnit * 2}px`, // 8px
  2.5: `${baseUnit * 2.5}px`, // 10px
  3: `${baseUnit * 3}px`, // 12px
  3.5: `${baseUnit * 3.5}px`, // 14px
  4: `${baseUnit * 4}px`, // 16px
  5: `${baseUnit * 5}px`, // 20px
  6: `${baseUnit * 6}px`, // 24px
  7: `${baseUnit * 7}px`, // 28px
  8: `${baseUnit * 8}px`, // 32px
  9: `${baseUnit * 9}px`, // 36px
  10: `${baseUnit * 10}px`, // 40px
  11: `${baseUnit * 11}px`, // 44px
  12: `${baseUnit * 12}px`, // 48px
  14: `${baseUnit * 14}px`, // 56px
  16: `${baseUnit * 16}px`, // 64px
  20: `${baseUnit * 20}px`, // 80px
  24: `${baseUnit * 24}px`, // 96px
  28: `${baseUnit * 28}px`, // 112px
  32: `${baseUnit * 32}px`, // 128px
  36: `${baseUnit * 36}px`, // 144px
  40: `${baseUnit * 40}px`, // 160px
  44: `${baseUnit * 44}px`, // 176px
  48: `${baseUnit * 48}px`, // 192px
  52: `${baseUnit * 52}px`, // 208px
  56: `${baseUnit * 56}px`, // 224px
  60: `${baseUnit * 60}px`, // 240px
  64: `${baseUnit * 64}px`, // 256px
  72: `${baseUnit * 72}px`, // 288px
  80: `${baseUnit * 80}px`, // 320px
  96: `${baseUnit * 96}px`, // 384px
};

// Semantic spacing aliases
export const space = {
  // Component-specific spacing
  buttonPadding: {
    sm: `${spacing[1.5]} ${spacing[3]}`, // 6px 12px
    md: `${spacing[2]} ${spacing[4]}`, // 8px 16px
    lg: `${spacing[3]} ${spacing[6]}`, // 12px 24px
  },

  cardPadding: {
    sm: spacing[4], // 16px
    md: spacing[6], // 24px
    lg: spacing[8], // 32px
  },

  inputPadding: {
    sm: `${spacing[1]} ${spacing[2]}`, // 4px 8px
    md: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    lg: `${spacing[3]} ${spacing[4]}`, // 12px 16px
  },

  // Layout spacing
  section: {
    sm: spacing[6], // 24px
    md: spacing[12], // 48px
    lg: spacing[24], // 96px
  },

  container: {
    padding: {
      sm: spacing[4], // 16px
      md: spacing[6], // 24px
      lg: spacing[8], // 32px
    },
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      full: '100%',
    },
  },

  // Element spacing
  gap: {
    none: spacing[0], // 0px
    xs: spacing[1], // 4px
    sm: spacing[2], // 8px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
  },

  // Typography spacing
  text: {
    letterSpacing: {
      tight: '-0.01em',
      normal: '0em',
      wide: '0.01em',
      wider: '0.05em', // For headings
      widest: '0.1em', // For headings
    },
    lineHeight: {
      none: '1',
      tight: '1.1', // Headings
      normal: '1.5', // Body text
      relaxed: '1.625', // Large text blocks
    },
    paragraph: {
      marginBottom: spacing[4], // 16px
    },
  },
};

// Asymmetric spacing patterns (deliberately irregular)
export const asymmetricSpacing = {
  // Offset padding (uneven on different sides)
  padding: {
    sm: `${spacing[1]} ${spacing[2]} ${spacing[1.5]} ${spacing[1]}`, // 4px 8px 6px 4px
    md: `${spacing[2]} ${spacing[4]} ${spacing[3]} ${spacing[2]}`, // 8px 16px 12px 8px
    lg: `${spacing[3]} ${spacing[6]} ${spacing[4]} ${spacing[3]}`, // 12px 24px 16px 12px
  },

  // Offset margins for asymmetric layouts
  margin: {
    sm: `${spacing[1]} ${spacing[0]} ${spacing[2]} ${spacing[1]}`, // 4px 0px 8px 4px
    md: `${spacing[2]} ${spacing[0]} ${spacing[4]} ${spacing[2]}`, // 8px 0px 16px 8px
    lg: `${spacing[4]} ${spacing[0]} ${spacing[8]} ${spacing[4]}`, // 16px 0px 32px 16px
  },

  // Deliberate misalignment values
  offset: {
    xs: spacing[1], // 4px
    sm: spacing[2], // 8px
    md: spacing[3], // 12px
    lg: spacing[5], // 20px
  },
};

// Helper function to get spacing value
export function getSpacing(size: keyof typeof spacing): string {
  return spacing[size];
}

// Helper function to get component-specific spacing
export function getComponentSpacing(component: keyof typeof space, variant: string = 'md'): string {
  const componentSpace = space[component] as Record<string, string>;
  return componentSpace[variant] || componentSpace.md || '0';
}
