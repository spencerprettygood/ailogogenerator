/**
 * Advanced SVG Design Quality Validator
 *
 * This module extends the base SVG validator with design quality assessment,
 * evaluating aesthetic qualities like color harmony, composition balance,
 * visual weight distribution, typography quality, and negative space utilization.
 */

import { SVGValidator, SVGValidationResult } from './svg-validator';

export interface SVGDesignQualityScore {
  colorHarmony: number; // 0-100 score for color theory implementation
  composition: number; // 0-100 score for layout and balance
  visualWeight: number; // 0-100 score for visual weight distribution
  typography: number; // 0-100 score for typography quality (if present)
  negativeSpace: number; // 0-100 score for use of negative space
  overallAesthetic: number; // Weighted average of above scores
  technicalQuality: number; // Combined score from base validator (security, accessibility, optimization)
  designSuggestions: string[]; // Specific suggestions for improvement
}

export interface SVGDesignValidationResult extends SVGValidationResult {
  designQualityScore?: SVGDesignQualityScore;
}

/**
 * SVG Design Quality Validator Class
 *
 * Extends the base SVG Validator with comprehensive design quality assessment
 */
export class SVGDesignValidator extends SVGValidator {
  /**
   * Analyzes an SVG for design quality in addition to technical validation
   *
   * @param svgContent - The SVG content to validate and assess
   * @returns Validation result with design quality assessment
   */
  static validateDesignQuality(svgContent: string): SVGDesignValidationResult {
    // First, perform standard validation
    const baseValidation = SVGValidator.validate(svgContent);

    // If the SVG isn't valid, don't bother with design assessment
    if (!baseValidation.isValid) {
      return {
        ...baseValidation,
        designQualityScore: {
          colorHarmony: 0,
          composition: 0,
          visualWeight: 0,
          typography: 0,
          negativeSpace: 0,
          overallAesthetic: 0,
          technicalQuality: 0,
          designSuggestions: ['Fix validation errors before assessing design quality'],
        },
      };
    }

    // Perform design quality assessment
    const designQualityScore = this.assessDesignQuality(svgContent);

    // Calculate a technical quality score from base validator scores
    const technicalQuality =
      baseValidation.securityScore &&
      baseValidation.accessibilityScore &&
      baseValidation.optimizationScore
        ? Math.round(
            (baseValidation.securityScore +
              baseValidation.accessibilityScore +
              baseValidation.optimizationScore) /
              3
          )
        : 0;

    // Update the design quality score with the technical quality
    designQualityScore.technicalQuality = technicalQuality;

    return {
      ...baseValidation,
      designQualityScore,
    };
  }

  /**
   * Process an SVG for both technical and design quality assessment
   *
   * @param svgContent - The SVG content to process
   * @param options - Processing options
   * @returns Processed SVG with validation, repair, optimization, and design quality results
   */
  static processWithDesignAssessment(
    svgContent: string,
    options: {
      repair?: boolean;
      optimize?: boolean;
      assessDesign?: boolean;
    } = {}
  ): {
    svg: string;
    validation: SVGValidationResult;
    designQuality?: SVGDesignQualityScore;
    repair?: unknown;
    optimization?: unknown;
    success: boolean;
  } {
    const { repair = true, optimize = true, assessDesign = true } = options;

    // Process SVG with standard validation, repair, and optimization
    const processResult = this.process(svgContent, { repair, optimize });

    // If design assessment is requested, add it to the result
    if (assessDesign) {
      const designQuality = this.assessDesignQuality(processResult.processed ?? '');
      return {
        svg: processResult.processed ?? '',
        validation: processResult.validation,
        designQuality,
        repair: processResult.repair,
        optimization: processResult.optimization,
        success: processResult.success,
      };
    }

    return {
      svg: processResult.processed ?? '',
      validation: processResult.validation,
      repair: processResult.repair,
      optimization: processResult.optimization,
      success: processResult.success,
    };
  }

  /**
   * Assess the design quality of an SVG
   *
   * @param svgContent - The SVG content to assess
   * @returns Design quality assessment scores
   */
  private static assessDesignQuality(svgContent: string): SVGDesignQualityScore {
    // Extract colors from SVG
    const colors = this.extractColors(svgContent);

    // Calculate scores for each design aspect
    const colorHarmonyScore = this.assessColorHarmony(colors);
    const compositionScore = this.assessComposition(svgContent);
    const visualWeightScore = this.assessVisualWeight(svgContent);
    const typographyScore = this.assessTypography(svgContent);
    const negativeSpaceScore = this.assessNegativeSpace(svgContent);

    // Generate design improvement suggestions
    const designSuggestions = this.generateDesignSuggestions(
      colorHarmonyScore,
      compositionScore,
      visualWeightScore,
      typographyScore,
      negativeSpaceScore,
      svgContent
    );

    // Calculate overall aesthetic score (weighted average)
    const weights = {
      colorHarmony: 0.25,
      composition: 0.25,
      visualWeight: 0.2,
      typography: 0.15,
      negativeSpace: 0.15,
    };

    const overallAesthetic = Math.round(
      colorHarmonyScore * weights.colorHarmony +
        compositionScore * weights.composition +
        visualWeightScore * weights.visualWeight +
        typographyScore * weights.typography +
        negativeSpaceScore * weights.negativeSpace
    );

    return {
      colorHarmony: colorHarmonyScore,
      composition: compositionScore,
      visualWeight: visualWeightScore,
      typography: typographyScore,
      negativeSpace: negativeSpaceScore,
      overallAesthetic,
      technicalQuality: 0, // Will be set by the calling method
      designSuggestions,
    };
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
    const namedColorRegex =
      /(?:fill|stroke|stop-color|color)\s*=\s*["'](aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)["']/gi;

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
   * Assess color harmony based on color theory principles
   *
   * @param colors - Array of colors used in the SVG
   * @returns Score from 0-100 for color harmony
   */
  private static assessColorHarmony(colors: string[]): number {
    let score = 100;

    // Base score on number of colors (too many reduces harmony)
    if (colors.length > 5) {
      score -= (colors.length - 5) * 5; // -5 points for each color over 5
    }

    // Check for color harmony using RGB distance
    if (colors.length >= 2) {
      const harmonies = this.detectColorHarmonies(colors);

      if (harmonies.monochromatic) {
        // Good for clean, minimalist designs
        score += 10;
      } else if (harmonies.analogous) {
        // Good for natural, harmonious feels
        score += 15;
      } else if (harmonies.complementary) {
        // Good for contrast and pop
        score += 10;
      } else if (harmonies.triadic || harmonies.tetradic) {
        // Can be vibrant and balanced if done well
        score += 5;
      } else {
        // No clear harmony detected
        score -= 20;
      }
    }

    // Check for sufficient contrast
    const contrastScore = this.assessColorContrast(colors);
    score += contrastScore;

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect color harmonies in a set of colors
   *
   * @param colors - Array of colors to analyze
   * @returns Object indicating which harmonies are present
   */
  private static detectColorHarmonies(colors: string[]): {
    monochromatic: boolean;
    analogous: boolean;
    complementary: boolean;
    triadic: boolean;
    tetradic: boolean;
  } {
    // Convert colors to HSL for easier harmony detection
    const hslColors = colors.map(color => this.convertColorToHSL(color));

    // Sort by hue for easier analysis
    hslColors.sort((a, b) => a.h - b.h);

    // Check for monochromatic (same hue, different saturation/lightness)
    const hueDifferences = hslColors.map(color => color.h);
    const uniqueHues = new Set(hueDifferences.map(h => Math.round(h / 10) * 10)); // Round to nearest 10
    const isMonochromatic = uniqueHues.size <= 1;

    // Check for analogous (adjacent hues)
    let isAnalogous = false;
    if (hslColors.length >= 2 && hslColors.length <= 5) {
      const hueRange = Math.max(...hueDifferences) - Math.min(...hueDifferences);
      isAnalogous = hueRange <= 60 || (hueRange >= 300 && hueRange <= 360); // Adjacent on color wheel
    }

    // Check for complementary (opposite hues)
    let isComplementary = false;
    if (hslColors.length >= 2) {
      for (let i = 0; i < hslColors.length; i++) {
        for (let j = i + 1; j < hslColors.length; j++) {
          const colorI = hslColors[i];
          const colorJ = hslColors[j];
          if (colorI && colorJ) {
            const hueDiff = Math.abs(colorI.h - colorJ.h);
            if (Math.abs(hueDiff - 180) <= 20 || Math.abs(hueDiff - 540) <= 20) {
              isComplementary = true;
              break;
            }
          }
        }
        if (isComplementary) break;
      }
    }

    // Check for triadic (three colors evenly spaced)
    let isTriadic = false;
    if (hslColors.length >= 3) {
      const hues = hslColors.map(color => color.h);
      for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
          for (let k = j + 1; k < hues.length; k++) {
            const hueI = hues[i];
            const hueJ = hues[j];
            const hueK = hues[k];
            if (hueI !== undefined && hueJ !== undefined && hueK !== undefined) {
              const diff1 = Math.abs((hueJ - hueI + 360) % 360);
              const diff2 = Math.abs((hueK - hueJ + 360) % 360);

              if (Math.abs(diff1 - 120) <= 20 && Math.abs(diff2 - 120) <= 20) {
                isTriadic = true;
                break;
              }
            }
          }
          if (isTriadic) break;
        }
        if (isTriadic) break;
      }
    }

    // Check for tetradic (four colors forming a rectangle on the color wheel)
    let isTetradic = false;
    if (hslColors.length >= 4) {
      // Simplified check - just look for two complementary pairs
      let complementaryPairs = 0;
      const hues = hslColors.map(color => color.h);

      for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
          const hueI = hues[i];
          const hueJ = hues[j];
          if (hueI !== undefined && hueJ !== undefined) {
            const hueDiff = Math.abs(hueI - hueJ);
            if (Math.abs(hueDiff - 180) <= 20 || Math.abs(hueDiff - 540) <= 20) {
              complementaryPairs++;
            }
          }
        }
      }

      isTetradic = complementaryPairs >= 2;
    }

    return {
      monochromatic: isMonochromatic,
      analogous: isAnalogous,
      complementary: isComplementary,
      triadic: isTriadic,
      tetradic: isTetradic,
    };
  }

  /**
   * Convert a color string to HSL format
   *
   * @param color - Color in hex, rgb, or named format
   * @returns HSL color object
   */
  private static convertColorToHSL(color: string): { h: number; s: number; l: number } {
    // Default HSL values
    let h = 0,
      s = 0,
      l = 0;
    // Always declare r, g, b at the top so they are in scope for the whole function
    let r = 0,
      g = 0,
      b = 0;

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

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;

      // Calculate hue
      if (d === 0) h = 0;
      else if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else if (max === b) h = ((r - g) / d + 4) * 60;

      // Calculate lightness
      l = (max + min) / 2;

      // Calculate saturation
      s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

      // Convert to percentages
      s = s * 100;
      l = l * 100;
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

    // Return HSL object
    return { h, s, l };
  }

  /**
   * Assess color contrast for accessibility
   *
   * @param colors - Array of colors to analyze
   * @returns Score adjustment based on contrast assessment
   */
  private static assessColorContrast(colors: string[]): number {
    // This is a simplified assessment - a real implementation would analyze actual element contrasts
    if (colors.length < 2) return 0;

    // Convert colors to luminance values
    const luminances = colors.map(color => this.calculateLuminance(color));

    // Sort luminances
    luminances.sort((a, b) => a - b);

    if (
      luminances.length < 2 ||
      luminances[0] === undefined ||
      luminances[luminances.length - 1] === undefined
    ) {
      return 0;
    }

    // Check contrast ratio between lightest and darkest colors
    const contrastRatio = (luminances[luminances.length - 1]! + 0.05) / (luminances[0]! + 0.05);

    // WCAG 2.0 guidelines:
    // - 4.5:1 for normal text
    // - 3:1 for large text
    // - 7:1 for enhanced contrast

    if (contrastRatio >= 7) {
      return 15; // Excellent contrast
    } else if (contrastRatio >= 4.5) {
      return 10; // Good contrast for normal text
    } else if (contrastRatio >= 3) {
      return 0; // Minimal acceptable contrast for large text
    } else {
      return -10; // Poor contrast
    }
  }

  /**
   * Calculate relative luminance of a color
   *
   * @param color - Color to calculate luminance for
   * @returns Relative luminance value
   */
  private static calculateLuminance(color: string): number {
    let r = 0,
      g = 0,
      b = 0;

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
        const r_val = parseInt(match[1], 10) / 255;
        const g_val = parseInt(match[2], 10) / 255;
        const b_val = parseInt(match[3], 10) / 255;

        r = r_val;
        g = g_val;
        b = b_val;
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
   * Assess composition based on principles like golden ratio, rule of thirds
   *
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for composition quality
   */
  private static assessComposition(svgContent: string): number {
    let score = 70; // Start with a default score

    // Check for viewBox attribute
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^"']*)['"]/i);
    if (!viewBoxMatch || !viewBoxMatch[1]) {
      score -= 20; // Significant deduction for missing viewBox
    } else {
      const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);

      // Check if viewBox has 4 values
      if (viewBox.length === 4) {
        const [x, y, width, height] = viewBox;

        if (width !== undefined && height !== undefined && height > 0) {
          // Check for golden ratio proportions (approximately 1:1.618)
          const ratio = width / height;
          const goldenRatio = 1.618;

          if (Math.abs(ratio - goldenRatio) < 0.2 || Math.abs(ratio - 1 / goldenRatio) < 0.2) {
            score += 10; // Bonus for golden ratio proportions
          }

          // Check if it's square (good for logos)
          if (Math.abs(ratio - 1) < 0.1) {
            score += 5; // Bonus for square aspect ratio
          }
        }
      }
    }

    // Analyze distribution of elements by checking coordinate ranges in paths
    const pathMatch = svgContent.match(/d\s*=\s*['"]([^"']*)['']/gi);
    if (pathMatch && pathMatch.length > 0) {
      // Simple heuristic - check if paths are well-distributed throughout the viewBox
      const coordinates: number[] = [];

      for (const path of pathMatch) {
        const pathData = path.match(/d\s*=\s*['"]([^"']*)['"]/i);
        if (pathData && pathData[1]) {
          // Extract numbers from path data
          const numbers = pathData[1].match(/-?\d+(?:\.\d+)?/g);
          if (numbers) {
            coordinates.push(...numbers.map(Number));
          }
        }
      }

      if (coordinates.length > 0) {
        // Calculate the range of coordinates
        const min = Math.min(...coordinates);
        const max = Math.max(...coordinates);
        const range = max - min;

        // If coordinates are spread across at least 50% of the available space, consider it well-distributed
        if (viewBoxMatch && viewBoxMatch[1]) {
          const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
          if (viewBox.length === 4) {
            const [, , width, height] = viewBox;
            if (width !== undefined && height !== undefined) {
              const maxDimension = Math.max(width, height);

              if (range > maxDimension * 0.5) {
                score += 10; // Bonus for well-distributed elements
              } else if (range < maxDimension * 0.3) {
                score -= 10; // Deduction for concentrated elements
              }
            }
          }
        }
      }
    }

    // Check for rule of thirds by analyzing positioning of key elements
    // This is a simplified approximation
    if (pathMatch && pathMatch.length > 0 && viewBoxMatch && viewBoxMatch[1]) {
      const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
      if (viewBox.length === 4) {
        const [, , width, height] = viewBox;

        if (width !== undefined && height !== undefined) {
          // Define rule of thirds lines
          const thirdH1 = height / 3;
          const thirdH2 = (2 * height) / 3;
          const thirdW1 = width / 3;
          const thirdW2 = (2 * width) / 3;

          // Intersections of thirds
          const intersections = [
            { x: thirdW1, y: thirdH1 },
            { x: thirdW2, y: thirdH1 },
            { x: thirdW1, y: thirdH2 },
            { x: thirdW2, y: thirdH2 },
          ];

          // Simplistic check for elements near rule of thirds intersections
          let hasElementsAtIntersections = false;

          for (const path of pathMatch) {
            const pathData = path.match(/d\s*=\s*['"]([^"']*)['"]/i);
            if (pathData && pathData[1]) {
              // Extract move commands (starting points)
              const moveCommands = pathData[1].match(
                /[Mm]\s*(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/g
              );

              if (moveCommands) {
                for (const command of moveCommands) {
                  const coords = command.match(/(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/);
                  if (coords && coords[1] && coords[2]) {
                    const x = parseFloat(coords[1]);
                    const y = parseFloat(coords[2]);

                    // Check if this point is near any intersection
                    for (const intersection of intersections) {
                      const distance = Math.sqrt(
                        Math.pow(x - intersection.x, 2) + Math.pow(y - intersection.y, 2)
                      );

                      // If within 10% of width/height, consider it aligned with rule of thirds
                      if (distance < Math.min(width, height) * 0.1) {
                        hasElementsAtIntersections = true;
                        break;
                      }
                    }

                    if (hasElementsAtIntersections) break;
                  }
                }
              }

              if (hasElementsAtIntersections) break;
            }
          }

          if (hasElementsAtIntersections) {
            score += 10; // Bonus for elements at rule of thirds intersections
          }
        }
      }
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Assess visual weight distribution
   *
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for visual weight distribution
   */
  private static assessVisualWeight(svgContent: string): number {
    let score = 75; // Start with a default score

    // Extract viewBox dimensions
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^"']*)['"]/i);
    if (!viewBoxMatch || !viewBoxMatch[1]) return score;

    const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
    if (viewBox.length !== 4) return score;

    const [x, y, width, height] = viewBox;

    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      return score;
    }

    // Divide the canvas into quadrants
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Simple density map to track distribution of elements
    const quadrants = {
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0,
    };

    // Analyze path elements
    const pathMatch = svgContent.match(/<path[^>]*>/gi);
    if (pathMatch) {
      for (const path of pathMatch) {
        // Extract d attribute
        const dMatch = path.match(/d\s*=\s*['"]([^"']*)['"]/i);
        if (dMatch && dMatch[1]) {
          const pathData = dMatch[1];

          // Extract coordinates from path data
          const coordinates: { x: number; y: number }[] = [];
          const coordMatches = pathData.match(
            /[A-Za-z]\s*(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/g
          );

          if (coordMatches) {
            for (const coord of coordMatches) {
              const parts = coord.match(/(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/);
              if (parts && parts[1] && parts[2]) {
                coordinates.push({
                  x: parseFloat(parts[1]),
                  y: parseFloat(parts[2]),
                });
              }
            }
          }

          // Determine which quadrants this path occupies
          for (const coord of coordinates) {
            if (coord.x < centerX && coord.y < centerY) {
              quadrants.topLeft++;
            } else if (coord.x >= centerX && coord.y < centerY) {
              quadrants.topRight++;
            } else if (coord.x < centerX && coord.y >= centerY) {
              quadrants.bottomLeft++;
            } else {
              quadrants.bottomRight++;
            }
          }
        }
      }
    }

    // Analyze circle elements
    const circleMatch = svgContent.match(/<circle[^>]*>/gi);
    if (circleMatch) {
      for (const circle of circleMatch) {
        // Extract cx and cy attributes
        const cxMatch = circle.match(/cx\s*=\s*['"]([^"']*)['"]/i);
        const cyMatch = circle.match(/cy\s*=\s*['"]([^"']*)['"]/i);

        if (cxMatch && cxMatch[1] && cyMatch && cyMatch[1]) {
          const cx = parseFloat(cxMatch[1]);
          const cy = parseFloat(cyMatch[1]);

          // Determine which quadrant this circle is in
          if (cx < centerX && cy < centerY) {
            quadrants.topLeft++;
          } else if (cx >= centerX && cy < centerY) {
            quadrants.topRight++;
          } else if (cx < centerX && cy >= centerY) {
            quadrants.bottomLeft++;
          } else {
            quadrants.bottomRight++;
          }
        }
      }
    }

    // Analyze rect elements
    const rectMatch = svgContent.match(/<rect[^>]*>/gi);
    if (rectMatch) {
      for (const rect of rectMatch) {
        // Extract x, y, width, height attributes
        const xMatch = rect.match(/x\s*=\s*['"]([^"']*)['"]/i);
        const yMatch = rect.match(/y\s*=\s*['"]([^"']*)['"]/i);
        const wMatch = rect.match(/width\s*=\s*['"]([^"']*)['"]/i);
        const hMatch = rect.match(/height\s*=\s*['"]([^"']*)['"]/i);

        if (
          xMatch &&
          xMatch[1] &&
          yMatch &&
          yMatch[1] &&
          wMatch &&
          wMatch[1] &&
          hMatch &&
          hMatch[1]
        ) {
          const rectX = parseFloat(xMatch[1]);
          const rectY = parseFloat(yMatch[1]);
          const rectW = parseFloat(wMatch[1]);
          const rectH = parseFloat(hMatch[1]);

          // Center point of the rectangle
          const rectCenterX = rectX + rectW / 2;
          const rectCenterY = rectY + rectH / 2;

          // Determine which quadrant this rectangle is in
          if (rectCenterX < centerX && rectCenterY < centerY) {
            quadrants.topLeft++;
          } else if (rectCenterX >= centerX && rectCenterY < centerY) {
            quadrants.topRight++;
          } else if (rectCenterX < centerX && rectCenterY >= centerY) {
            quadrants.bottomLeft++;
          } else {
            quadrants.bottomRight++;
          }
        }
      }
    }

    // Count total elements in all quadrants
    const total =
      quadrants.topLeft + quadrants.topRight + quadrants.bottomLeft + quadrants.bottomRight;

    if (total > 0) {
      // Calculate percentages in each quadrant
      const percentages = {
        topLeft: (quadrants.topLeft / total) * 100,
        topRight: (quadrants.topRight / total) * 100,
        bottomLeft: (quadrants.bottomLeft / total) * 100,
        bottomRight: (quadrants.bottomRight / total) * 100,
      };

      // Check for balanced distribution (ideally each quadrant would have ~25%)
      const idealPercentage = 25;
      const deviations = [
        Math.abs(percentages.topLeft - idealPercentage),
        Math.abs(percentages.topRight - idealPercentage),
        Math.abs(percentages.bottomLeft - idealPercentage),
        Math.abs(percentages.bottomRight - idealPercentage),
      ];

      // Average deviation from ideal
      const avgDeviation = deviations.reduce((sum, val) => sum + val, 0) / 4;

      // Score based on deviation (lower deviation = higher score)
      if (avgDeviation < 10) {
        score += 15; // Very balanced
      } else if (avgDeviation < 20) {
        score += 5; // Reasonably balanced
      } else if (avgDeviation > 40) {
        score -= 15; // Very unbalanced
      } else if (avgDeviation > 30) {
        score -= 10; // Unbalanced
      }

      // Check for empty quadrants (usually not good for balance)
      const emptyQuadrants = Object.values(quadrants).filter(val => val === 0).length;
      score -= emptyQuadrants * 5;
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Assess typography quality
   *
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for typography quality
   */
  private static assessTypography(svgContent: string): number {
    // Check if the SVG contains text elements
    const hasText = /<text[^>]*>/i.test(svgContent);

    // If no text elements, typography assessment is not applicable
    if (!hasText) {
      return 80; // Default "not applicable" score
    }

    let score = 70; // Start with a default score for SVGs with text

    // Extract all text elements
    const textElements = svgContent.match(/<text[^>]*>.*?<\/text>/gis) || [];

    if (textElements.length === 0) {
      return 80; // No text content found
    }

    // Check font-family specifications
    const fontFamilies: Set<string> = new Set();
    const fontFamilyMatches = svgContent.match(/font-family\s*=\s*["']([^"']*)["']/gi) || [];

    for (const match of fontFamilyMatches) {
      const fontFamily = match.match(/["']([^"']*)["']/i);
      if (fontFamily && fontFamily[1]) {
        fontFamilies.add(fontFamily[1].toLowerCase());
      }
    }

    // Deduct points for using too many different fonts
    if (fontFamilies.size > 2) {
      score -= (fontFamilies.size - 2) * 10; // -10 for each font beyond 2
    }

    // Check font sizes for hierarchy
    const fontSizes: number[] = [];
    const fontSizeMatches = svgContent.match(/font-size\s*=\s*["']([^"']*)["']/gi) || [];

    for (const match of fontSizeMatches) {
      const fontSize = match.match(/["']([^"']*)["']/i);
      if (fontSize && fontSize[1]) {
        // Extract numeric value
        const size = parseFloat(fontSize[1]);
        if (!isNaN(size)) {
          fontSizes.push(size);
        }
      }
    }

    // Check for good hierarchy in font sizes
    if (fontSizes.length > 1) {
      // Sort font sizes
      fontSizes.sort((a, b) => a - b);

      let ratio: number | undefined = undefined;
      if (
        fontSizes &&
        fontSizes.length > 1 &&
        typeof fontSizes[0] === 'number' &&
        typeof fontSizes[fontSizes.length - 1] === 'number' &&
        fontSizes[0] !== 0
      ) {
        ratio = (fontSizes[fontSizes.length - 1] as number) / (fontSizes[0] as number);
      }

      if (ratio !== undefined) {
        if (ratio > 1.5 && ratio < 4) {
          score += 10; // Good size hierarchy
        } else if (ratio <= 1.2) {
          score -= 10; // Too little contrast between sizes
        } else if (ratio >= 5) {
          score -= 5; // Too much contrast between sizes
        }
      }
    }

    // Check text positioning
    let textTooSmall = false;
    let textWellPositioned = true;

    for (const textElement of textElements) {
      // Check for tiny text (generally bad for logos)
      const fontSizeMatch = textElement.match(/font-size\s*=\s*["']([^"']*)["']/i);
      if (fontSizeMatch && fontSizeMatch[1]) {
        const size = parseFloat(fontSizeMatch[1]);
        if (!isNaN(size) && size < 8) {
          textTooSmall = true;
        }
      }

      // Check if text is well-positioned within the viewBox
      const xMatch = textElement.match(/x\s*=\s*["']([^"']*)["']/i);
      const yMatch = textElement.match(/y\s*=\s*["']([^"']*)["']/i);

      if (xMatch && xMatch[1] && yMatch && yMatch[1]) {
        const x = parseFloat(xMatch[1]);
        const y = parseFloat(yMatch[1]);

        // Extract viewBox dimensions
        const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^"']*)['"]/i);
        if (viewBoxMatch && viewBoxMatch[1]) {
          const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
          if (viewBox.length === 4) {
            const [minX, minY, width, height] = viewBox;
            // Check if text is too close to the edge
            if (
              typeof width === 'number' &&
              typeof height === 'number' &&
              typeof minX === 'number' &&
              typeof minY === 'number'
            ) {
              const margin = Math.min(width, height) * 0.05; // 5% margin
              if (
                x < minX + margin ||
                x > minX + width - margin ||
                y < minY + margin ||
                y > minY + height - margin
              ) {
                textWellPositioned = false;
              }
            }
          }
        }
      }
    }

    // Apply scoring adjustments
    if (textTooSmall) {
      score -= 15; // Significant deduction for text that's too small
    }

    if (!textWellPositioned) {
      score -= 10; // Deduction for poorly positioned text
    }

    // Check for letter-spacing/kerning attributes (good typography practice)
    if (svgContent.match(/letter-spacing\s*=|kerning\s*=/i)) {
      score += 10; // Bonus for attention to letter spacing
    }

    // Check for text-anchor attribute (good for alignment)
    if (svgContent.match(/text-anchor\s*=\s*["'](middle|start|end)["']/i)) {
      score += 5; // Bonus for proper text alignment
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Assess negative space utilization
   *
   * @param svgContent - The SVG content to analyze
   * @returns Score from 0-100 for negative space usage
   */
  private static assessNegativeSpace(svgContent: string): number {
    let score = 70; // Start with a default score

    // Extract viewBox dimensions
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^"']*)['"]/i);
    if (!viewBoxMatch || !viewBoxMatch[1]) return score;

    const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
    if (viewBox.length !== 4) return score;

    const [, , width, height] = viewBox;
    const totalArea = typeof width === 'number' && typeof height === 'number' ? width * height : 0;

    // Estimate filled area based on path, rect, circle elements
    let estimatedFilledArea = 0;

    // Check rectangles
    const rectElements = svgContent.match(/<rect[^>]*>/gi) || [];
    for (const rect of rectElements) {
      const widthMatch = rect.match(/width\s*=\s*['"]([^"']*)['"]/i);
      const heightMatch = rect.match(/height\s*=\s*['"]([^"']*)['"]/i);

      if (widthMatch && widthMatch[1] && heightMatch && heightMatch[1]) {
        const rectWidth = parseFloat(widthMatch[1]);
        const rectHeight = parseFloat(heightMatch[1]);

        if (!isNaN(rectWidth) && !isNaN(rectHeight)) {
          estimatedFilledArea += rectWidth * rectHeight;
        }
      }
    }

    // Check circles
    const circleElements = svgContent.match(/<circle[^>]*>/gi) || [];
    for (const circle of circleElements) {
      const rMatch = circle.match(/r\s*=\s*['"]([^"']*)['"]/i);

      if (rMatch && rMatch[1]) {
        const radius = parseFloat(rMatch[1]);

        if (!isNaN(radius)) {
          estimatedFilledArea += Math.PI * radius * radius;
        }
      }
    }

    // Approximate path area (very rough estimation)
    const pathElements = svgContent.match(/<path[^>]*>/gi) || [];
    if (pathElements) {
      // Simple heuristic: each path contributes approximately 5% of viewBox area
      // This is very approximate and would be more accurate with actual path analysis
      estimatedFilledArea += pathElements.length * (totalArea * 0.05);
    }

    // Calculate negative space percentage
    const filledPercentage = (estimatedFilledArea / totalArea) * 100;
    const negativeSpacePercentage = 100 - filledPercentage;

    // Score based on negative space percentage
    // Ideal range is typically 40-70% negative space
    if (negativeSpacePercentage >= 40 && negativeSpacePercentage <= 70) {
      score += 20; // Optimal negative space
    } else if (negativeSpacePercentage > 70 && negativeSpacePercentage <= 85) {
      score += 10; // Good amount of negative space
    } else if (negativeSpacePercentage > 85) {
      score -= 10; // Too much negative space
    } else if (negativeSpacePercentage < 40 && negativeSpacePercentage >= 25) {
      score -= 5; // A bit crowded
    } else if (negativeSpacePercentage < 25) {
      score -= 15; // Too crowded
    }

    // Check for strategic negative space
    // This is a simplified check for intentional negative space

    // Check if there are clear gaps between elements
    const hasClusteredElements = this.hasElementClustering(svgContent);
    if (!hasClusteredElements) {
      score += 10; // Bonus for well-distributed elements with proper spacing
    } else {
      score -= 5; // Deduction for elements that are too clustered
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if elements are clustered together without sufficient spacing
   *
   * @param svgContent - The SVG content to analyze
   * @returns Whether elements are excessively clustered
   */
  private static hasElementClustering(svgContent: string): boolean {
    // Extract viewBox dimensions
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^"']*)['"]/i);
    if (!viewBoxMatch || !viewBoxMatch[1]) return false;

    const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
    if (viewBox.length !== 4) return false;

    const [, , width, height] = viewBox;

    // Collect coordinates of element centers
    const elementCoordinates: Array<{ x: number; y: number }> = [];

    // Check rectangles
    const rectElements = svgContent.match(/<rect[^>]*>/gi) || [];
    for (const rect of rectElements) {
      const xMatch = rect.match(/x\s*=\s*['"]([^"']*)['"]/i);
      const yMatch = rect.match(/y\s*=\s*['"]([^"']*)['"]/i);
      const widthMatch = rect.match(/width\s*=\s*['"]([^"']*)['"]/i);
      const heightMatch = rect.match(/height\s*=\s*['"]([^"']*)['"]/i);

      if (
        xMatch &&
        xMatch[1] &&
        yMatch &&
        yMatch[1] &&
        widthMatch &&
        widthMatch[1] &&
        heightMatch &&
        heightMatch[1]
      ) {
        const x = parseFloat(xMatch[1]);
        const y = parseFloat(yMatch[1]);
        const rectWidth = parseFloat(widthMatch[1]);
        const rectHeight = parseFloat(heightMatch[1]);

        if (!isNaN(x) && !isNaN(y) && !isNaN(rectWidth) && !isNaN(rectHeight)) {
          elementCoordinates.push({
            x: x + rectWidth / 2,
            y: y + rectHeight / 2,
          });
        }
      }
    }

    // Check circles
    const circleElements = svgContent.match(/<circle[^>]*>/gi) || [];
    for (const circle of circleElements) {
      const cxMatch = circle.match(/cx\s*=\s*['"]([^"']*)['"]/i);
      const cyMatch = circle.match(/cy\s*=\s*['"]([^"']*)['"]/i);

      if (cxMatch && cxMatch[1] && cyMatch && cyMatch[1]) {
        const cx = parseFloat(cxMatch[1]);
        const cy = parseFloat(cyMatch[1]);

        if (!isNaN(cx) && !isNaN(cy)) {
          elementCoordinates.push({ x: cx, y: cy });
        }
      }
    }

    // Check path starting points (simplified)
    const pathElements = svgContent.match(/<path[^>]*d\s*=\s*['"]([^"']*)['"]/gi) || [];
    for (const path of pathElements) {
      const dMatch = path.match(/d\s*=\s*['"]([^"']*)['"]/i);
      if (dMatch && dMatch[1]) {
        // Look for M commands which are starting points
        const moveMatch = dMatch[1].match(/[Mm]\s*(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/);
        if (moveMatch) {
          const x = moveMatch && moveMatch[1] ? parseFloat(moveMatch[1]) : 0;
          const y = moveMatch && moveMatch[2] ? parseFloat(moveMatch[2]) : 0;

          if (!isNaN(x) && !isNaN(y)) {
            elementCoordinates.push({ x, y });
          }
        }
      }
    }

    // If fewer than 2 elements, can't be clustered
    if (elementCoordinates.length < 2) {
      return false;
    }

    // Calculate average distance between elements
    let totalDistance = 0;
    let pairCount = 0;

    for (let i = 0; i < elementCoordinates.length; i++) {
      for (let j = i + 1; j < elementCoordinates.length; j++) {
        const coordI = elementCoordinates[i];
        const coordJ = elementCoordinates[j];
        let dist = 0;
        if (
          coordI !== undefined &&
          coordJ !== undefined &&
          typeof coordI.x === 'number' &&
          typeof coordI.y === 'number' &&
          typeof coordJ.x === 'number' &&
          typeof coordJ.y === 'number'
        ) {
          dist = Math.sqrt(Math.pow(coordI.x - coordJ.x, 2) + Math.pow(coordI.y - coordJ.y, 2));
        }
        totalDistance += dist;
        pairCount++;
      }
    }

    const avgDistance = totalDistance / pairCount;

    // Calculate the threshold for clustering
    // Use 15% of the average dimension as a threshold
    const threshold =
      typeof width === 'number' && typeof height === 'number' ? ((width + height) / 2) * 0.15 : 0;

    // If average distance is less than threshold, elements are clustered
    return avgDistance < threshold;
  }

  /**
   * Generate design improvement suggestions based on assessment scores
   *
   * @param colorHarmonyScore - Score for color harmony
   * @param compositionScore - Score for composition
   * @param visualWeightScore - Score for visual weight
   * @param typographyScore - Score for typography
   * @param negativeSpaceScore - Score for negative space
   * @param svgContent - The original SVG content
   * @returns Array of design improvement suggestions
   */
  private static generateDesignSuggestions(
    colorHarmonyScore: number,
    compositionScore: number,
    visualWeightScore: number,
    typographyScore: number,
    negativeSpaceScore: number,
    svgContent: string
  ): string[] {
    const suggestions: string[] = [];

    // Color harmony suggestions
    if (colorHarmonyScore < 70) {
      const colors = this.extractColors(svgContent);

      if (colors.length > 5) {
        suggestions.push('Consider reducing the number of colors to 3-5 for better harmony');
      }

      if (colorHarmonyScore < 50) {
        suggestions.push(
          'Apply color theory principles like complementary, analogous, or monochromatic schemes'
        );
      }

      // Check for contrast
      if (colors.length >= 2) {
        const contrastScore = this.assessColorContrast(colors);
        if (contrastScore < 0) {
          suggestions.push('Increase contrast between colors for better visibility and impact');
        }
      }
    }

    // Composition suggestions
    if (compositionScore < 70) {
      const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^"']*)['"]/i);

      if (!viewBoxMatch) {
        suggestions.push('Add a proper viewBox attribute for consistent scaling');
      }

      if (compositionScore < 60) {
        suggestions.push(
          'Consider applying the golden ratio (1:1.618) or rule of thirds to element placement'
        );
      }

      if (compositionScore < 50) {
        suggestions.push('Improve overall balance and structure of the composition');
      }
    }

    // Visual weight suggestions
    if (visualWeightScore < 70) {
      if (visualWeightScore < 60) {
        suggestions.push('Redistribute visual elements for better balance across the design');
      }

      if (visualWeightScore < 50) {
        suggestions.push(
          'Create clearer visual hierarchy through size, color, and position variations'
        );
      }
    }

    // Typography suggestions
    const hasText = /<text[^>]*>/i.test(svgContent);

    if (hasText && typographyScore < 70) {
      const fontFamilies = svgContent.match(/font-family\s*=\s*["']([^"']*)["']/gi) || [];

      if (fontFamilies.length > 2) {
        suggestions.push('Limit font families to 1-2 for more cohesive typography');
      }

      if (typographyScore < 60) {
        suggestions.push('Improve letter spacing and alignment for better typographic quality');
      }

      if (typographyScore < 50) {
        suggestions.push('Enhance text legibility through better sizing and positioning');
      }
    }

    // Negative space suggestions
    if (negativeSpaceScore < 70) {
      if (negativeSpaceScore < 60) {
        suggestions.push('Create more intentional use of negative space for balance');
      }

      if (negativeSpaceScore < 50) {
        suggestions.push(
          this.hasElementClustering(svgContent)
            ? 'Reduce element clustering to create better spacing and breathing room'
            : 'Improve balance between filled areas and negative space'
        );
      }
    }

    // If no specific suggestions were generated, add a general one
    if (suggestions.length === 0) {
      suggestions.push(
        'Design meets quality standards. Consider minor refinements for further enhancement.'
      );
    }

    return suggestions;
  }
}
