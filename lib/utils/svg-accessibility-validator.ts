/**
 * SVG Accessibility Validator
 * 
 * This module extends the base SVG validator with comprehensive accessibility validation,
 * focusing on issues like color contrast, readability at small sizes, text alternatives,
 * and screen reader compatibility.
 */

import { SVGValidator, SVGValidationResult } from './svg-validator';
import { SVGDesignValidator } from './svg-design-validator';

export interface SVGAccessibilityScore {
  colorContrast: number;       // 0-100 score for color contrast (WCAG compliance)
  textAlternatives: number;    // 0-100 score for text alternatives (title, desc, aria-label)
  semanticStructure: number;   // 0-100 score for semantic structure
  scalability: number;         // 0-100 score for readability at small sizes
  interactiveElements: number; // 0-100 score for accessible interactive elements
  overallAccessibility: number; // Weighted average of above scores
  accessibilitySuggestions: string[]; // Specific suggestions for improvement
}

export interface SVGAccessibilityValidationResult extends SVGValidationResult {
  accessibilityAssessment?: SVGAccessibilityScore;
}

/**
 * SVG Accessibility Validator Class
 * 
 * Extends the SVG Validator with comprehensive accessibility assessment
 */
export class SVGAccessibilityValidator extends SVGValidator {
  
  /**
   * Analyzes an SVG for accessibility in addition to standard validation
   * 
   * @param svgContent - The SVG content to validate and assess
   * @returns Validation result with accessibility assessment
   */
  static validateAccessibility(svgContent: string): SVGAccessibilityValidationResult {
    // First, perform standard validation
    const baseValidation = SVGValidator.validate(svgContent);
    
    // If the SVG isn't valid, don't bother with accessibility assessment
    if (!baseValidation.isValid) {
      return {
        ...baseValidation,
        accessibilityAssessment: {
          colorContrast: 0,
          textAlternatives: 0,
          semanticStructure: 0,
          scalability: 0,
          interactiveElements: 0,
          overallAccessibility: 0,
          accessibilitySuggestions: ['Fix validation errors before assessing accessibility']
        }
      };
    }
    
    // Perform accessibility assessment
    const accessibilityScore = this.assessAccessibility(svgContent);
    
    return {
      ...baseValidation,
      accessibilityAssessment: accessibilityScore
    };
  }
  
  /**
   * Process an SVG for both technical validation and accessibility assessment
   * 
   * @param svgContent - The SVG content to process
   * @param options - Processing options
   * @returns Processed SVG with validation, repair, optimization, and accessibility results
   */
  static processWithAccessibilityAssessment(svgContent: string, options: {
    repair?: boolean;
    optimize?: boolean;
    assessAccessibility?: boolean;
  } = {}): {
    svg: string;
    validation: SVGValidationResult;
    accessibilityAssessment?: SVGAccessibilityScore;
    repair?: unknown;
    optimization?: unknown;
    success: boolean;
  } {
    const { repair = true, optimize = true, assessAccessibility = true } = options;
    
    // Process SVG with standard validation, repair, and optimization
    const processResult = this.process(svgContent, { repair, optimize });
    
    // If accessibility assessment is requested, add it to the result
    if (assessAccessibility) {
      const accessibilityScore = this.assessAccessibility(processResult.svg ?? processResult.processed ?? '');
      return {
        svg: processResult.processed ?? '',
        validation: processResult.validation,
        accessibilityAssessment: accessibilityScore,
        repair: processResult.repair,
        optimization: processResult.optimization,
        success: processResult.success
      };
    }
    return {
      svg: processResult.processed ?? '',
      validation: processResult.validation,
      repair: processResult.repair,
      optimization: processResult.optimization,
      success: processResult.success
    };
  }
  
  /**
   * Process an SVG for both design quality and accessibility assessment
   * 
   * @param svgContent - The SVG content to process
   * @param options - Processing options
   * @returns Processed SVG with validation, design quality, and accessibility results
   */
  static processWithDesignAndAccessibility(svgContent: string, options: {
    repair?: boolean;
    optimize?: boolean;
    assessDesign?: boolean;
    assessAccessibility?: boolean;
  } = {}): {
    svg: string;
    validation: SVGValidationResult;
    designQuality?: unknown;
    accessibilityAssessment?: SVGAccessibilityScore;
    repair?: unknown;
    optimization?: unknown;
    success: boolean;
  } {
    const { 
      repair = true, 
      optimize = true, 
      assessDesign = true,
      assessAccessibility = true 
    } = options;
    
    // First, process with design assessment
    const designResult = SVGDesignValidator.processWithDesignAssessment(svgContent, {
      repair,
      optimize,
      assessDesign
    });
    
    // If accessibility assessment is not requested, return the design result
    if (!assessAccessibility) {
      return designResult;
    }
    
    // Add accessibility assessment
    const accessibilityScore = this.assessAccessibility(designResult.svg);
    
    return {
      ...designResult,
      accessibilityAssessment: accessibilityScore
    };
  }
  
  /**
   * Assess the accessibility of an SVG
   * 
   * @param svgContent - The SVG content to assess
   * @returns Accessibility assessment scores
   */
  private static assessAccessibility(svgContent: string): SVGAccessibilityScore {
    // Calculate scores for each accessibility aspect
    const colorContrastScore = this.assessColorContrast(svgContent);
    const textAlternativesScore = this.assessTextAlternatives(svgContent);
    const semanticStructureScore = this.assessSemanticStructure(svgContent);
    const scalabilityScore = this.assessScalability(svgContent);
    const interactiveElementsScore = this.assessInteractiveElements(svgContent);
    
    // Generate accessibility improvement suggestions
    const accessibilitySuggestions = this.generateAccessibilitySuggestions(
      colorContrastScore,
      textAlternativesScore,
      semanticStructureScore,
      scalabilityScore,
      interactiveElementsScore,
      svgContent
    );
    
    // Calculate overall accessibility score (weighted average)
    const weights = {
      colorContrast: 0.30,
      textAlternatives: 0.25,
      semanticStructure: 0.15,
      scalability: 0.20,
      interactiveElements: 0.10
    };
    
    const overallAccessibility = Math.round(
      (colorContrastScore * weights.colorContrast) +
      (textAlternativesScore * weights.textAlternatives) +
      (semanticStructureScore * weights.semanticStructure) +
      (scalabilityScore * weights.scalability) +
      (interactiveElementsScore * weights.interactiveElements)
    );
    
    return {
      colorContrast: colorContrastScore,
      textAlternatives: textAlternativesScore,
      semanticStructure: semanticStructureScore,
      scalability: scalabilityScore,
      interactiveElements: interactiveElementsScore,
      overallAccessibility,
      accessibilitySuggestions
    };
  }
  
  /**
   * Assess color contrast for WCAG compliance
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for color contrast
   */
  private static assessColorContrast(svgContent: string): number {
    let score = 60; // Start with a moderate score
    
    // Extract colors from the SVG
    const colors = this.extractColors(svgContent);
    
    // If there's only one color or no colors, it's likely monochrome or doesn't have enough elements to assess
    if (colors.length <= 1) {
      return 80; // Monochrome is generally decent for contrast
    }
    
    // Check for text elements to determine if we need to assess text/background contrast
    const hasText = /<text[^>]*>/i.test(svgContent);
    
    if (hasText) {
      // Extract potential text colors and background colors
      const textColors: string[] = [];
      const backgroundColors: string[] = [];
      
      // Extract text fill colors
      const textFillMatches = svgContent.match(/<text[^>]*fill\s*=\s*["']([^"']*)["'][^>]*>/gi) || [];
      textFillMatches.forEach(match => {
        const colorMatch = match.match(/fill\s*=\s*["']([^"']*)["']/i);
        if (colorMatch && colorMatch[1]) {
          textColors.push(colorMatch[1].toLowerCase());
        }
      });
      
      // If no explicit text fill is defined, black is implied
      if (textColors.length === 0) {
        textColors.push('#000000');
      }
      
      // Extract potential background colors from rects and paths
      const rectFillMatches = svgContent.match(/<rect[^>]*fill\s*=\s*["']([^"']*)["'][^>]*>/gi) || [];
      rectFillMatches.forEach(match => {
        const colorMatch = match.match(/fill\s*=\s*["']([^"']*)["']/i);
        if (colorMatch && colorMatch[1] && colorMatch[1].toLowerCase() !== 'none') {
          backgroundColors.push(colorMatch[1].toLowerCase());
        }
      });
      
      // If no background colors found, assume white or transparent
      if (backgroundColors.length === 0) {
        backgroundColors.push('#ffffff');
      }
      
      // Calculate contrast ratios between text and background colors
      let maxContrastRatio = 0;
      for (const textColor of textColors) {
        for (const bgColor of backgroundColors) {
          const textLuminance = this.calculateLuminance(textColor);
          const bgLuminance = this.calculateLuminance(bgColor);
          
          // WCAG contrast formula
          const contrastRatio = textLuminance > bgLuminance
            ? (textLuminance + 0.05) / (bgLuminance + 0.05)
            : (bgLuminance + 0.05) / (textLuminance + 0.05);
          
          maxContrastRatio = Math.max(maxContrastRatio, contrastRatio);
        }
      }
      
      // Score based on WCAG 2.1 guidelines
      if (maxContrastRatio >= 7) {
        score = 100; // AAA level for normal text
      } else if (maxContrastRatio >= 4.5) {
        score = 80; // AA level for normal text
      } else if (maxContrastRatio >= 3) {
        score = 60; // AA level for large text
      } else {
        score = 30; // Below AA level
      }
    } else {
      // No text elements, so assess color contrast between adjacent elements
      // This is a simplified approach - a more accurate one would analyze the SVG structure
      
      // Sort colors by luminance
      const luminances = colors.map(color => this.calculateLuminance(color));
      luminances.sort((a, b) => a - b);
      
      // Check contrast between adjacent colors in sorted array
      let lowestContrastRatio = Infinity;
      for (let i = 0; i < luminances.length - 1; i++) {
        // For contrastRatio and highestContrastRatio calculations
        let contrastRatio = 0;
        if (luminances && luminances[i + 1] !== undefined && luminances[i] !== undefined) {
          contrastRatio = (luminances[i + 1] + 0.05) / (luminances[i] + 0.05);
        }
        lowestContrastRatio = Math.min(lowestContrastRatio, contrastRatio);
      }
      
      // Check contrast between lightest and darkest colors
      let highestContrastRatio = 0;
      if (luminances && luminances.length > 0) {
        highestContrastRatio = (luminances[luminances.length - 1] + 0.05) / (luminances[0] + 0.05);
      }
      
      // Score based on highest contrast available
      if (highestContrastRatio >= 7) {
        score = 90; // Excellent contrast available
      } else if (highestContrastRatio >= 4.5) {
        score = 75; // Good contrast available
      } else if (highestContrastRatio >= 3) {
        score = 60; // Minimal acceptable contrast
      } else {
        score = 40; // Poor contrast
      }
      
      // Adjust score based on whether adjacent elements have sufficient contrast
      if (lowestContrastRatio < 1.5 && colors.length > 2) {
        score -= 15; // Penalize for low contrast between adjacent elements
      }
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Extract colors from SVG content
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Array of colors used in the SVG
   */
  private static extractColors(svgContent: string): string[] {
    const colors: Set<string> = new Set();
    
    // Extract hex colors
    const hexColorRegex = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
    const hexMatches = svgContent.match(hexColorRegex) || [];
    hexMatches.forEach(color => colors.add(color.toLowerCase()));
    
    // Extract rgb/rgba colors
    const rgbColorRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi;
    const rgbaColorRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi;
    
    const rgbMatches = svgContent.match(rgbColorRegex) || [];
    const rgbaMatches = svgContent.match(rgbaColorRegex) || [];
    
    [...rgbMatches, ...rgbaMatches].forEach(color => colors.add(color.toLowerCase()));
    
    // Extract named colors
    const namedColorRegex = /(?:fill|stroke|stop-color|color)\s*=\s*["'](aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)["']/gi;
    
    const namedMatches = svgContent.match(namedColorRegex) || [];
    namedMatches.forEach(match => {
      const colorMatch = match.match(/["']([a-z]+)["']/i);
      if (colorMatch && colorMatch[1]) {
        colors.add(colorMatch[1].toLowerCase());
      }
    });
    
    return Array.from(colors);
  }
  
  /**
   * Calculate relative luminance of a color
   * 
   * @param color - Color to calculate luminance for
   * @returns Relative luminance value
   */
  private static calculateLuminance(color: string): number {
    let r = 0, g = 0, b = 0;
    
    // Handle hex colors
    if (color.startsWith('#')) {
      if (color.length === 4) {
        // #RGB format
        if (color && color[1] && color[2] && color[3]) {
          r = parseInt(color[1] + color[1], 16) / 255;
          g = parseInt(color[2] + color[2], 16) / 255;
          b = parseInt(color[3] + color[3], 16) / 255;
        }
      } else if (color.length === 7) {
        // #RRGGBB format
        r = parseInt(color.substring(1, 3), 16) / 255;
        g = parseInt(color.substring(3, 5), 16) / 255;
        b = parseInt(color.substring(5, 7), 16) / 255;
      }
    }
    // Handle rgb/rgba colors
    else if (color.startsWith('rgb')) {
      const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (match && match[1] && match[2] && match[3]) {
        r = parseInt(match[1], 10) / 255;
        g = parseInt(match[2], 10) / 255;
        b = parseInt(match[3], 10) / 255;
      }
    }
    // Handle named colors with a simplified mapping
    else {
      const namedColorMap: Record<string, [number, number, number]> = {
        'black': [0, 0, 0],
        'white': [255, 255, 255],
        'red': [255, 0, 0],
        'green': [0, 128, 0],
        'blue': [0, 0, 255],
        'yellow': [255, 255, 0],
        'cyan': [0, 255, 255],
        'magenta': [255, 0, 255],
        'gray': [128, 128, 128],
        'grey': [128, 128, 128],
        'silver': [192, 192, 192],
        'maroon': [128, 0, 0],
        'purple': [128, 0, 128],
        'fuchsia': [255, 0, 255],
        'lime': [0, 255, 0],
        'olive': [128, 128, 0],
        'navy': [0, 0, 128],
        'teal': [0, 128, 128],
        'aqua': [0, 255, 255]
      };
      
      const rgb = namedColorMap[color.toLowerCase()];
      if (rgb) {
        r = rgb[0] / 255;
        g = rgb[1] / 255;
        b = rgb[2] / 255;
      }
    }
    
    // Apply sRGB gamma correction
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    // Calculate luminance using the WCAG formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  /**
   * Assess text alternatives (title, desc, aria-label)
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for text alternatives
   */
  private static assessTextAlternatives(svgContent: string): number {
    let score = 0;
    
    // Check for title element
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(svgContent);
    
    // Check for desc element
    const hasDesc = /<desc[^>]*>([^<]+)<\/desc>/i.test(svgContent);
    
    // Check for aria-label attribute on SVG
    const hasAriaLabel = /<svg[^>]*aria-label\s*=\s*["'][^"']*["']/i.test(svgContent);
    
    // Check for role attribute on SVG
    const hasRole = /<svg[^>]*role\s*=\s*["'][^"']*["']/i.test(svgContent);
    
    // Base score on which accessibility attributes are present
    if (hasTitle) score += 30;
    if (hasDesc) score += 30;
    if (hasAriaLabel) score += 20;
    if (hasRole) score += 20;
    
    // Check content of title/desc if present
    if (hasTitle) {
      const titleMatch = svgContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const titleContent = titleMatch[1].trim();
        if (titleContent.length < 3) {
          score -= 15; // Penalize for extremely short title
        } else if (titleContent.length > 60) {
          score -= 5; // Slight penalty for overly long title
        }
      }
    }
    
    if (hasDesc) {
      const descMatch = svgContent.match(/<desc[^>]*>([^<]+)<\/desc>/i);
      if (descMatch && descMatch[1]) {
        const descContent = descMatch[1].trim();
        if (descContent.length < 10) {
          score -= 10; // Penalize for extremely short description
        }
      }
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Assess semantic structure (grouping, hierarchy, role attributes)
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for semantic structure
   */
  private static assessSemanticStructure(svgContent: string): number {
    let score = 50; // Start with a neutral score
    
    // Check for use of semantic groups with appropriate attributes
    const groupMatches = svgContent.match(/<g[^>]*>/gi) || [];
    const groupsWithLabels = svgContent.match(/<g[^>]*aria-label\s*=\s*["'][^"']*["'][^>]*>/gi) || [];
    const groupsWithRoles = svgContent.match(/<g[^>]*role\s*=\s*["'][^"']*["'][^>]*>/gi) || [];
    
    // Calculate percentage of labeled groups
    if (groupMatches.length > 0) {
      const labeledGroupPercentage = (groupsWithLabels.length / groupMatches.length) * 100;
      if (labeledGroupPercentage >= 80) {
        score += 25; // Excellent group labeling
      } else if (labeledGroupPercentage >= 50) {
        score += 15; // Good group labeling
      } else if (labeledGroupPercentage > 0) {
        score += 5; // Some group labeling
      }
      
      // Calculate percentage of groups with roles
      const roledGroupPercentage = (groupsWithRoles.length / groupMatches.length) * 100;
      if (roledGroupPercentage >= 50) {
        score += 20; // Good use of roles
      } else if (roledGroupPercentage > 0) {
        score += 10; // Some use of roles
      }
    } else {
      // No groups - this might be a simple SVG
      const elementCount = (svgContent.match(/<(path|rect|circle|ellipse|line|polyline|polygon|text)[^>]*>/gi) || []).length;
      
      if (elementCount <= 3) {
        score += 10; // Simple SVG may not need complex grouping
      } else {
        score -= 15; // Complex SVG should use groups for structure
      }
    }
    
    // Check for SVG root level accessibility attributes
    if (/<svg[^>]*aria-labelledby\s*=\s*["'][^"']*["']/i.test(svgContent)) {
      score += 15;
    }
    
    if (/<svg[^>]*role\s*=\s*["']img["']/i.test(svgContent)) {
      score += 10;
    }
    
    // Penalize for excessive nesting which can make screen reader output confusing
    const maxNestingLevel = this.getMaxNestingLevel(svgContent);
    if (maxNestingLevel > 10) {
      score -= 20; // Severe penalty for excessive nesting
    } else if (maxNestingLevel > 7) {
      score -= 10; // Moderate penalty for deep nesting
    } else if (maxNestingLevel > 5) {
      score -= 5; // Small penalty for somewhat deep nesting
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Get the maximum nesting level in an SVG
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Maximum nesting level
   */
  private static getMaxNestingLevel(svgContent: string): number {
    let maxLevel = 0;
    let currentLevel = 0;
    
    // Simple tokenizer
    for (let i = 0; i < svgContent.length; i++) {
      if (svgContent[i] === '<' && svgContent[i+1] !== '/' && svgContent[i+1] !== '!') {
        // Opening tag
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (svgContent[i] === '<' && svgContent[i+1] === '/') {
        // Closing tag
        currentLevel--;
      }
    }
    
    return maxLevel;
  }
  
  /**
   * Assess scalability and readability at small sizes
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for scalability
   */
  private static assessScalability(svgContent: string): number {
    let score = 70; // Start with a default score
    
    // Check for viewBox attribute (crucial for scalability)
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']*)["']/i);
    if (!viewBoxMatch) {
      score -= 50; // Severe penalty for missing viewBox
    }
    
    // Check for preserveAspectRatio attribute
    if (/<svg[^>]*preserveAspectRatio\s*=\s*["'][^"']*["']/i.test(svgContent)) {
      score += 10; // Bonus for proper aspect ratio handling
    }
    
    // Check for text elements
    const textElements = svgContent.match(/<text[^>]*>.*?<\/text>/gis) || [];
    
    if (textElements.length > 0) {
      // Check for font size
      let tooSmallFontDetected = false;
      let tooLargeFontDetected = false;
      
      for (const textElement of textElements) {
        const fontSizeMatch = textElement.match(/font-size\s*=\s*["']([^"']*)["']/i);
        if (fontSizeMatch && fontSizeMatch[1]) {
          const fontSize = parseFloat(fontSizeMatch[1]);
          
          // Check if font size is absolute and too small
          if (!isNaN(fontSize)) {
            if (fontSize < 10 && !fontSizeMatch[1].includes('%') && !fontSizeMatch[1].includes('em')) {
              tooSmallFontDetected = true;
            } else if (fontSize > 50 && !fontSizeMatch[1].includes('%') && !fontSizeMatch[1].includes('em')) {
              tooLargeFontDetected = true;
            }
          }
        }
      }
      
      if (tooSmallFontDetected) {
        score -= 25; // Penalty for fonts that will be too small at reduced sizes
      }
      
      if (tooLargeFontDetected) {
        score -= 10; // Penalty for fonts that might be too large
      }
      
      // Check if font sizes are relative
      const relativeFontSizes = svgContent.match(/font-size\s*=\s*["'][^"']*(?:em|%|rem)["']/gi) || [];
      if (relativeFontSizes.length > 0 && relativeFontSizes.length === textElements.length) {
        score += 15; // Bonus for all relative font sizes
      } else if (relativeFontSizes.length > 0) {
        score += 5; // Bonus for some relative font sizes
      }
    }
    
    // Check for thin strokes that may disappear at small sizes
    const thinStrokes = svgContent.match(/stroke-width\s*=\s*["'](0\.\d+|0|1)["']/gi) || [];
    if (thinStrokes.length > 0) {
      score -= 15; // Penalty for thin strokes
    }
    
    // Check for tiny shapes that may disappear at small sizes
    const tinyShapes = svgContent.match(/(?:width|height|r)\s*=\s*["'](0\.\d+|[1-3])["']/gi) || [];
    if (tinyShapes.length > 0) {
      score -= 15; // Penalty for tiny shapes
    }
    
    // Check for complexity that may render poorly at small sizes
    const complexity = this.assessComplexity(svgContent);
    if (complexity === 'high') {
      score -= 20; // Penalty for high complexity
    } else if (complexity === 'medium') {
      score -= 10; // Penalty for medium complexity
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Assess the complexity of an SVG for scalability purposes
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Complexity assessment (low, medium, high)
   */
  private static assessComplexity(svgContent: string): 'low' | 'medium' | 'high' {
    // Count the number of elements
    const elementCount = (svgContent.match(/<(?:path|rect|circle|ellipse|line|polyline|polygon|text)[^>]*>/gi) || []).length;
    
    // Check for complex path data
    const pathMatches = svgContent.match(/<path[^>]*d\s*=\s*["']([^"']*)["']/gi) || [];
    let complexPathCount = 0;
    
    for (const pathMatch of pathMatches) {
      const dAttrMatch = pathMatch.match(/d\s*=\s*["']([^"']*)["']/i);
      if (dAttrMatch && dAttrMatch[1]) {
        const pathData = dAttrMatch[1];
        
        // Count path commands as a rough measure of complexity
        const commandCount = (pathData.match(/[MLHVCSQTAZ]/gi) || []).length;
        
        if (commandCount > 30) {
          complexPathCount++;
        }
      }
    }
    
    // Determine complexity level
    if (elementCount > 50 || complexPathCount > 5) {
      return 'high';
    } else if (elementCount > 20 || complexPathCount > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Assess interactive elements for accessibility
   * 
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for interactive elements
   */
  private static assessInteractiveElements(svgContent: string): number {
    // Check if the SVG has interactive elements
    const hasInteractiveElements = 
      /<[^>]*(?:onclick|onmouseover|onmouseout|onload|cursor\s*=\s*["']pointer["'])[^>]*>/i.test(svgContent) ||
      /<a[^>]*>/i.test(svgContent);
    
    // If no interactive elements, return a neutral score
    if (!hasInteractiveElements) {
      return 80; // Neutral score for non-interactive SVGs
    }
    
    let score = 50; // Start with a neutral score for interactive SVGs
    
    // Check for clickable elements
    const clickableElements = svgContent.match(/<[^>]*(?:onclick|cursor\s*=\s*["']pointer["'])[^>]*>/gi) || [];
    const aElements = svgContent.match(/<a[^>]*>/gi) || [];
    
    const allClickableElements = [...clickableElements, ...aElements];
    
    // Count accessible interactive elements
    let accessibleClickableCount = 0;
    
    for (const element of allClickableElements) {
      // Check if element has accessibility attributes
      if (
        /aria-label\s*=\s*["'][^"']*["']/i.test(element) ||
        /role\s*=\s*["'][^"']*["']/i.test(element) ||
        /tabindex\s*=\s*["'][^"']*["']/i.test(element) ||
        /aria-describedby\s*=\s*["'][^"']*["']/i.test(element)
      ) {
        accessibleClickableCount++;
      }
    }
    
    // Calculate percentage of accessible interactive elements
    if (allClickableElements.length > 0) {
      const accessiblePercentage = (accessibleClickableCount / allClickableElements.length) * 100;
      
      if (accessiblePercentage === 100) {
        score += 40; // All interactive elements are accessible
      } else if (accessiblePercentage >= 75) {
        score += 30; // Most interactive elements are accessible
      } else if (accessiblePercentage >= 50) {
        score += 15; // Half of interactive elements are accessible
      } else if (accessiblePercentage > 0) {
        score += 5; // Some interactive elements are accessible
      } else {
        score -= 20; // No interactive elements are accessible
      }
    }
    
    // Check for keyboard accessibility
    const hasTabindex = /<[^>]*tabindex\s*=\s*["'][^"']*["'][^>]*>/i.test(svgContent);
    if (hasTabindex) {
      score += 10; // Bonus for keyboard accessibility
    } else {
      score -= 15; // Penalty for lack of keyboard accessibility
    }
    
    // Check for focus indicators
    const hasFocusStyles = /<style[^>]*>[\s\S]*?:focus[\s\S]*?<\/style>/i.test(svgContent);
    if (hasFocusStyles) {
      score += 10; // Bonus for focus styles
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate accessibility improvement suggestions based on assessment scores
   * 
   * @param colorContrastScore - Score for color contrast
   * @param textAlternativesScore - Score for text alternatives
   * @param semanticStructureScore - Score for semantic structure
   * @param scalabilityScore - Score for scalability
   * @param interactiveElementsScore - Score for interactive elements
   * @param svgContent - The original SVG content
   * @returns Array of accessibility improvement suggestions
   */
  private static generateAccessibilitySuggestions(
    colorContrastScore: number,
    textAlternativesScore: number,
    semanticStructureScore: number,
    scalabilityScore: number,
    interactiveElementsScore: number,
    svgContent: string
  ): string[] {
    const suggestions: string[] = [];
    
    // Color contrast suggestions
    if (colorContrastScore < 70) {
      if (colorContrastScore < 50) {
        suggestions.push('Increase color contrast to meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text)');
      } else {
        suggestions.push('Consider improving color contrast for better accessibility');
      }
    }
    
    // Text alternatives suggestions
    if (textAlternativesScore < 60) {
      if (!/<title[^>]*>[^<]+<\/title>/i.test(svgContent)) {
        suggestions.push('Add a descriptive <title> element for screen readers');
      }
      
      if (!/<desc[^>]*>[^<]+<\/desc>/i.test(svgContent)) {
        suggestions.push('Add a <desc> element to provide additional context');
      }
      
      if (!/<svg[^>]*aria-label\s*=\s*["'][^"']*["']/i.test(svgContent)) {
        suggestions.push('Add an aria-label attribute to the SVG element');
      }
    }
    
    // Semantic structure suggestions
    if (semanticStructureScore < 70) {
      const groupMatches = svgContent.match(/<g[^>]*>/gi) || [];
      const groupsWithLabels = svgContent.match(/<g[^>]*aria-label\s*=\s*["'][^"']*["'][^>]*>/gi) || [];
      
      if (groupMatches.length > 3 && groupsWithLabels.length < groupMatches.length / 2) {
        suggestions.push('Add aria-label attributes to group elements to improve screen reader navigation');
      }
      
      if (!/<svg[^>]*role\s*=\s*["']img["']/i.test(svgContent)) {
        suggestions.push('Add role="img" to the SVG element to ensure proper screen reader interpretation');
      }
    }
    
    // Scalability suggestions
    if (scalabilityScore < 70) {
      if (!/<svg[^>]*viewBox\s*=\s*["'][^"']*["']/i.test(svgContent)) {
        suggestions.push('Add a viewBox attribute to ensure proper scaling at different sizes');
      }
      
      if (/<text[^>]*font-size\s*=\s*["'][0-9.]+(?!em|%|rem)["']/i.test(svgContent)) {
        suggestions.push('Use relative font sizes (em or %) instead of absolute values for better scaling');
      }
      
      if (scalabilityScore < 50) {
        suggestions.push('Simplify complex paths or elements that may become illegible at small sizes');
      }
      
      if (/stroke-width\s*=\s*["'](0\.\d+|0|1)["']/i.test(svgContent)) {
        suggestions.push('Increase thin stroke widths to ensure visibility at small sizes');
      }
    }
    
    // Interactive elements suggestions
    const hasInteractiveElements = 
      /<[^>]*(?:onclick|onmouseover|onmouseout|onload|cursor\s*=\s*["']pointer["'])[^>]*>/i.test(svgContent) ||
      /<a[^>]*>/i.test(svgContent);
    
    if (hasInteractiveElements && interactiveElementsScore < 60) {
      if (!/<[^>]*tabindex\s*=\s*["'][^"']*["'][^>]*>/i.test(svgContent)) {
        suggestions.push('Add tabindex attributes to interactive elements for keyboard accessibility');
      }
      
      if (!/<[^>]*aria-label\s*=\s*["'][^"']*["'][^>]*>/i.test(svgContent)) {
        suggestions.push('Add aria-label to interactive elements to describe their purpose');
      }
      
      if (!/<style[^>]*>[\s\S]*?:focus[\s\S]*?<\/style>/i.test(svgContent)) {
        suggestions.push('Add focus styles to provide visual indication when elements are focused');
      }
    }
    
    // If no specific suggestions were generated, add a general one
    if (suggestions.length === 0) {
      suggestions.push('SVG meets basic accessibility standards. For enhanced accessibility, consider adding more descriptive text alternatives.');
    }
    
    return suggestions;
  }
}