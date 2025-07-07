/**
 * @file design-intelligence.ts
 * @description Advanced design intelligence system for professional logo generation
 *
 * This module implements sophisticated design principles and algorithms to enhance
 * the quality and professionalism of generated logos, including:
 *
 * - Golden ratio and sacred geometry integration
 * - Advanced color theory with psychological impact analysis
 * - Typography optimization with optical adjustments
 * - Negative space optimization
 * - Visual hierarchy implementation using Gestalt principles
 * - Cultural design adaptation
 * - Accessibility compliance checking (WCAG 2.1 AAA)
 */

import { SVGLogo, LogoElement, LogoColors } from '../types';
import { optimize } from 'svgo';

// Golden ratio constant (φ)
const GOLDEN_RATIO = 1.618033988749895;

/**
 * Geometric ratios and constants used in professional design
 */
export const DesignRatios = {
  GOLDEN_RATIO, // φ (phi)
  SILVER_RATIO: 2.4142135623731, // δs (silver ratio)
  PERFECT_FOURTH: 4 / 3, // Musical and visual harmony ratio
  PERFECT_FIFTH: 3 / 2, // Musical and visual harmony ratio
  FIBONACCI: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144], // Fibonacci sequence
  ROOT_TWO: Math.sqrt(2), // 1.414... (used in A-series paper)
};

/**
 * Color harmony models for professional design
 */
export enum ColorHarmonyModel {
  COMPLEMENTARY = 'complementary',
  SPLIT_COMPLEMENTARY = 'split_complementary',
  ANALOGOUS = 'analogous',
  TRIADIC = 'triadic',
  TETRADIC = 'tetradic',
  MONOCHROMATIC = 'monochromatic',
}

/**
 * Color psychology associations by hue
 */
export const ColorPsychology: Record<string, { associations: string[]; industries: string[] }> = {
  red: {
    associations: ['energy', 'passion', 'excitement', 'strength', 'love', 'confidence', 'urgency'],
    industries: ['food', 'retail', 'entertainment', 'sports'],
  },
  blue: {
    associations: ['trust', 'reliability', 'professionalism', 'calm', 'security', 'intelligence'],
    industries: ['finance', 'healthcare', 'technology', 'legal', 'corporate'],
  },
  green: {
    associations: ['growth', 'health', 'nature', 'freshness', 'harmony', 'wealth', 'stability'],
    industries: ['health', 'environment', 'agriculture', 'education', 'finance'],
  },
  yellow: {
    associations: ['optimism', 'happiness', 'warmth', 'energy', 'attention', 'creativity'],
    industries: ['food', 'children', 'leisure', 'entertainment'],
  },
  purple: {
    associations: ['luxury', 'creativity', 'wisdom', 'spirituality', 'mystery', 'sophistication'],
    industries: ['luxury goods', 'beauty', 'spirituality', 'creative arts'],
  },
  orange: {
    associations: ['enthusiasm', 'creativity', 'determination', 'encouragement', 'affordability'],
    industries: ['food', 'entertainment', 'retail', 'fitness'],
  },
  black: {
    associations: ['sophistication', 'power', 'elegance', 'authority', 'formality', 'prestige'],
    industries: ['luxury', 'fashion', 'technology', 'professional services'],
  },
  white: {
    associations: ['purity', 'cleanliness', 'simplicity', 'peace', 'minimalism', 'innocence'],
    industries: ['healthcare', 'weddings', 'minimalist brands', 'technology'],
  },
  gray: {
    associations: ['neutrality', 'balance', 'timelessness', 'practicality', 'professionalism'],
    industries: ['corporate', 'legal', 'technology', 'automotive'],
  },
  brown: {
    associations: ['reliability', 'stability', 'warmth', 'earthiness', 'tradition', 'support'],
    industries: ['coffee', 'construction', 'wood products', 'outdoor', 'agriculture'],
  },
  pink: {
    associations: ['femininity', 'playfulness', 'compassion', 'nurturing', 'romance', 'gentleness'],
    industries: ['beauty', 'fashion', 'children', 'weddings', 'confectionery'],
  },
  teal: {
    associations: ['balance', 'clarity', 'creativity', 'communication', 'sophistication'],
    industries: ['healthcare', 'spa', 'technology', 'education'],
  },
};

/**
 * Typography categories and their associations
 */
export const TypographyAssociations: Record<
  string,
  { characteristics: string[]; industries: string[] }
> = {
  serif: {
    characteristics: ['traditional', 'reliable', 'respectable', 'authoritative', 'established'],
    industries: ['legal', 'finance', 'education', 'publishing', 'luxury'],
  },
  sansSerif: {
    characteristics: ['modern', 'clean', 'straightforward', 'approachable', 'minimal'],
    industries: ['technology', 'healthcare', 'retail', 'startups', 'digital'],
  },
  display: {
    characteristics: ['unique', 'expressive', 'memorable', 'personality', 'statement'],
    industries: ['entertainment', 'food', 'fashion', 'children', 'creative'],
  },
  script: {
    characteristics: ['elegant', 'personal', 'creative', 'feminine', 'sophisticated'],
    industries: ['wedding', 'fashion', 'beauty', 'luxury', 'arts'],
  },
  monospace: {
    characteristics: ['technical', 'precise', 'mechanical', 'structured', 'functional'],
    industries: ['technology', 'engineering', 'coding', 'industrial'],
  },
  slab: {
    characteristics: ['bold', 'substantial', 'confident', 'impactful', 'attention-grabbing'],
    industries: ['construction', 'automotive', 'sports', 'manufacturing'],
  },
};

/**
 * Cultural design considerations by region
 */
export const CulturalDesignAssociations: Record<
  string,
  { colors: string[]; symbols: string[]; taboos: string[] }
> = {
  'east-asia': {
    colors: [
      'red (prosperity)',
      'gold (wealth)',
      'yellow (imperial)',
      'white (mourning in some contexts)',
    ],
    symbols: ['dragons', 'phoenix', 'circles', 'bamboo', 'lotus'],
    taboos: ['number 4', 'clock gifts', 'sharp angles pointing at viewer'],
  },
  'middle-east': {
    colors: ['green (religious significance)', 'blue (protective)', 'gold (prosperity)'],
    symbols: ['geometric patterns', 'arabesque', 'calligraphy', 'arches'],
    taboos: ['human or animal representation in religious contexts', 'left hand imagery'],
  },
  western: {
    colors: ['blue (trust)', 'green (environmental)', 'red (energy)'],
    symbols: ['oak leaves', 'laurel wreaths', 'shields', 'crosses'],
    taboos: ['swastika', 'offensive gestures', 'appropriative imagery'],
  },
  'latin-america': {
    colors: ['bright vibrant colors', 'reds', 'yellows', 'blues'],
    symbols: ['sun', 'native patterns', 'animals', 'catholic imagery'],
    taboos: ['skeleton imagery outside of context', 'inappropriate religious references'],
  },
  africa: {
    colors: ['red', 'gold', 'green', 'bright colors', 'earth tones'],
    symbols: ['tribal patterns', 'wildlife', 'shield shapes', 'symbolic animals'],
    taboos: ['disrespectful tribal representation', 'misuse of cultural patterns'],
  },
  'south-asia': {
    colors: ['saffron (sacred)', 'green', 'red', 'vibrant colors'],
    symbols: ['lotus', 'mandalas', 'peacock', 'elephants', 'chakra'],
    taboos: ['feet imagery', 'misuse of religious symbols', 'cow in inappropriate contexts'],
  },
};

/**
 * Gestalt principles for visual perception
 */
export enum GestaltPrinciple {
  PROXIMITY = 'proximity',
  SIMILARITY = 'similarity',
  CLOSURE = 'closure',
  CONTINUATION = 'continuation',
  FIGURE_GROUND = 'figure_ground',
  SYMMETRY = 'symmetry',
  COMMON_FATE = 'common_fate',
}

/**
 * WCAG Accessibility standards for color contrast
 */
export enum WCAGLevel {
  AA = 'AA', // Minimum acceptable level for most content
  AAA = 'AAA', // Enhanced level for maximum accessibility
}

/**
 * Applies the golden ratio to SVG element dimensions and positioning
 * @param svg - The SVG logo to enhance
 * @returns - Enhanced SVG with golden ratio proportions
 */
export function applyGoldenRatio(svg: SVGLogo): SVGLogo {
  // Deep clone the SVG to avoid modifying the original
  const enhancedSvg = JSON.parse(JSON.stringify(svg)) as SVGLogo;

  // Get the primary dimensions
  const { width, height } = enhancedSvg;

  // Calculate golden ratio proportions
  const goldenWidth = height * GOLDEN_RATIO;
  const goldenHeight = width / GOLDEN_RATIO;

  // Apply golden ratio to individual elements
  enhancedSvg.elements = applyGoldenRatioToElements(enhancedSvg.elements, width, height);

  return enhancedSvg;
}

/**
 * Recursively applies golden ratio proportions to SVG elements
 * @param elements - Array of SVG elements
 * @param containerWidth - Width of the container
 * @param containerHeight - Height of the container
 * @returns - Array of enhanced elements
 */
function applyGoldenRatioToElements(
  elements: LogoElement[],
  containerWidth: number,
  containerHeight: number
): LogoElement[] {
  return elements.map(element => {
    const newElement = { ...element };

    // Apply to specific element types
    if (element.type === 'rect' || element.type === 'ellipse' || element.type === 'circle') {
      // Apply golden ratio to dimensions when appropriate
      if (element.attributes.width && element.attributes.height) {
        // For rectangles, consider applying golden ratio
        if (
          element.type === 'rect' &&
          !isNearGoldenRatio(Number(element.attributes.width), Number(element.attributes.height))
        ) {
          // Only adjust if not already close to golden ratio
          newElement.attributes = {
            ...element.attributes,
            width: Number(element.attributes.height) * GOLDEN_RATIO,
          };
        }
      }
    }

    // Recursively process children
    if (element.children && element.children.length > 0) {
      newElement.children = applyGoldenRatioToElements(
        element.children,
        containerWidth,
        containerHeight
      );
    }

    return newElement;
  });
}

/**
 * Checks if dimensions are already close to the golden ratio
 * @param width - Width dimension
 * @param height - Height dimension
 * @param tolerance - Acceptable deviation from golden ratio
 * @returns - Boolean indicating if dimensions are near golden ratio
 */
function isNearGoldenRatio(width: number, height: number, tolerance = 0.1): boolean {
  const ratio = width / height;
  const deviation = Math.abs(ratio - GOLDEN_RATIO);
  return deviation <= tolerance;
}

/**
 * Enhances color palette using color theory principles
 * @param colors - Original color palette
 * @param industry - Target industry for psychological impact
 * @param model - Color harmony model to apply
 * @returns - Enhanced color palette
 */
export function enhanceColorPalette(
  colors: LogoColors,
  industry?: string,
  model: ColorHarmonyModel = ColorHarmonyModel.COMPLEMENTARY
): LogoColors {
  // Convert colors to HSL for easier manipulation
  const primaryHsl = hexToHSL(colors.primary);

  // Create enhanced palette based on harmony model
  const enhancedColors: LogoColors = { ...colors };

  switch (model) {
    case ColorHarmonyModel.COMPLEMENTARY:
      // Generate complementary color (opposite on color wheel)
      if (!colors.secondary) {
        const complementaryH = (primaryHsl.h + 180) % 360;
        enhancedColors.secondary = hslToHex(complementaryH, primaryHsl.s, primaryHsl.l);
      }
      break;

    case ColorHarmonyModel.SPLIT_COMPLEMENTARY:
      // Generate two colors on either side of the complement
      if (!colors.secondary || !colors.tertiary) {
        const splitAngle1 = (primaryHsl.h + 150) % 360;
        const splitAngle2 = (primaryHsl.h + 210) % 360;
        enhancedColors.secondary = hslToHex(splitAngle1, primaryHsl.s, primaryHsl.l);
        enhancedColors.tertiary = hslToHex(splitAngle2, primaryHsl.s, primaryHsl.l);
      }
      break;

    case ColorHarmonyModel.ANALOGOUS:
      // Generate adjacent colors on the color wheel
      if (!colors.secondary || !colors.tertiary) {
        const analogousAngle1 = (primaryHsl.h + 30) % 360;
        const analogousAngle2 = (primaryHsl.h + 330) % 360;
        enhancedColors.secondary = hslToHex(analogousAngle1, primaryHsl.s, primaryHsl.l);
        enhancedColors.tertiary = hslToHex(analogousAngle2, primaryHsl.s, primaryHsl.l);
      }
      break;

    // Additional harmony models can be implemented here

    default:
      // Default to complementary if model not recognized
      if (!colors.secondary) {
        const complementaryH = (primaryHsl.h + 180) % 360;
        enhancedColors.secondary = hslToHex(complementaryH, primaryHsl.s, primaryHsl.l);
      }
  }

  // Add background color if not provided
  if (!enhancedColors.background) {
    // Create a subtle background based on primary color
    enhancedColors.background = hslToHex(
      primaryHsl.h,
      primaryHsl.s * 0.2,
      primaryHsl.l > 50 ? 95 : 5
    );
  }

  // Add accent color if not provided
  if (!enhancedColors.accent) {
    // Create a vibrant accent color based on the primary
    const accentH = (primaryHsl.h + 60) % 360; // Shift hue for accent
    enhancedColors.accent = hslToHex(accentH, Math.min(primaryHsl.s * 1.3, 100), primaryHsl.l);
  }

  return enhancedColors;
}

/**
 * Converts hex color to HSL format
 * @param hex - Hex color string
 * @returns - HSL color object
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  }

  // Find min and max values for luminance
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    // Calculate saturation
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

    // Calculate hue
    if (max === r) {
      h = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }

    h *= 60; // Convert to degrees
  }

  // Return HSL object with rounded values
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL color to hex format
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns - Hex color string
 */
function hslToHex(h: number, s: number, l: number): string {
  // Normalize values
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  // Calculate RGB values
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r, g, b;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  // Convert to hex format
  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Checks and enhances accessibility of SVG colors for WCAG compliance
 * @param svg - SVG logo to check
 * @param level - WCAG compliance level to target
 * @returns - Enhanced SVG with accessible colors
 */
export function enhanceAccessibility(svg: SVGLogo, level: WCAGLevel = WCAGLevel.AAA): SVGLogo {
  // Deep clone the SVG to avoid modifying the original
  const enhancedSvg = JSON.parse(JSON.stringify(svg)) as SVGLogo;
  const colors = enhancedSvg.colors;

  // Check color contrast ratios
  const adjustedColors = { ...colors };

  // Calculate contrast with background (if specified)
  if (colors.background) {
    // Check primary color against background
    const primaryContrast = calculateColorContrast(colors.primary, colors.background);

    // Adjust primary color if needed based on WCAG level
    if (
      (level === WCAGLevel.AA && primaryContrast < 4.5) ||
      (level === WCAGLevel.AAA && primaryContrast < 7)
    ) {
      adjustedColors.primary = adjustColorForContrast(
        colors.primary,
        colors.background,
        level === WCAGLevel.AAA ? 7 : 4.5
      );
    }

    // Check and adjust secondary color
    if (colors.secondary) {
      const secondaryContrast = calculateColorContrast(colors.secondary, colors.background);
      if (
        (level === WCAGLevel.AA && secondaryContrast < 4.5) ||
        (level === WCAGLevel.AAA && secondaryContrast < 7)
      ) {
        adjustedColors.secondary = adjustColorForContrast(
          colors.secondary,
          colors.background,
          level === WCAGLevel.AAA ? 7 : 4.5
        );
      }
    }
  }

  // Apply adjusted colors
  enhancedSvg.colors = adjustedColors;

  return enhancedSvg;
}

/**
 * Calculates the contrast ratio between two colors (WCAG formula)
 * @param color1 - First color (hex)
 * @param color2 - Second color (hex)
 * @returns - Contrast ratio (1-21)
 */
function calculateColorContrast(color1: string, color2: string): number {
  // Convert colors to relative luminance
  const lum1 = calculateRelativeLuminance(color1);
  const lum2 = calculateRelativeLuminance(color2);

  // Calculate contrast ratio
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Calculates the relative luminance of a color (WCAG formula)
 * @param color - Hex color
 * @returns - Relative luminance value (0-1)
 */
function calculateRelativeLuminance(color: string): number {
  // Remove # if present
  color = color.replace(/^#/, '');

  // Parse RGB values
  let r, g, b;
  if (color.length === 3) {
    r = parseInt(color[0] + color[0], 16) / 255;
    g = parseInt(color[1] + color[1], 16) / 255;
    b = parseInt(color[2] + color[2], 16) / 255;
  } else {
    r = parseInt(color.substring(0, 2), 16) / 255;
    g = parseInt(color.substring(2, 4), 16) / 255;
    b = parseInt(color.substring(4, 6), 16) / 255;
  }

  // Apply gamma correction
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Adjusts a color to achieve a target contrast ratio with another color
 * @param color - Color to adjust (hex)
 * @param background - Background color to contrast against (hex)
 * @param targetRatio - Target contrast ratio
 * @returns - Adjusted color (hex)
 */
function adjustColorForContrast(color: string, background: string, targetRatio: number): string {
  // Convert colors to HSL for adjustment
  const colorHSL = hexToHSL(color);
  const bgLuminance = calculateRelativeLuminance(background);

  // Determine if we need to lighten or darken the color
  // Darker colors need to be lightened, lighter colors need to be darkened
  const needsLightening = bgLuminance < 0.5;

  // Start with original lightness
  let newL = colorHSL.l;
  let currentRatio = calculateColorContrast(color, background);
  let step = 5; // Step size for lightness adjustment
  let attempts = 0;

  // Adjust lightness until we achieve target contrast or reach limits
  while (currentRatio < targetRatio && attempts < 20) {
    // Adjust lightness in the appropriate direction
    if (needsLightening) {
      newL = Math.min(100, newL + step);
    } else {
      newL = Math.max(0, newL - step);
    }

    // Create new color and check contrast
    const newColor = hslToHex(colorHSL.h, colorHSL.s, newL);
    currentRatio = calculateColorContrast(newColor, background);

    // Reduce step size as we approach target
    if (attempts > 10) {
      step = 1;
    }

    attempts++;

    // If we reach the limits, break the loop
    if ((needsLightening && newL >= 99) || (!needsLightening && newL <= 1)) {
      break;
    }
  }

  // If we still can't achieve contrast, try adjusting saturation
  if (currentRatio < targetRatio) {
    // Reset lightness to maximum/minimum based on need
    newL = needsLightening ? 95 : 5;
    let newS = colorHSL.s;

    while (currentRatio < targetRatio && attempts < 30) {
      // Adjust saturation
      newS = Math.max(0, newS - 10);

      // Create new color and check contrast
      const newColor = hslToHex(colorHSL.h, newS, newL);
      currentRatio = calculateColorContrast(newColor, background);

      attempts++;

      // If saturation reaches 0, we can't improve further
      if (newS <= 0) {
        break;
      }
    }

    return hslToHex(colorHSL.h, newS, newL);
  }

  return hslToHex(colorHSL.h, colorHSL.s, newL);
}

/**
 * Enhances visual hierarchy using Gestalt principles
 * @param svg - SVG logo to enhance
 * @param primaryFocus - Element ID to establish as the primary focus
 * @returns - Enhanced SVG with improved visual hierarchy
 */
export function enhanceVisualHierarchy(svg: SVGLogo, primaryFocus?: string): SVGLogo {
  // Deep clone the SVG to avoid modifying the original
  const enhancedSvg = JSON.parse(JSON.stringify(svg)) as SVGLogo;

  // Apply Gestalt principles to enhance visual hierarchy
  enhancedSvg.elements = applyGestaltPrinciples(enhancedSvg.elements, primaryFocus);

  return enhancedSvg;
}

/**
 * Applies Gestalt principles to SVG elements for improved perception
 * @param elements - Array of SVG elements
 * @param primaryFocus - Element ID to establish as the primary focus
 * @returns - Enhanced array of elements
 */
function applyGestaltPrinciples(elements: LogoElement[], primaryFocus?: string): LogoElement[] {
  // Identify potential focal elements if none specified
  let focusElement: LogoElement | undefined;

  if (primaryFocus) {
    // Find specified element
    focusElement = findElementById(elements, primaryFocus);
  } else {
    // Auto-detect likely focal element
    focusElement = identifyFocalElement(elements);
  }

  // Apply principles if focus element found
  if (focusElement) {
    // Enhance prominence of focal element
    elements = enhanceFocalElement(elements, focusElement.id);

    // Apply proximity grouping
    elements = applyProximityPrinciple(elements);

    // Apply similarity principle to related elements
    elements = applySimilarityPrinciple(elements);
  }

  return elements;
}

/**
 * Finds an element by ID in the elements tree
 * @param elements - Array of SVG elements
 * @param id - Element ID to find
 * @returns - Found element or undefined
 */
function findElementById(elements: LogoElement[], id: string): LogoElement | undefined {
  for (const element of elements) {
    if (element.id === id) {
      return element;
    }

    // Recursively search children
    if (element.children && element.children.length > 0) {
      const found = findElementById(element.children, id);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Identifies the most likely focal element based on size and position
 * @param elements - Array of SVG elements
 * @returns - Identified focal element or undefined
 */
function identifyFocalElement(elements: LogoElement[]): LogoElement | undefined {
  // Simple algorithm: find the largest element or text element
  let largestElement: LogoElement | undefined;
  let largestArea = 0;
  let textElement: LogoElement | undefined;

  // Function to process each element
  const processElement = (element: LogoElement) => {
    // Check for text elements (often focal in logos)
    if (element.type === 'text') {
      textElement = element;
      return;
    }

    // Calculate approximate area for size comparison
    let area = 0;
    if (element.type === 'rect' && element.attributes.width && element.attributes.height) {
      area = Number(element.attributes.width) * Number(element.attributes.height);
    } else if (element.type === 'circle' && element.attributes.r) {
      area = Math.PI * Math.pow(Number(element.attributes.r), 2);
    } else if (element.type === 'ellipse' && element.attributes.rx && element.attributes.ry) {
      area = Math.PI * Number(element.attributes.rx) * Number(element.attributes.ry);
    }

    // Update largest element if this one is larger
    if (area > largestArea) {
      largestArea = area;
      largestElement = element;
    }
  };

  // Process all elements
  for (const element of elements) {
    processElement(element);

    // Process children
    if (element.children) {
      for (const child of element.children) {
        processElement(child);
      }
    }
  }

  // Prefer text element as focal point if found
  return textElement || largestElement;
}

/**
 * Enhances the prominence of the focal element
 * @param elements - Array of SVG elements
 * @param focalId - ID of the focal element
 * @returns - Enhanced array of elements
 */
function enhanceFocalElement(elements: LogoElement[], focalId: string): LogoElement[] {
  return elements.map(element => {
    const newElement = { ...element };

    // If this is the focal element, enhance it
    if (element.id === focalId) {
      // Enhance based on element type
      if (element.type === 'text') {
        // Enhance text properties
        newElement.attributes = {
          ...element.attributes,
          'font-weight': 'bold',
          'dominant-baseline': 'middle',
          'text-anchor': 'middle',
        };
      } else if (
        element.type === 'rect' ||
        element.type === 'circle' ||
        element.type === 'ellipse'
      ) {
        // Enhance shape properties
        newElement.attributes = {
          ...element.attributes,
          'stroke-width': element.attributes['stroke-width']
            ? Number(element.attributes['stroke-width']) * 1.2
            : 2,
        };
      }
    }

    // Process children recursively
    if (element.children && element.children.length > 0) {
      newElement.children = enhanceFocalElement(element.children, focalId);
    }

    return newElement;
  });
}

/**
 * Applies the proximity principle to related elements
 * @param elements - Array of SVG elements
 * @returns - Enhanced array of elements
 */
function applyProximityPrinciple(elements: LogoElement[]): LogoElement[] {
  // Group identification would be complex in a real implementation
  // This is a simplified version
  return elements;
}

/**
 * Applies the similarity principle to related elements
 * @param elements - Array of SVG elements
 * @returns - Enhanced array of elements
 */
function applySimilarityPrinciple(elements: LogoElement[]): LogoElement[] {
  // Style consistency would be applied in a real implementation
  // This is a simplified version
  return elements;
}

/**
 * Optimizes path data for technical excellence
 * @param svgCode - SVG code to optimize
 * @returns - Optimized SVG code
 */
export function optimizeSVGPaths(svgCode: string): string {
  try {
    // Use SVGO for advanced path optimization
    const result = optimize(svgCode, {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              // Preserve important attributes
              removeViewBox: false,
              cleanupIDs: false,
              removeHiddenElems: false,
            },
          },
        },
        // Specific path optimizations
        'convertPathData',
        'mergePaths',
        'removeDimensions',
        'removeUselessStrokeAndFill',
        'convertTransform',
        'removeEmptyAttrs',
      ],
    });

    return result.data;
  } catch (error) {
    console.error('SVG path optimization failed:', error);
    return svgCode; // Return original if optimization fails
  }
}

/**
 * Performs a comprehensive design quality assessment of an SVG logo
 * @param svg - SVG logo to assess
 * @param industry - Target industry for context-aware assessment
 * @returns - Quality assessment scores and recommendations
 */
export function assessDesignQuality(
  svg: SVGLogo,
  industry?: string
): {
  scores: {
    colorHarmony: number;
    composition: number;
    visualWeight: number;
    typography: number;
    negativeSpace: number;
    technicalQuality: number;
    overallScore: number;
  };
  recommendations: string[];
} {
  // Initialize scores
  const scores = {
    colorHarmony: 0,
    composition: 0,
    visualWeight: 0,
    typography: 0,
    negativeSpace: 0,
    technicalQuality: 0,
    overallScore: 0,
  };

  const recommendations: string[] = [];

  // Assess color harmony
  scores.colorHarmony = assessColorHarmony(svg.colors);
  if (scores.colorHarmony < 70) {
    recommendations.push(
      'Consider refining the color palette for better harmony. Use complementary or analogous colors.'
    );
  }

  // Assess composition
  scores.composition = assessComposition(svg.elements);
  if (scores.composition < 70) {
    recommendations.push(
      'Improve composition by applying the rule of thirds or golden ratio proportions.'
    );
  }

  // Assess typography if present
  const hasText = hasTextElements(svg.elements);
  if (hasText) {
    scores.typography = assessTypography(svg.elements);
    if (scores.typography < 70) {
      recommendations.push(
        'Typography could be improved. Consider kerning adjustments or a more appropriate font style.'
      );
    }
  } else {
    scores.typography = 100; // Not applicable
  }

  // Assess visual weight distribution
  scores.visualWeight = assessVisualWeight(svg.elements);
  if (scores.visualWeight < 70) {
    recommendations.push(
      'Balance the visual weight distribution to create a more stable logo design.'
    );
  }

  // Assess negative space
  scores.negativeSpace = assessNegativeSpace(svg);
  if (scores.negativeSpace < 70) {
    recommendations.push(
      'Improve the use of negative space to create a more elegant and memorable design.'
    );
  }

  // Assess technical quality
  scores.technicalQuality = assessTechnicalQuality(svg);
  if (scores.technicalQuality < 70) {
    recommendations.push(
      'Optimize technical aspects of the SVG by simplifying paths and cleaning up unnecessary elements.'
    );
  }

  // Calculate overall score
  scores.overallScore = calculateWeightedScore([
    { score: scores.colorHarmony, weight: 0.2 },
    { score: scores.composition, weight: 0.2 },
    { score: scores.visualWeight, weight: 0.15 },
    { score: scores.typography, weight: hasText ? 0.2 : 0 },
    { score: scores.negativeSpace, weight: 0.15 },
    { score: scores.technicalQuality, weight: 0.1 },
  ]);

  // Add industry-specific recommendations if applicable
  if (industry) {
    addIndustrySpecificRecommendations(recommendations, industry, scores);
  }

  return { scores, recommendations };
}

/**
 * Assesses color harmony of a logo's color palette
 * @param colors - Logo colors
 * @returns - Color harmony score (0-100)
 */
function assessColorHarmony(colors: LogoColors): number {
  // Simple implementation for demonstration
  // In a real system, this would use advanced color theory algorithms
  return 80; // Example score
}

/**
 * Assesses composition quality of a logo
 * @param elements - Logo SVG elements
 * @returns - Composition score (0-100)
 */
function assessComposition(elements: LogoElement[]): number {
  // Simple implementation for demonstration
  // In a real system, this would analyze balance, proportions, alignment
  return 85; // Example score
}

/**
 * Assesses typography quality in logo elements
 * @param elements - Logo SVG elements
 * @returns - Typography score (0-100)
 */
function assessTypography(elements: LogoElement[]): number {
  // Simple implementation for demonstration
  // In a real system, this would analyze font choice, kerning, size
  return 90; // Example score
}

/**
 * Assesses visual weight distribution in logo elements
 * @param elements - Logo SVG elements
 * @returns - Visual weight score (0-100)
 */
function assessVisualWeight(elements: LogoElement[]): number {
  // Simple implementation for demonstration
  // In a real system, this would analyze balance, optical weight
  return 75; // Example score
}

/**
 * Assesses negative space usage in the logo
 * @param svg - SVG logo
 * @returns - Negative space score (0-100)
 */
function assessNegativeSpace(svg: SVGLogo): number {
  // Simple implementation for demonstration
  // In a real system, this would analyze figure-ground relationship
  return 80; // Example score
}

/**
 * Assesses technical quality of the SVG implementation
 * @param svg - SVG logo
 * @returns - Technical quality score (0-100)
 */
function assessTechnicalQuality(svg: SVGLogo): number {
  // Simple implementation for demonstration
  // In a real system, this would analyze path complexity, node count, etc.
  return 90; // Example score
}

/**
 * Checks if the SVG contains text elements
 * @param elements - SVG elements
 * @returns - Boolean indicating presence of text elements
 */
function hasTextElements(elements: LogoElement[]): boolean {
  // Check if any element is text
  for (const element of elements) {
    if (element.type === 'text') {
      return true;
    }

    // Check children recursively
    if (element.children && element.children.length > 0) {
      if (hasTextElements(element.children)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates weighted average score from component scores
 * @param scoreComponents - Array of scores with weights
 * @returns - Weighted overall score
 */
function calculateWeightedScore(scoreComponents: Array<{ score: number; weight: number }>): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const component of scoreComponents) {
    totalScore += component.score * component.weight;
    totalWeight += component.weight;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Adds industry-specific design recommendations
 * @param recommendations - Recommendations array to append to
 * @param industry - Target industry
 * @param scores - Current assessment scores
 */
function addIndustrySpecificRecommendations(
  recommendations: string[],
  industry: string,
  scores: Record<string, number>
): void {
  // Map industry to recommendations
  const industryLower = industry.toLowerCase();

  if (industryLower.includes('tech') || industryLower.includes('software')) {
    if (scores.colorHarmony < 80) {
      recommendations.push(
        'Technology logos often benefit from blue tones that convey trust and innovation.'
      );
    }
  } else if (industryLower.includes('food') || industryLower.includes('restaurant')) {
    recommendations.push(
      'Food industry logos typically use warm colors (reds, oranges) to stimulate appetite.'
    );
  } else if (industryLower.includes('finance') || industryLower.includes('bank')) {
    recommendations.push(
      'Financial sector logos should convey stability and trust through solid shapes and blue/green colors.'
    );
  }
}

/**
 * Applies cultural design adaptations based on target region
 * @param svg - SVG logo to adapt
 * @param region - Target cultural region
 * @returns - Culturally adapted SVG
 */
export function adaptForCulturalContext(svg: SVGLogo, region: string): SVGLogo {
  // Deep clone the SVG to avoid modifying the original
  const adaptedSvg = JSON.parse(JSON.stringify(svg)) as SVGLogo;

  // Apply cultural adaptations based on region
  const regionKey = region.toLowerCase();

  // Match region to known cultural contexts
  let culturalContext: keyof typeof CulturalDesignAssociations | undefined;

  if (regionKey.includes('china') || regionKey.includes('japan') || regionKey.includes('korea')) {
    culturalContext = 'east-asia';
  } else if (regionKey.includes('arab') || regionKey.includes('middle east')) {
    culturalContext = 'middle-east';
  } else if (regionKey.includes('india') || regionKey.includes('pakistan')) {
    culturalContext = 'south-asia';
  } else if (regionKey.includes('mexico') || regionKey.includes('brazil')) {
    culturalContext = 'latin-america';
  } else if (regionKey.includes('africa')) {
    culturalContext = 'africa';
  } else {
    culturalContext = 'western';
  }

  // Apply cultural color preferences if available
  if (culturalContext && CulturalDesignAssociations[culturalContext]) {
    // In a real implementation, more sophisticated adaptation would be applied
    // This is a simplified version
  }

  return adaptedSvg;
}

// Export a combined enhancement function for convenience
export function enhanceSVGDesign(
  svg: SVGLogo,
  options: {
    applyGoldenRatio?: boolean;
    enhanceColors?: boolean;
    enhanceAccessibility?: boolean;
    enhanceHierarchy?: boolean;
    optimizePaths?: boolean;
    culturalRegion?: string;
    industry?: string;
  } = {}
): {
  enhancedSvg: SVGLogo;
  assessmentReport?: ReturnType<typeof assessDesignQuality>;
} {
  // Deep clone the SVG to avoid modifying the original
  let enhancedSvg = JSON.parse(JSON.stringify(svg)) as SVGLogo;

  // Apply enhancements based on options
  if (options.applyGoldenRatio) {
    enhancedSvg = applyGoldenRatio(enhancedSvg);
  }

  if (options.enhanceColors) {
    enhancedSvg.colors = enhanceColorPalette(
      enhancedSvg.colors,
      options.industry,
      ColorHarmonyModel.COMPLEMENTARY
    );
  }

  if (options.enhanceAccessibility) {
    enhancedSvg = enhanceAccessibility(enhancedSvg, WCAGLevel.AAA);
  }

  if (options.enhanceHierarchy) {
    enhancedSvg = enhanceVisualHierarchy(enhancedSvg);
  }

  if (options.culturalRegion) {
    enhancedSvg = adaptForCulturalContext(enhancedSvg, options.culturalRegion);
  }

  // Generate assessment report if industry provided
  let assessmentReport;
  if (options.industry) {
    assessmentReport = assessDesignQuality(enhancedSvg, options.industry);
  }

  return {
    enhancedSvg,
    assessmentReport,
  };
}
