/**
 * Design Intelligence Module
 * 
 * This module provides advanced design intelligence capabilities for enhancing SVG logos.
 * It implements sophisticated design principles like golden ratio, color theory,
 * visual hierarchy, and accessibility optimization.
 */

import { SVGLogo, LogoElement, LogoColors, Typography } from '../types';
import { SVGDesignValidator, SVGDesignQualityScore } from './svg-design-validator';
import { Logger } from './logger';

const logger = new Logger('DesignIntelligence');

// Golden ratio constant (approximately 1.618)
const GOLDEN_RATIO = 1.618033988749895;

// Design constants
const MIN_CONTRAST_RATIO = 4.5; // WCAG AA standard
const OPTIMAL_NEGATIVE_SPACE_PERCENTAGE = 40; // 40% negative space is generally ideal for logos

/**
 * Color representation in HSL format
 */
interface HSLColor {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

/**
 * Color representation in RGB format
 */
interface RGBColor {
  r: number; // Red (0-255)
  g: number; // Green (0-255)
  b: number; // Blue (0-255)
  a?: number; // Alpha (0-1)
}

/**
 * Cultural design adaptation configuration
 */
interface CulturalDesignConfig {
  region: string;
  colorPreferences: {
    favorable: string[];
    unfavorable: string[];
  };
  compositions: string[];
  symbolism: Record<string, string>;
}

/**
 * Design assessment report
 */
export interface DesignAssessment {
  overallScore: number;
  colorHarmony: {
    score: number;
    assessment: string;
    recommendations: string[];
  };
  composition: {
    score: number;
    assessment: string;
    recommendations: string[];
  };
  visualHierarchy: {
    score: number;
    assessment: string;
    recommendations: string[];
  };
  accessibility: {
    score: number;
    assessment: string;
    recommendations: string[];
  };
  technicalQuality: {
    score: number;
    assessment: string;
    recommendations: string[];
  };
}

/**
 * Options for enhancing SVG design
 */
export interface DesignEnhancementOptions {
  applyGoldenRatio?: boolean;
  enhanceColors?: boolean;
  enhanceAccessibility?: boolean;
  enhanceHierarchy?: boolean;
  optimizePaths?: boolean;
  culturalRegion?: string;
  industry?: string;
  preserveOriginalIntent?: boolean;
  accessibilityLevel?: 'A' | 'AA' | 'AAA';
}

// Cultural design configurations for different regions
const culturalDesignConfigs: Record<string, CulturalDesignConfig> = {
  'east-asia': {
    region: 'East Asia',
    colorPreferences: {
      favorable: ['#e60012', '#ffd700', '#000000', '#ffffff'], // Red, gold, black, white
      unfavorable: ['#ffffff00'], // Pure white can symbolize death in some contexts
    },
    compositions: ['balanced', 'circular', 'symmetrical'],
    symbolism: {
      'dragon': 'power, prosperity',
      'circle': 'harmony, unity',
      'bamboo': 'resilience, growth'
    }
  },
  'western': {
    region: 'Western',
    colorPreferences: {
      favorable: ['#0000ff', '#ff0000', '#008000', '#000000'], // Blue, red, green, black
      unfavorable: [],
    },
    compositions: ['asymmetrical', 'dynamic', 'rule-of-thirds'],
    symbolism: {
      'eagle': 'freedom, power',
      'oak': 'strength, endurance',
      'shield': 'protection, security'
    }
  },
  'middle-east': {
    region: 'Middle East',
    colorPreferences: {
      favorable: ['#00843d', '#ffffff', '#c09e6b', '#0033a0'], // Green, white, gold, blue
      unfavorable: ['#999999'], // Gray can be associated with sadness
    },
    compositions: ['geometric', 'arabesque', 'symmetrical'],
    symbolism: {
      'crescent': 'growth, progress',
      'stars': 'divine guidance, aspiration',
      'geometric patterns': 'infinite nature of Allah'
    }
  },
  'south-asia': {
    region: 'South Asia',
    colorPreferences: {
      favorable: ['#ff9933', '#128807', '#0000ff', '#800080'], // Saffron, green, blue, purple
      unfavorable: [],
    },
    compositions: ['ornate', 'detailed', 'symbolic'],
    symbolism: {
      'lotus': 'purity, enlightenment',
      'peacock': 'beauty, grace',
      'wheel': 'dharma, law, truth'
    }
  }
};

// Industry-specific design considerations
const industryDesignGuidelines: Record<string, {
  colorPalettes: string[],
  compositions: string[],
  typography: string[],
  symbolism: Record<string, string>
}> = {
  'technology': {
    colorPalettes: ['blue-focused', 'monochromatic', 'gradient'],
    compositions: ['minimal', 'geometric', 'abstract'],
    typography: ['sans-serif', 'modern', 'clean'],
    symbolism: {
      'circuit': 'connection, intelligence',
      'pixel': 'digital, precision',
      'arrow': 'progress, forward-thinking'
    }
  },
  'finance': {
    colorPalettes: ['blue-navy', 'green-blue', 'monochromatic-blue'],
    compositions: ['symmetrical', 'stable', 'balanced'],
    typography: ['serif', 'established', 'professional'],
    symbolism: {
      'shield': 'security, protection',
      'pillar': 'stability, strength',
      'arrow-up': 'growth, prosperity'
    }
  },
  'healthcare': {
    colorPalettes: ['blue-green', 'pastel', 'clean'],
    compositions: ['circular', 'flowing', 'organic'],
    typography: ['rounded', 'friendly', 'clear'],
    symbolism: {
      'heart': 'care, compassion',
      'cross': 'medical assistance',
      'hand': 'support, helping'
    }
  },
  'food': {
    colorPalettes: ['warm', 'appetizing', 'vibrant'],
    compositions: ['organic', 'flowing', 'appetizing'],
    typography: ['script', 'handwritten', 'friendly'],
    symbolism: {
      'leaf': 'freshness, organic',
      'fork': 'dining, cuisine',
      'flame': 'cooking, passion'
    }
  },
  'creative': {
    colorPalettes: ['vibrant', 'complementary', 'expressive'],
    compositions: ['asymmetrical', 'dynamic', 'unique'],
    typography: ['expressive', 'custom', 'artistic'],
    symbolism: {
      'brush': 'creativity, artistry',
      'eye': 'vision, perspective',
      'lightbulb': 'ideas, innovation'
    }
  }
};

/**
 * Enhances an SVG logo design by applying advanced design principles
 * 
 * @param svg - The SVG logo to enhance
 * @param options - Design enhancement options
 * @returns Enhanced SVG and design assessment
 */
export function enhanceSVGDesign(
  svg: SVGLogo,
  options: DesignEnhancementOptions = {}
): {
  enhancedSvg: SVGLogo;
  assessmentReport?: DesignAssessment;
} {
  logger.info('Enhancing SVG design with advanced design principles', { options });
  
  try {
    // Create a copy of the original SVG to work with
    const enhancedSvg: SVGLogo = JSON.parse(JSON.stringify(svg));
    
    // Apply golden ratio principles if requested
    if (options.applyGoldenRatio !== false) {
      applyGoldenRatioPrinciples(enhancedSvg);
    }
    
    // Enhance colors if requested
    if (options.enhanceColors !== false) {
      enhanceColorPalette(enhancedSvg, options.industry);
    }
    
    // Enhance accessibility if requested
    if (options.enhanceAccessibility !== false) {
      enhanceAccessibility(enhancedSvg, options.accessibilityLevel || 'AA');
    }
    
    // Enhance visual hierarchy if requested
    if (options.enhanceHierarchy !== false) {
      enhanceVisualHierarchy(enhancedSvg);
    }
    
    // Optimize paths if requested
    if (options.optimizePaths !== false) {
      optimizePaths(enhancedSvg);
    }
    
    // Apply cultural design adaptations if a region is specified
    if (options.culturalRegion && culturalDesignConfigs[options.culturalRegion]) {
      applyCulturalDesignAdaptations(enhancedSvg, options.culturalRegion);
    }
    
    // Apply industry-specific enhancements if an industry is specified
    if (options.industry && industryDesignGuidelines[options.industry]) {
      applyIndustrySpecificEnhancements(enhancedSvg, options.industry);
    }
    
    // Rebuild the SVG code from the enhanced elements
    enhancedSvg.svgCode = rebuildSVGFromElements(enhancedSvg);
    
    // Perform a design quality assessment
    const designAssessment = assessDesignQuality(enhancedSvg);
    
    logger.info('SVG design enhancement complete', { 
      overallScore: designAssessment.overallScore
    });
    
    return {
      enhancedSvg,
      assessmentReport: designAssessment
    };
  } catch (error) {
    logger.error('Error enhancing SVG design', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return the original SVG in case of errors
    return { enhancedSvg: svg };
  }
}

/**
 * Applies golden ratio principles to the SVG layout
 * 
 * @param svg - The SVG logo to enhance
 */
function applyGoldenRatioPrinciples(svg: SVGLogo): void {
  logger.debug('Applying golden ratio principles');
  
  // Determine the primary dimensions for the golden ratio
  const width = svg.width;
  const height = svg.height;
  
  // Calculate golden ratio segments
  const goldenWidth = width / GOLDEN_RATIO;
  const goldenHeight = height / GOLDEN_RATIO;
  
  // Create a list of key points for golden ratio grid
  const goldenPoints = [
    { x: goldenWidth, y: 0 },
    { x: goldenWidth, y: height },
    { x: 0, y: goldenHeight },
    { x: width, y: goldenHeight },
    { x: width - goldenWidth, y: 0 },
    { x: width - goldenWidth, y: height },
    { x: 0, y: height - goldenHeight },
    { x: width, y: height - goldenHeight }
  ];
  
  // Identify significant elements for repositioning
  const significantElements = findSignificantElements(svg.elements);
  
  // Reposition elements to align with golden ratio points
  if (significantElements.length > 0) {
    // Get the primary element (usually the largest or most central)
    const primaryElement = significantElements[0];
    
    // Get element center
    const elementCenter = calculateElementCenter(primaryElement);
    
    // Find the closest golden point
    const closestPoint = findClosestPoint(elementCenter, goldenPoints);
    
    // Only reposition if the element is not already close to a golden point
    const distance = Math.sqrt(
      Math.pow(elementCenter.x - closestPoint.x, 2) + 
      Math.pow(elementCenter.y - closestPoint.y, 2)
    );
    
    // If the element is far from golden ratio points, adjust its position
    // We use a threshold of 10% of the smaller dimension
    const threshold = Math.min(width, height) * 0.1;
    
    if (distance > threshold) {
      // Calculate the shift needed
      const shiftX = closestPoint.x - elementCenter.x;
      const shiftY = closestPoint.y - elementCenter.y;
      
      // Apply the shift to the primary element
      applyTransformToElement(primaryElement, shiftX, shiftY);
    }
  }
}

/**
 * Finds the most significant elements in the SVG
 * 
 * @param elements - Array of SVG elements
 * @returns Array of significant elements
 */
function findSignificantElements(elements: LogoElement[]): LogoElement[] {
  // Filter for visible elements
  const visibleElements = elements.filter(el => {
    // Check for elements with opacity 0 or display none
    return !(
      el.attributes.opacity === 0 || 
      el.attributes.display === 'none' || 
      el.attributes.visibility === 'hidden'
    );
  });
  
  // Simple scoring based on size and type
  const scoredElements = visibleElements.map(el => {
    let score = 0;
    
    // Score based on element type
    switch (el.type) {
      case 'path': score += 5; break;
      case 'text': score += 8; break;
      case 'circle': score += 3; break;
      case 'rect': score += 4; break;
      case 'ellipse': score += 3; break;
      case 'polygon': score += 4; break;
      case 'group': score += (el.children?.length || 0) * 2; break;
    }
    
    // Score based on size (if available)
    if (el.attributes.width && el.attributes.height) {
      const area = Number(el.attributes.width) * Number(el.attributes.height);
      score += area / 1000; // Normalize large areas
    } else if (el.attributes.r) {
      // For circles, use area calculation
      const radius = Number(el.attributes.r);
      score += Math.PI * radius * radius / 500;
    }
    
    // Score based on fill/stroke
    if (el.attributes.fill && el.attributes.fill !== 'none') {
      score += 2;
    }
    if (el.attributes.stroke && el.attributes.stroke !== 'none') {
      score += 1;
    }
    
    return { element: el, score };
  });
  
  // Sort by score (descending)
  scoredElements.sort((a, b) => b.score - a.score);
  
  // Return the elements in order of significance
  return scoredElements.map(item => item.element);
}

/**
 * Calculate the center position of an element
 * 
 * @param element - SVG element
 * @returns Center coordinates
 */
function calculateElementCenter(element: LogoElement): { x: number, y: number } {
  switch (element.type) {
    case 'circle':
      return {
        x: Number(element.attributes.cx) || 0,
        y: Number(element.attributes.cy) || 0
      };
    
    case 'rect':
      return {
        x: (Number(element.attributes.x) || 0) + (Number(element.attributes.width) || 0) / 2,
        y: (Number(element.attributes.y) || 0) + (Number(element.attributes.height) || 0) / 2
      };
    
    case 'ellipse':
      return {
        x: Number(element.attributes.cx) || 0,
        y: Number(element.attributes.cy) || 0
      };
    
    case 'text':
      return {
        x: Number(element.attributes.x) || 0,
        y: Number(element.attributes.y) || 0
      };
    
    case 'path':
      // For paths, we need to estimate center
      // This is a simplified approach that assumes the path's attributes include transform-origin
      if (element.attributes['transform-origin']) {
        const origin = String(element.attributes['transform-origin']).split(' ');
        return {
          x: Number(origin[0]) || 0,
          y: Number(origin[1]) || 0
        };
      }
      
      // Fallback: check for x, y attributes
      return {
        x: Number(element.attributes.x) || 0,
        y: Number(element.attributes.y) || 0
      };
    
    default:
      // Default center calculation
      return {
        x: Number(element.attributes.x) || 0,
        y: Number(element.attributes.y) || 0
      };
  }
}

/**
 * Find the closest point from a set of points to a target
 * 
 * @param target - Target point
 * @param points - Array of points to check
 * @returns The closest point
 */
function findClosestPoint(target: { x: number, y: number }, points: Array<{ x: number, y: number }>): { x: number, y: number } {
  let closestPoint = points[0];
  let minDistance = Number.MAX_VALUE;
  
  for (const point of points) {
    const distance = Math.sqrt(
      Math.pow(target.x - point.x, 2) + 
      Math.pow(target.y - point.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }
  
  return closestPoint;
}

/**
 * Apply a transformation to an SVG element
 * 
 * @param element - The element to transform
 * @param shiftX - X-axis shift
 * @param shiftY - Y-axis shift
 */
function applyTransformToElement(element: LogoElement, shiftX: number, shiftY: number): void {
  // Preserve any existing transform
  let existingTransform = element.attributes.transform as string | undefined;
  
  if (existingTransform) {
    // Append the new translation to the existing transform
    element.attributes.transform = `${existingTransform} translate(${shiftX},${shiftY})`;
  } else {
    // Set a new transform
    element.attributes.transform = `translate(${shiftX},${shiftY})`;
  }
  
  // If the element is a group, update children's transforms accordingly
  if (element.type === 'group' && element.children?.length) {
    for (const child of element.children) {
      applyTransformToElement(child, shiftX, shiftY);
    }
  }
}

/**
 * Enhances the color palette of an SVG logo
 * 
 * @param svg - The SVG logo to enhance
 * @param industry - Optional industry for industry-specific color recommendations
 */
function enhanceColorPalette(svg: SVGLogo, industry?: string): void {
  logger.debug('Enhancing color palette', { industry });
  
  // Get the current colors
  const colors = svg.colors;
  
  // Convert colors to HSL for easier manipulation
  const primaryHSL = hexToHSL(colors.primary);
  const secondaryHSL = colors.secondary ? hexToHSL(colors.secondary) : undefined;
  const tertiaryHSL = colors.tertiary ? hexToHSL(colors.tertiary) : undefined;
  const accentHSL = colors.accent ? hexToHSL(colors.accent) : undefined;
  
  // Check color harmony and adjust if needed
  if (secondaryHSL) {
    // Check if colors form a harmonious relationship
    const harmony = detectColorHarmony(primaryHSL, secondaryHSL);
    
    if (!harmony.isHarmonious) {
      // Adjust secondary color to create harmony
      const adjustedSecondary = createHarmoniousColor(primaryHSL, harmony.suggestedRelationship);
      colors.secondary = hslToHex(adjustedSecondary);
    }
  }
  
  // Ensure sufficient contrast for accessibility
  const backgroundHSL = colors.background ? hexToHSL(colors.background) : hexToHSL('#ffffff'); // Default to white
  
  // Check contrast against background
  const primaryContrast = calculateContrastRatio(
    hslToRGB(primaryHSL),
    hslToRGB(backgroundHSL)
  );
  
  // If contrast is insufficient, adjust the color lightness
  if (primaryContrast < MIN_CONTRAST_RATIO) {
    // Adjust lightness to improve contrast
    if (primaryHSL.l > 50) {
      // Dark background, lighten the foreground
      primaryHSL.l = Math.min(95, primaryHSL.l + 15);
    } else {
      // Light background, darken the foreground
      primaryHSL.l = Math.max(5, primaryHSL.l - 15);
    }
    colors.primary = hslToHex(primaryHSL);
  }
  
  // Apply psychological color theory based on industry
  if (industry) {
    applyIndustryColorPsychology(colors, industry);
  }
  
  // Update the colors in the SVG
  updateSVGColors(svg, colors);
}

/**
 * Detects if two colors form a harmonious relationship
 * 
 * @param color1 - First color in HSL
 * @param color2 - Second color in HSL
 * @returns Harmony assessment
 */
function detectColorHarmony(color1: HSLColor, color2: HSLColor): {
  isHarmonious: boolean;
  relationship: 'complementary' | 'analogous' | 'monochromatic' | 'triadic' | 'none';
  suggestedRelationship: 'complementary' | 'analogous' | 'monochromatic';
} {
  // Calculate hue difference (0-180)
  const hueDiff = Math.abs(color1.h - color2.h);
  const normalizedHueDiff = hueDiff > 180 ? 360 - hueDiff : hueDiff;
  
  // Check for common color harmonies
  let relationship: 'complementary' | 'analogous' | 'monochromatic' | 'triadic' | 'none' = 'none';
  
  if (normalizedHueDiff < 30) {
    // Analogous colors (adjacent on the color wheel)
    relationship = 'analogous';
  } else if (Math.abs(normalizedHueDiff - 180) < 30) {
    // Complementary colors (opposite on the color wheel)
    relationship = 'complementary';
  } else if (Math.abs(normalizedHueDiff - 120) < 30) {
    // Triadic colors (form an equilateral triangle on the color wheel)
    relationship = 'triadic';
  } else if (Math.abs(color1.h - color2.h) < 10 && Math.abs(color1.s - color2.s) > 10) {
    // Monochromatic colors (same hue, different saturation/lightness)
    relationship = 'monochromatic';
  }
  
  // Determine if the relationship is harmonious
  const isHarmonious = relationship !== 'none';
  
  // Suggest a harmony relationship if not harmonious
  let suggestedRelationship: 'complementary' | 'analogous' | 'monochromatic' = 'complementary';
  
  // Base suggestion on the current colors
  if (color1.s < 30 || color2.s < 30) {
    // Low saturation colors work well with monochromatic schemes
    suggestedRelationship = 'monochromatic';
  } else if (color1.l > 70 || color1.l < 30) {
    // Very light or dark colors often work well with analogous schemes
    suggestedRelationship = 'analogous';
  } else {
    // Default to complementary for rich, vibrant colors
    suggestedRelationship = 'complementary';
  }
  
  return {
    isHarmonious,
    relationship,
    suggestedRelationship
  };
}

/**
 * Creates a harmonious color based on a source color and desired relationship
 * 
 * @param sourceColor - Source color in HSL
 * @param relationship - Desired color relationship
 * @returns New harmonious color in HSL
 */
function createHarmoniousColor(
  sourceColor: HSLColor,
  relationship: 'complementary' | 'analogous' | 'monochromatic'
): HSLColor {
  switch (relationship) {
    case 'complementary':
      // Opposite on the color wheel
      return {
        h: (sourceColor.h + 180) % 360,
        s: Math.min(100, sourceColor.s + 10), // Slightly more saturated
        l: sourceColor.l > 50 ? sourceColor.l - 10 : sourceColor.l + 10 // Adjust lightness for better contrast
      };
    
    case 'analogous':
      // Adjacent on the color wheel (30° away)
      return {
        h: (sourceColor.h + 30) % 360,
        s: Math.min(100, Math.max(20, sourceColor.s - 10)), // Slightly less saturated
        l: sourceColor.l
      };
    
    case 'monochromatic':
      // Same hue, different saturation and lightness
      return {
        h: sourceColor.h,
        s: Math.max(20, Math.min(90, sourceColor.s + (Math.random() > 0.5 ? 20 : -20))),
        l: Math.max(20, Math.min(80, sourceColor.l + (Math.random() > 0.5 ? 15 : -15)))
      };
      
    default:
      // Default to complementary
      return {
        h: (sourceColor.h + 180) % 360,
        s: sourceColor.s,
        l: sourceColor.l
      };
  }
}

/**
 * Applies industry-specific color psychology principles
 * 
 * @param colors - Logo colors
 * @param industry - Industry name
 */
function applyIndustryColorPsychology(colors: LogoColors, industry: string): void {
  const industryLower = industry.toLowerCase();
  
  // Apply industry-specific color guidelines if they exist
  if (industryDesignGuidelines[industryLower]) {
    const guidelines = industryDesignGuidelines[industryLower];
    
    // Check if industry has specific palette recommendations
    if (guidelines.colorPalettes?.length) {
      // Just log the recommendation - actual color changes would be too intrusive
      logger.debug(`Recommended color palettes for ${industry}: ${guidelines.colorPalettes.join(', ')}`);
      
      // Subtle adjustments only, mainly to saturation and lightness based on industry
      const primaryHSL = hexToHSL(colors.primary);
      
      // Apply subtle industry-specific color adjustments
      switch (industryLower) {
        case 'technology':
          // Tech often uses more saturated blues, cooler colors
          if (primaryHSL.h > 180 && primaryHSL.h < 240) {
            primaryHSL.s = Math.min(100, primaryHSL.s + 10); // Increase saturation for blues
          }
          break;
          
        case 'healthcare':
          // Healthcare often uses more muted blues and greens
          if ((primaryHSL.h > 180 && primaryHSL.h < 240) || (primaryHSL.h > 90 && primaryHSL.h < 150)) {
            primaryHSL.s = Math.max(30, Math.min(70, primaryHSL.s)); // Moderate saturation
            primaryHSL.l = Math.max(40, Math.min(60, primaryHSL.l)); // Moderate lightness
          }
          break;
          
        case 'food':
          // Food often uses warm, appetizing colors
          if (primaryHSL.h < 60 || primaryHSL.h > 300) {
            primaryHSL.s = Math.min(100, primaryHSL.s + 15); // Increase saturation for reds/oranges
            primaryHSL.l = Math.max(45, primaryHSL.l); // Ensure sufficient lightness
          }
          break;
          
        case 'finance':
          // Finance often uses more conservative, trustworthy colors
          if (primaryHSL.h > 180 && primaryHSL.h < 240) {
            // Blue range - make slightly more serious
            primaryHSL.s = Math.min(90, primaryHSL.s); // Cap saturation
            primaryHSL.l = Math.max(20, Math.min(50, primaryHSL.l)); // Darker blues for trustworthiness
          } else if (primaryHSL.h > 90 && primaryHSL.h < 150) {
            // Green range - make money-associated
            primaryHSL.s = Math.min(80, primaryHSL.s); // Cap saturation
            primaryHSL.l = Math.max(25, Math.min(45, primaryHSL.l)); // Deeper greens
          }
          break;
          
        case 'creative':
          // Creative industries often use more vibrant, unique colors
          primaryHSL.s = Math.min(100, primaryHSL.s + 10); // Increase saturation
          // No lightness adjustment - creative industries can use the full range
          break;
      }
      
      // Apply the adjusted primary color
      colors.primary = hslToHex(primaryHSL);
    }
  }
}

/**
 * Enhances accessibility of SVG logo
 * 
 * @param svg - The SVG logo to enhance
 * @param level - WCAG conformance level (A, AA, AAA)
 */
function enhanceAccessibility(svg: SVGLogo, level: 'A' | 'AA' | 'AAA'): void {
  logger.debug('Enhancing accessibility', { level });
  
  // Set minimum contrast ratios based on WCAG level
  let minContrastRatio = 3; // Level A
  
  if (level === 'AA') {
    minContrastRatio = 4.5; // Level AA
  } else if (level === 'AAA') {
    minContrastRatio = 7; // Level AAA
  }
  
  // Get background color or default to white
  const backgroundColorHex = svg.colors.background || '#ffffff';
  const backgroundColor = hexToRGB(backgroundColorHex);
  
  // Check and fix text contrast
  const textElements = findElementsByType(svg.elements, 'text');
  
  for (const textElement of textElements) {
    // Get text color or use primary color as fallback
    const textColorHex = (textElement.attributes.fill as string) || svg.colors.primary;
    const textColor = hexToRGB(textColorHex);
    
    // Calculate contrast ratio
    const contrastRatio = calculateContrastRatio(textColor, backgroundColor);
    
    // If contrast is insufficient, adjust the text color
    if (contrastRatio < minContrastRatio) {
      // Convert to HSL for easier adjustment
      const textColorHSL = hexToHSL(textColorHex);
      
      // Adjust lightness to improve contrast
      const backgroundLightness = hexToHSL(backgroundColorHex).l;
      
      if (backgroundLightness > 50) {
        // Dark text on light background
        textColorHSL.l = Math.max(0, textColorHSL.l - 30);
      } else {
        // Light text on dark background
        textColorHSL.l = Math.min(100, textColorHSL.l + 30);
      }
      
      // Update the text element with the new color
      textElement.attributes.fill = hslToHex(textColorHSL);
    }
  }
  
  // Add title and description elements for screen readers
  if (!svg.svgCode.includes('<title>')) {
    svg.svgCode = svg.svgCode.replace(/<svg([^>]*)>/, `<svg$1><title>${svg.name} Logo</title>`);
  }
  
  // Add aria-label if not present
  if (!svg.svgCode.includes('aria-label')) {
    svg.svgCode = svg.svgCode.replace(/<svg([^>]*)>/, `<svg$1 aria-label="${svg.name} Logo">`);
  }
  
  // Add role="img" if not present
  if (!svg.svgCode.includes('role=')) {
    svg.svgCode = svg.svgCode.replace(/<svg([^>]*)>/, `<svg$1 role="img">`);
  }
}

/**
 * Enhances visual hierarchy using Gestalt principles
 * 
 * @param svg - The SVG logo to enhance
 */
function enhanceVisualHierarchy(svg: SVGLogo): void {
  logger.debug('Enhancing visual hierarchy using Gestalt principles');
  
  // Get all elements in the SVG
  const allElements = getAllElements(svg.elements);
  
  // Skip if very few elements
  if (allElements.length < 3) return;
  
  // Identify primary and secondary elements based on size and type
  const rankedElements = rankElementsByImportance(allElements);
  
  // Apply proximity principle - Group related elements closer together
  applyProximityPrinciple(svg, rankedElements);
  
  // Apply similarity principle - Make similar elements look similar
  applySimilarityPrinciple(svg, rankedElements);
  
  // Apply continuity principle - Align elements along a common path/direction
  applyContinuityPrinciple(svg, rankedElements);
  
  // Apply figure-ground principle - Ensure clear distinction between foreground and background
  applyFigureGroundPrinciple(svg);
}

/**
 * Ranks elements by their visual importance
 * 
 * @param elements - Array of logo elements
 * @returns Elements sorted by importance
 */
function rankElementsByImportance(elements: LogoElement[]): LogoElement[] {
  return elements.sort((a, b) => {
    // Calculate approximate size/importance
    const aSize = calculateApproximateSize(a);
    const bSize = calculateApproximateSize(b);
    
    // Text elements are often important
    if (a.type === 'text' && b.type !== 'text') return -1;
    if (a.type !== 'text' && b.type === 'text') return 1;
    
    // Compare sizes (larger = more important)
    return bSize - aSize;
  });
}

/**
 * Calculate approximate visual size of an element
 * 
 * @param element - SVG element
 * @returns Approximate size score
 */
function calculateApproximateSize(element: LogoElement): number {
  let size = 0;
  
  switch (element.type) {
    case 'rect':
      size = Number(element.attributes.width || 0) * Number(element.attributes.height || 0);
      break;
      
    case 'circle':
      const r = Number(element.attributes.r || 0);
      size = Math.PI * r * r;
      break;
      
    case 'ellipse':
      const rx = Number(element.attributes.rx || 0);
      const ry = Number(element.attributes.ry || 0);
      size = Math.PI * rx * ry;
      break;
      
    case 'path':
      // Approximate size based on path length if d attribute exists
      const d = element.attributes.d as string;
      size = d ? d.length / 2 : 0;
      break;
      
    case 'text':
      // Text elements get a base size plus length-based bonus
      const content = element.attributes.content as string || '';
      size = 100 + (content ? content.length * 10 : 0);
      break;
      
    default:
      size = 50; // Default size for unknown elements
  }
  
  // Boost size for filled elements
  if (element.attributes.fill && element.attributes.fill !== 'none') {
    size *= 1.5;
  }
  
  return size;
}

/**
 * Applies the proximity Gestalt principle to group related elements
 * 
 * @param svg - The SVG logo
 * @param rankedElements - Elements ranked by importance
 */
function applyProximityPrinciple(svg: SVGLogo, rankedElements: LogoElement[]): void {
  // This would involve complex spatial rearrangement
  // For now, we'll implement a simplified version that adjusts spacing between text and related elements
  
  // Find text elements and their potential related elements
  const textElements = rankedElements.filter(el => el.type === 'text');
  
  for (const textEl of textElements) {
    const textCenter = calculateElementCenter(textEl);
    
    // Find elements that might be related to this text (close to it)
    const relatedElements = rankedElements.filter(el => {
      if (el.id === textEl.id) return false;
      
      const elCenter = calculateElementCenter(el);
      const distance = Math.sqrt(
        Math.pow(textCenter.x - elCenter.x, 2) + 
        Math.pow(textCenter.y - elCenter.y, 2)
      );
      
      // Consider elements within 25% of SVG width/height as potentially related
      const threshold = Math.min(svg.width, svg.height) * 0.25;
      return distance < threshold;
    });
    
    // Adjust spacing to be more consistent for related elements
    if (relatedElements.length > 0) {
      // This is a placeholder for more complex spatial rearrangement
      // In a real implementation, we would calculate optimal positioning
      logger.debug('Proximity principle: Identified related elements for text', {
        textId: textEl.id,
        relatedCount: relatedElements.length
      });
    }
  }
}

/**
 * Applies the similarity Gestalt principle
 * 
 * @param svg - The SVG logo
 * @param rankedElements - Elements ranked by importance
 */
function applySimilarityPrinciple(svg: SVGLogo, rankedElements: LogoElement[]): void {
  // Group elements by type
  const elementsByType: Record<string, LogoElement[]> = {};
  
  for (const el of rankedElements) {
    if (!elementsByType[el.type]) {
      elementsByType[el.type] = [];
    }
    elementsByType[el.type].push(el);
  }
  
  // For each type with multiple elements, ensure consistent styling
  for (const type in elementsByType) {
    const elements = elementsByType[type];
    
    if (elements.length < 2) continue;
    
    // Find the most common fill color
    const fillColors: Record<string, number> = {};
    
    for (const el of elements) {
      const fill = el.attributes.fill as string;
      if (fill && fill !== 'none') {
        fillColors[fill] = (fillColors[fill] || 0) + 1;
      }
    }
    
    // Get most common fill color
    let mostCommonFill = '';
    let maxCount = 0;
    
    for (const fill in fillColors) {
      if (fillColors[fill] > maxCount) {
        maxCount = fillColors[fill];
        mostCommonFill = fill;
      }
    }
    
    // Apply consistent styling to similar elements
    if (mostCommonFill) {
      for (const el of elements) {
        // Only harmonize fill colors for elements without explicit fill or with uncommon fills
        if (!el.attributes.fill || el.attributes.fill === 'none') {
          el.attributes.fill = mostCommonFill;
        }
      }
    }
  }
}

/**
 * Applies the continuity Gestalt principle
 * 
 * @param svg - The SVG logo
 * @param rankedElements - Elements ranked by importance
 */
function applyContinuityPrinciple(svg: SVGLogo, rankedElements: LogoElement[]): void {
  // This would typically involve aligning elements along a common axis or path
  // For simplicity, we'll focus on horizontal/vertical alignment of elements
  
  // Group elements by approximate y-coordinate (horizontal alignment)
  const horizontalGroups: Record<number, LogoElement[]> = {};
  
  // Group elements by approximate x-coordinate (vertical alignment)
  const verticalGroups: Record<number, LogoElement[]> = {};
  
  // Round coordinates to create groupings
  const roundingFactor = Math.min(svg.width, svg.height) * 0.05; // 5% of the smaller dimension
  
  for (const el of rankedElements) {
    const center = calculateElementCenter(el);
    
    // Round coordinates to create groupings
    const roundedY = Math.round(center.y / roundingFactor) * roundingFactor;
    const roundedX = Math.round(center.x / roundingFactor) * roundingFactor;
    
    // Add to horizontal alignment group
    if (!horizontalGroups[roundedY]) {
      horizontalGroups[roundedY] = [];
    }
    horizontalGroups[roundedY].push(el);
    
    // Add to vertical alignment group
    if (!verticalGroups[roundedX]) {
      verticalGroups[roundedX] = [];
    }
    verticalGroups[roundedX].push(el);
  }
  
  // Identify potential alignment groups (2 or more elements)
  const horizontalAlignments = Object.entries(horizontalGroups)
    .filter(([, elements]) => elements.length >= 2)
    .map(([y, elements]) => ({
      y: Number(y),
      elements
    }));
  
  const verticalAlignments = Object.entries(verticalGroups)
    .filter(([, elements]) => elements.length >= 2)
    .map(([x, elements]) => ({
      x: Number(x),
      elements
    }));
  
  // Log alignment opportunities - in real implementation, we would adjust positions
  if (horizontalAlignments.length > 0 || verticalAlignments.length > 0) {
    logger.debug('Continuity principle: Identified alignment opportunities', {
      horizontalGroups: horizontalAlignments.length,
      verticalGroups: verticalAlignments.length
    });
  }
}

/**
 * Applies the figure-ground Gestalt principle
 * 
 * @param svg - The SVG logo
 */
function applyFigureGroundPrinciple(svg: SVGLogo): void {
  // The figure-ground principle ensures clear distinction between foreground and background
  // For logos, this often means ensuring sufficient contrast between elements and background
  
  // Get background color (default to white if not specified)
  const backgroundColor = hexToRGB(svg.colors.background || '#ffffff');
  
  // Check contrast of main elements against the background
  const allElements = getAllElements(svg.elements);
  
  for (const element of allElements) {
    // Skip elements without fill
    if (!element.attributes.fill || element.attributes.fill === 'none') continue;
    
    // Get element fill color
    const fillColor = hexToRGB(element.attributes.fill as string);
    
    // Calculate contrast ratio
    const contrastRatio = calculateContrastRatio(fillColor, backgroundColor);
    
    // If contrast is too low, adjust the element's fill color
    if (contrastRatio < 3.0) { // Level A minimum for contrast
      // Convert to HSL for easier adjustment
      const fillHSL = rgbToHSL(fillColor);
      
      // Adjust lightness to increase contrast
      const bgLightness = rgbToHSL(backgroundColor).l;
      
      if (bgLightness > 50) {
        // Background is light, darken the element
        fillHSL.l = Math.max(0, fillHSL.l - 20);
      } else {
        // Background is dark, lighten the element
        fillHSL.l = Math.min(100, fillHSL.l + 20);
      }
      
      // Update the element's fill color
      element.attributes.fill = hslToHex(fillHSL);
    }
  }
}

/**
 * Optimizes SVG paths for technical excellence
 * 
 * @param svg - The SVG logo to optimize
 */
function optimizePaths(svg: SVGLogo): void {
  logger.debug('Optimizing SVG paths for technical excellence');
  
  // Find all path elements
  const pathElements = findElementsByType(svg.elements, 'path');
  
  for (const pathElement of pathElements) {
    const pathData = pathElement.attributes.d as string;
    
    if (!pathData) continue;
    
    // Simplify path data (remove unnecessary precision and commands)
    const simplifiedPath = simplifyPathData(pathData);
    
    // Update the path data if it changed
    if (simplifiedPath !== pathData) {
      pathElement.attributes.d = simplifiedPath;
    }
  }
}

/**
 * Simplifies SVG path data for better performance
 * 
 * @param pathData - SVG path data string
 * @returns Simplified path data
 */
function simplifyPathData(pathData: string): string {
  // This is a simplified implementation - real path optimization is more complex
  
  // Remove unnecessary decimal precision (more than 2 decimal places)
  const reducedPrecision = pathData.replace(/(\d+\.\d{2})\d+/g, '$1');
  
  // Remove redundant zero decimal points (5.0 -> 5)
  const removedZeroDecimals = reducedPrecision.replace(/(\d+)\.0([^0-9])/g, '$1$2');
  
  // Simplify consecutive commands of the same type
  // This would require proper path parsing to implement correctly
  
  return removedZeroDecimals;
}

/**
 * Applies cultural design adaptations based on region
 * 
 * @param svg - The SVG logo to adapt
 * @param region - Cultural region identifier
 */
function applyCulturalDesignAdaptations(svg: SVGLogo, region: string): void {
  logger.debug('Applying cultural design adaptations', { region });
  
  const culturalConfig = culturalDesignConfigs[region];
  
  if (!culturalConfig) {
    logger.warn(`No cultural design configuration found for region: ${region}`);
    return;
  }
  
  // Check if colors need adaptation
  if (culturalConfig.colorPreferences.favorable.length > 0) {
    // Get the primary color in HSL for easier comparison
    const primaryColorHSL = hexToHSL(svg.colors.primary);
    
    // Check if the primary color is in the unfavorable list
    const isUnfavorable = culturalConfig.colorPreferences.unfavorable.some(color => {
      const unfavorableHSL = hexToHSL(color);
      const hueDifference = Math.abs(unfavorableHSL.h - primaryColorHSL.h);
      const normalizedHueDiff = hueDifference > 180 ? 360 - hueDifference : hueDifference;
      
      // If color is very similar to an unfavorable one
      return normalizedHueDiff < 20 && 
             Math.abs(unfavorableHSL.s - primaryColorHSL.s) < 20 &&
             Math.abs(unfavorableHSL.l - primaryColorHSL.l) < 20;
    });
    
    // If the primary color is unfavorable, suggest an alternative
    if (isUnfavorable && culturalConfig.colorPreferences.favorable.length > 0) {
      // Select a favorable color that's most different from the current one
      let bestAlternative = culturalConfig.colorPreferences.favorable[0];
      let maxDifference = 0;
      
      for (const favorable of culturalConfig.colorPreferences.favorable) {
        const favorableHSL = hexToHSL(favorable);
        const hueDifference = Math.abs(favorableHSL.h - primaryColorHSL.h);
        const normalizedHueDiff = hueDifference > 180 ? 360 - hueDifference : hueDifference;
        
        if (normalizedHueDiff > maxDifference) {
          maxDifference = normalizedHueDiff;
          bestAlternative = favorable;
        }
      }
      
      // Log the suggestion - actual color changes would require user approval
      logger.info(`Cultural adaptation: Recommended color change from ${svg.colors.primary} to ${bestAlternative} for ${region} region`);
    }
  }
}

/**
 * Applies industry-specific enhancements to the logo
 * 
 * @param svg - The SVG logo to enhance
 * @param industry - Industry identifier
 */
function applyIndustrySpecificEnhancements(svg: SVGLogo, industry: string): void {
  logger.debug('Applying industry-specific enhancements', { industry });
  
  const guidelines = industryDesignGuidelines[industry];
  
  if (!guidelines) {
    logger.warn(`No industry guidelines found for: ${industry}`);
    return;
  }
  
  // Apply industry-specific typography recommendations
  if (guidelines.typography && guidelines.typography.length > 0) {
    // Find text elements
    const textElements = findElementsByType(svg.elements, 'text');
    
    if (textElements.length > 0) {
      // Log typography recommendations - actual font changes would require user approval
      logger.info(`Industry-specific typography recommendations for ${industry}: ${guidelines.typography.join(', ')}`);
    }
  }
}

/**
 * Rebuilds SVG code from element tree
 * 
 * @param svg - SVG logo with modified elements
 * @returns Updated SVG code
 */
function rebuildSVGFromElements(svg: SVGLogo): string {
  // This is a simplified implementation that assumes the elements tree
  // structure accurately reflects the SVG DOM structure.
  // In practice, rebuilding SVG from elements would require a more robust approach.
  
  // Start with the SVG opening tag
  let svgCode = svg.svgCode;
  
  // Extract opening tag
  const svgOpeningTag = svgCode.match(/<svg[^>]*>/);
  if (!svgOpeningTag) return svgCode; // Return original if no opening tag found
  
  // Extract closing tag
  const svgClosingTag = '</svg>';
  
  // Rebuild the SVG code by replacing everything between the opening and closing tags
  // with the serialized elements
  const contentStart = svgOpeningTag[0].length;
  const contentEnd = svgCode.lastIndexOf(svgClosingTag);
  
  if (contentEnd > contentStart) {
    // Generate new content from elements
    // This is a stub - real implementation would serialize the element tree
    // For now, just return the original SVG code
    return svgCode;
  }
  
  return svgCode;
}

/**
 * Assesses the design quality of an SVG logo
 * 
 * @param svg - The SVG logo to assess
 * @returns Design assessment report
 */
function assessDesignQuality(svg: SVGLogo): DesignAssessment {
  logger.debug('Assessing design quality');
  
  // Use the existing SVGDesignValidator to get a base assessment
  const validationResult = SVGDesignValidator.validateDesignQuality(svg.svgCode);
  const designQualityScore = validationResult.designQualityScore;
  
  if (!designQualityScore) {
    // Default assessment if validator fails
    return {
      overallScore: 70,
      colorHarmony: {
        score: 70,
        assessment: 'Color harmony assessment not available',
        recommendations: ['Use a color wheel to check for complementary or analogous color relationships']
      },
      composition: {
        score: 70,
        assessment: 'Composition assessment not available',
        recommendations: ['Apply the rule of thirds or golden ratio for better composition']
      },
      visualHierarchy: {
        score: 70,
        assessment: 'Visual hierarchy assessment not available',
        recommendations: ['Ensure clear distinction between primary and secondary elements']
      },
      accessibility: {
        score: 70,
        assessment: 'Accessibility assessment not available',
        recommendations: ['Ensure sufficient contrast between elements and background']
      },
      technicalQuality: {
        score: 70,
        assessment: 'Technical quality assessment not available',
        recommendations: ['Optimize path data and remove unnecessary elements']
      }
    };
  }
  
  // Transform the design quality score into a more detailed assessment
  return {
    overallScore: designQualityScore.overallAesthetic,
    
    colorHarmony: {
      score: designQualityScore.colorHarmony,
      assessment: getAssessmentText(designQualityScore.colorHarmony, 'color harmony'),
      recommendations: designQualityScore.designSuggestions.filter(s => 
        s.toLowerCase().includes('color') || 
        s.toLowerCase().includes('contrast') || 
        s.toLowerCase().includes('palette')
      )
    },
    
    composition: {
      score: designQualityScore.composition,
      assessment: getAssessmentText(designQualityScore.composition, 'composition'),
      recommendations: designQualityScore.designSuggestions.filter(s => 
        s.toLowerCase().includes('composition') || 
        s.toLowerCase().includes('balance') || 
        s.toLowerCase().includes('layout') ||
        s.toLowerCase().includes('golden ratio')
      )
    },
    
    visualHierarchy: {
      score: designQualityScore.visualWeight,
      assessment: getAssessmentText(designQualityScore.visualWeight, 'visual hierarchy'),
      recommendations: designQualityScore.designSuggestions.filter(s => 
        s.toLowerCase().includes('hierarchy') || 
        s.toLowerCase().includes('weight') || 
        s.toLowerCase().includes('balance') ||
        s.toLowerCase().includes('emphasis')
      )
    },
    
    accessibility: {
      score: Math.round((designQualityScore.colorHarmony + designQualityScore.typography) / 2),
      assessment: getAssessmentText(Math.round((designQualityScore.colorHarmony + designQualityScore.typography) / 2), 'accessibility'),
      recommendations: designQualityScore.designSuggestions.filter(s => 
        s.toLowerCase().includes('contrast') || 
        s.toLowerCase().includes('legibility') || 
        s.toLowerCase().includes('accessibility')
      )
    },
    
    technicalQuality: {
      score: designQualityScore.technicalQuality,
      assessment: getAssessmentText(designQualityScore.technicalQuality, 'technical quality'),
      recommendations: designQualityScore.designSuggestions.filter(s => 
        s.toLowerCase().includes('technical') || 
        s.toLowerCase().includes('optimize') || 
        s.toLowerCase().includes('path')
      )
    }
  };
}

/**
 * Generates a text assessment based on score
 * 
 * @param score - Numeric score (0-100)
 * @param aspect - Design aspect being assessed
 * @returns Text assessment
 */
function getAssessmentText(score: number, aspect: string): string {
  if (score >= 90) {
    return `Excellent ${aspect} that meets professional standards`;
  } else if (score >= 80) {
    return `Very good ${aspect} with minor room for improvement`;
  } else if (score >= 70) {
    return `Good ${aspect} with some opportunities for enhancement`;
  } else if (score >= 60) {
    return `Adequate ${aspect} that could benefit from refinement`;
  } else if (score >= 50) {
    return `Average ${aspect} with several improvement opportunities`;
  } else if (score >= 40) {
    return `Below average ${aspect} that requires attention`;
  } else if (score >= 30) {
    return `Poor ${aspect} needing significant improvement`;
  } else {
    return `Critical issues with ${aspect} requiring immediate attention`;
  }
}

/**
 * Finds all elements of a specific type in the SVG
 * 
 * @param elements - Array of elements to search
 * @param type - Element type to find
 * @returns Array of matching elements
 */
function findElementsByType(elements: LogoElement[], type: string): LogoElement[] {
  const result: LogoElement[] = [];
  
  // Recursive function to search the element tree
  function search(elems: LogoElement[]) {
    for (const elem of elems) {
      if (elem.type === type) {
        result.push(elem);
      }
      
      // Search children if present
      if (elem.children?.length) {
        search(elem.children);
      }
    }
  }
  
  search(elements);
  return result;
}

/**
 * Gets all elements in the SVG (flattened)
 * 
 * @param elements - Root elements array
 * @returns Flattened array of all elements
 */
function getAllElements(elements: LogoElement[]): LogoElement[] {
  const result: LogoElement[] = [];
  
  // Recursive function to flatten the element tree
  function flatten(elems: LogoElement[]) {
    for (const elem of elems) {
      result.push(elem);
      
      // Flatten children if present
      if (elem.children?.length) {
        flatten(elem.children);
      }
    }
  }
  
  flatten(elements);
  return result;
}

/**
 * Updates SVG colors based on the LogoColors object
 * 
 * @param svg - The SVG logo to update
 * @param colors - Updated color palette
 */
function updateSVGColors(svg: SVGLogo, colors: LogoColors): void {
  // Update the colors object
  svg.colors = colors;
  
  // Update SVG elements with new colors
  // This is a simplified version - a complete implementation would need to
  // map colors to specific elements while maintaining design intent
  
  // Find elements with the original primary color
  const allElements = getAllElements(svg.elements);
  const originalPrimary = svg.colors.primary;
  
  // Update element colors
  for (const element of allElements) {
    // Update fill attribute if it matches the original primary
    if (element.attributes.fill === originalPrimary) {
      element.attributes.fill = colors.primary;
    }
    
    // Update stroke attribute if it matches the original primary
    if (element.attributes.stroke === originalPrimary) {
      element.attributes.stroke = colors.primary;
    }
    
    // Similar updates would be needed for secondary, tertiary, and accent colors
  }
}

/**
 * Calculates the contrast ratio between two colors
 * 
 * @param color1 - First color (RGB)
 * @param color2 - Second color (RGB)
 * @returns Contrast ratio (1-21)
 */
function calculateContrastRatio(color1: RGBColor, color2: RGBColor): number {
  // Calculate relative luminance
  const l1 = calculateRelativeLuminance(color1);
  const l2 = calculateRelativeLuminance(color2);
  
  // Determine lighter and darker luminance
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  // Calculate contrast ratio
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculates the relative luminance of a color
 * 
 * @param color - Color in RGB format
 * @returns Relative luminance
 */
function calculateRelativeLuminance(color: RGBColor): number {
  // Convert RGB to linear values
  const r = convertToLinear(color.r / 255);
  const g = convertToLinear(color.g / 255);
  const b = convertToLinear(color.b / 255);
  
  // Calculate luminance using WCAG formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Converts an RGB component to its linear value
 * 
 * @param component - RGB component (0-1)
 * @returns Linear value
 */
function convertToLinear(component: number): number {
  return component <= 0.03928
    ? component / 12.92
    : Math.pow((component + 0.055) / 1.055, 2.4);
}

/**
 * Converts HEX color to HSL
 * 
 * @param hex - HEX color string
 * @returns HSL color object
 */
function hexToHSL(hex: string): HSLColor {
  // Default HSL
  const defaultHSL: HSLColor = { h: 0, s: 0, l: 0 };
  
  // Handle invalid hex
  if (!hex || typeof hex !== 'string') {
    return defaultHSL;
  }
  
  // Normalize hex
  hex = hex.toLowerCase().trim();
  
  // Handle shorthand hex (#rgb)
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  
  // Handle invalid hex format
  if (hex.length !== 7 || !hex.startsWith('#')) {
    return defaultHSL;
  }
  
  // Convert to RGB
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  
  // Find min and max RGB components
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // Calculate HSL values
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  
  // Convert to standard HSL ranges
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return { h, s, l };
}

/**
 * Converts HSL color to HEX
 * 
 * @param hsl - HSL color object
 * @returns HEX color string
 */
function hslToHex(hsl: HSLColor): string {
  const { h, s, l } = hsl;
  
  // Convert to [0,1] range
  const normalizedS = s / 100;
  const normalizedL = l / 100;
  
  const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normalizedL - c / 2;
  
  let r = 0;
  let g = 0;
  let b = 0;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  // Convert to 0-255 range
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);
  
  // Convert to hex
  const redHex = red.toString(16).padStart(2, '0');
  const greenHex = green.toString(16).padStart(2, '0');
  const blueHex = blue.toString(16).padStart(2, '0');
  
  return `#${redHex}${greenHex}${blueHex}`;
}

/**
 * Converts HEX color to RGB
 * 
 * @param hex - HEX color string
 * @returns RGB color object
 */
function hexToRGB(hex: string): RGBColor {
  // Default RGB
  const defaultRGB: RGBColor = { r: 0, g: 0, b: 0 };
  
  // Handle invalid hex
  if (!hex || typeof hex !== 'string') {
    return defaultRGB;
  }
  
  // Normalize hex
  hex = hex.toLowerCase().trim();
  
  // Handle shorthand hex (#rgb)
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  
  // Handle invalid hex format
  if (hex.length !== 7 || !hex.startsWith('#')) {
    return defaultRGB;
  }
  
  // Convert to RGB
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16)
  };
}

/**
 * Converts HSL color to RGB
 * 
 * @param hsl - HSL color object
 * @returns RGB color object
 */
function hslToRGB(hsl: HSLColor): RGBColor {
  const { h, s, l } = hsl;
  
  // Convert to [0,1] range
  const normalizedS = s / 100;
  const normalizedL = l / 100;
  
  const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normalizedL - c / 2;
  
  let r = 0;
  let g = 0;
  let b = 0;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  // Convert to 0-255 range
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Converts RGB color to HSL
 * 
 * @param rgb - RGB color object
 * @returns HSL color object
 */
function rgbToHSL(rgb: RGBColor): HSLColor {
  // Normalize RGB to [0,1]
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  // Find min and max RGB components
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // Calculate HSL values
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  
  // Convert to standard HSL ranges
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return { h, s, l };
}

/**
 * Exports all utility functions and types
 */
export {
  // Color utilities
  hexToHSL,
  hslToHex,
  hexToRGB,
  hslToRGB,
  rgbToHSL,
  calculateContrastRatio,
  
  // Design principle functions
  applyGoldenRatioPrinciples,
  enhanceColorPalette,
  enhanceAccessibility,
  enhanceVisualHierarchy,
  optimizePaths,
  applyCulturalDesignAdaptations,
  applyIndustrySpecificEnhancements,
  assessDesignQuality,
  
  // Constants
  GOLDEN_RATIO,
  MIN_CONTRAST_RATIO
};