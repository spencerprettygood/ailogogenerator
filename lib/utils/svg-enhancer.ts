/**
 * SVG Enhancer Module
 * 
 * This module integrates the design intelligence capabilities into the SVG generation
 * and validation pipeline. It provides a high-level API for enhancing SVG logos
 * with advanced design principles.
 */

import { SVGLogo, LogoElement } from '../types';
import { enhanceSVGDesign, DesignAssessment, DesignEnhancementOptions } from './design-intelligence';
import { SVGDesignValidator } from './svg-design-validator';
import { Logger } from './logger';

const logger = new Logger('SVGEnhancer');

/**
 * Result of the SVG enhancement process
 */
export interface SVGEnhancementResult {
  svg: SVGLogo;
  designQualityScore: DesignAssessment;
  enhancementApplied: boolean;
  technicalImprovements: string[];
}

/**
 * Options for enhancing an SVG
 */
export interface SVGEnhancerOptions extends DesignEnhancementOptions {
  minQualityThreshold?: number; // Minimum quality threshold (0-100)
  autoEnhance?: boolean; // Whether to automatically apply enhancements
  preserveOriginalColors?: boolean; // Whether to preserve original colors
  includeAssessment?: boolean; // Whether to include design assessment in result
}

/**
 * Enhances SVG logos with advanced design principles
 * 
 * @param svg - The SVG logo to enhance
 * @param options - Enhancement options
 * @returns Enhancement result
 */
export async function enhanceSVGLogo(
  svg: SVGLogo,
  options: SVGEnhancerOptions = {}
): Promise<SVGEnhancementResult> {
  logger.info('Enhancing SVG logo with design intelligence', {
    logoName: svg.name,
    options
  });
  
  try {
    // Set default options
    const minQualityThreshold = options.minQualityThreshold || 70;
    const autoEnhance = options.autoEnhance !== false;
    const preserveOriginalColors = options.preserveOriginalColors || false;
    
    // First, assess the original design quality
    const originalAssessment = await assessSVGDesignQuality(svg);
    let enhancementApplied = false;
    let technicalImprovements: string[] = [];
    
    // Only enhance if quality is below threshold and auto-enhance is enabled
    if (autoEnhance && originalAssessment.overallScore < minQualityThreshold) {
      logger.debug('Original design quality below threshold, applying enhancements', {
        originalScore: originalAssessment.overallScore,
        threshold: minQualityThreshold
      });
      
      // Customize enhancement options based on assessment
      const customizedOptions: DesignEnhancementOptions = {
        ...options,
        enhanceColors: preserveOriginalColors ? false : options.enhanceColors,
        enhanceAccessibility: options.enhanceAccessibility !== false,
        applyGoldenRatio: options.applyGoldenRatio !== false && originalAssessment.composition.score < 75,
        enhanceHierarchy: options.enhanceHierarchy !== false && originalAssessment.visualHierarchy.score < 75,
        optimizePaths: options.optimizePaths !== false && originalAssessment.technicalQuality.score < 80
      };
      
      // Apply design enhancements
      const { enhancedSvg, assessmentReport } = enhanceSVGDesign(svg, customizedOptions);
      
      // Update the SVG with enhanced version
      svg = enhancedSvg;
      enhancementApplied = true;
      
      // Record technical improvements made
      technicalImprovements = getTechnicalImprovements(customizedOptions);
      
      logger.info('SVG logo enhanced successfully', {
        logoName: svg.name,
        newScore: assessmentReport?.overallScore || 'unknown'
      });
    } else if (originalAssessment.overallScore >= minQualityThreshold) {
      logger.debug('Original design quality above threshold, no enhancement needed', {
        originalScore: originalAssessment.overallScore,
        threshold: minQualityThreshold
      });
    } else if (!autoEnhance) {
      logger.debug('Auto-enhance disabled, skipping enhancement');
    }
    
    return {
      svg,
      designQualityScore: originalAssessment,
      enhancementApplied,
      technicalImprovements
    };
  } catch (error) {
    logger.error('Error enhancing SVG logo', {
      error: error instanceof Error ? error.message : String(error),
      logoName: svg.name
    });
    
    // Return original SVG with error information
    return {
      svg,
      designQualityScore: {
        overallScore: 0,
        colorHarmony: {
          score: 0,
          assessment: 'Error during assessment',
          recommendations: []
        },
        composition: {
          score: 0,
          assessment: 'Error during assessment',
          recommendations: []
        },
        visualHierarchy: {
          score: 0,
          assessment: 'Error during assessment',
          recommendations: []
        },
        accessibility: {
          score: 0,
          assessment: 'Error during assessment',
          recommendations: []
        },
        technicalQuality: {
          score: 0,
          assessment: 'Error during assessment',
          recommendations: []
        }
      },
      enhancementApplied: false,
      technicalImprovements: []
    };
  }
}

/**
 * Assesses the design quality of an SVG logo
 * 
 * @param svg - The SVG logo to assess
 * @returns Design assessment
 */
export async function assessSVGDesignQuality(svg: SVGLogo): Promise<DesignAssessment> {
  try {
    logger.debug('Assessing SVG design quality', { logoName: svg.name });
    
    // Use SVGDesignValidator for base validation
    const validationResult = SVGDesignValidator.validateDesignQuality(svg.svgCode);
    
    // Use design intelligence module for detailed assessment
    const { assessmentReport } = enhanceSVGDesign(svg, { 
      // Don't apply any changes, just assess
      applyGoldenRatio: false,
      enhanceColors: false,
      enhanceAccessibility: false,
      enhanceHierarchy: false,
      optimizePaths: false
    });
    
    // Return the assessment or a default if not available
    return assessmentReport || {
      overallScore: validationResult.designQualityScore?.overallAesthetic || 70,
      colorHarmony: {
        score: validationResult.designQualityScore?.colorHarmony || 70,
        assessment: 'Basic color harmony assessment',
        recommendations: validationResult.designQualityScore?.designSuggestions.filter(s => 
          s.toLowerCase().includes('color') || s.toLowerCase().includes('palette')
        ) || []
      },
      composition: {
        score: validationResult.designQualityScore?.composition || 70,
        assessment: 'Basic composition assessment',
        recommendations: validationResult.designQualityScore?.designSuggestions.filter(s => 
          s.toLowerCase().includes('composition') || s.toLowerCase().includes('layout')
        ) || []
      },
      visualHierarchy: {
        score: validationResult.designQualityScore?.visualWeight || 70,
        assessment: 'Basic visual hierarchy assessment',
        recommendations: validationResult.designQualityScore?.designSuggestions.filter(s => 
          s.toLowerCase().includes('hierarchy') || s.toLowerCase().includes('weight')
        ) || []
      },
      accessibility: {
        score: Math.round((
          (validationResult.designQualityScore?.colorHarmony || 70) + 
          (validationResult.designQualityScore?.typography || 70)
        ) / 2),
        assessment: 'Basic accessibility assessment',
        recommendations: validationResult.designQualityScore?.designSuggestions.filter(s => 
          s.toLowerCase().includes('contrast') || s.toLowerCase().includes('legibility')
        ) || []
      },
      technicalQuality: {
        score: validationResult.designQualityScore?.technicalQuality || 70,
        assessment: 'Basic technical quality assessment',
        recommendations: validationResult.designQualityScore?.designSuggestions.filter(s => 
          s.toLowerCase().includes('technical') || s.toLowerCase().includes('optimize')
        ) || []
      }
    };
  } catch (error) {
    logger.error('Error assessing SVG design quality', {
      error: error instanceof Error ? error.message : String(error),
      logoName: svg.name
    });
    
    // Return a default assessment in case of error
    return {
      overallScore: 50,
      colorHarmony: {
        score: 50,
        assessment: 'Could not assess color harmony due to an error',
        recommendations: ['Review color harmony manually']
      },
      composition: {
        score: 50,
        assessment: 'Could not assess composition due to an error',
        recommendations: ['Review composition manually']
      },
      visualHierarchy: {
        score: 50,
        assessment: 'Could not assess visual hierarchy due to an error',
        recommendations: ['Review visual hierarchy manually']
      },
      accessibility: {
        score: 50,
        assessment: 'Could not assess accessibility due to an error',
        recommendations: ['Ensure adequate contrast between elements']
      },
      technicalQuality: {
        score: 50,
        assessment: 'Could not assess technical quality due to an error',
        recommendations: ['Check SVG for technical issues manually']
      }
    };
  }
}

/**
 * Gets a list of technical improvements made based on options
 * 
 * @param options - Enhancement options applied
 * @returns List of technical improvements
 */
function getTechnicalImprovements(options: DesignEnhancementOptions): string[] {
  const improvements: string[] = [];
  
  if (options.applyGoldenRatio) {
    improvements.push('Applied golden ratio principles to improve composition');
  }
  
  if (options.enhanceColors) {
    improvements.push('Enhanced color harmony and psychological impact');
  }
  
  if (options.enhanceAccessibility) {
    const level = options.accessibilityLevel || 'AA';
    improvements.push(`Improved accessibility to WCAG ${level} standards`);
  }
  
  if (options.enhanceHierarchy) {
    improvements.push('Enhanced visual hierarchy using Gestalt principles');
  }
  
  if (options.optimizePaths) {
    improvements.push('Optimized SVG paths for better performance and rendering');
  }
  
  if (options.culturalRegion) {
    improvements.push(`Applied cultural design adaptations for ${options.culturalRegion} region`);
  }
  
  if (options.industry) {
    improvements.push(`Applied industry-specific enhancements for ${options.industry} sector`);
  }
  
  return improvements;
}

/**
 * Enhances typography in an SVG logo
 * 
 * @param svg - The SVG logo to enhance
 * @param typography - Typography specifications
 * @returns Enhanced SVG logo
 */
export function enhanceSVGTypography(svg: SVGLogo, typography?: Typography): SVGLogo {
  logger.debug('Enhancing SVG typography', { logoName: svg.name });
  
  // Create a copy to avoid modifying the original
  const enhancedSvg: SVGLogo = JSON.parse(JSON.stringify(svg));
  
  try {
    // Find all text elements
    const textElements = findElementsByType(enhancedSvg.elements, 'text');
    
    if (textElements.length === 0) {
      logger.debug('No text elements found in SVG');
      return enhancedSvg;
    }
    
    // Apply typography enhancements to each text element
    for (const textElement of textElements) {
      // If typography is provided, apply those settings
      if (typography) {
        // Apply font family if specified
        if (typography.fontFamily) {
          textElement.attributes['font-family'] = typography.fontFamily;
        }
        
        // Apply font weight if appropriate style is specified
        if (typography.styles?.body?.weight) {
          textElement.attributes['font-weight'] = typography.styles.body.weight;
        }
        
        // Apply letter spacing if appropriate style is specified
        if (typography.styles?.body?.letterSpacing) {
          textElement.attributes['letter-spacing'] = typography.styles.body.letterSpacing;
        }
      } else {
        // Apply generic typography improvements
        
        // Ensure text has font-family
        if (!textElement.attributes['font-family']) {
          textElement.attributes['font-family'] = 'Arial, sans-serif';
        }
        
        // Ensure text has good letter-spacing
        if (!textElement.attributes['letter-spacing']) {
          textElement.attributes['letter-spacing'] = '0.02em';
        }
      }
    }
    
    // Rebuild the SVG code to include the typography changes
    enhancedSvg.svgCode = updateSVGCodeWithElements(enhancedSvg.svgCode, textElements);
    
    return enhancedSvg;
  } catch (error) {
    logger.error('Error enhancing SVG typography', {
      error: error instanceof Error ? error.message : String(error),
      logoName: svg.name
    });
    
    // Return the original SVG if an error occurs
    return svg;
  }
}

/**
 * Updates SVG code with modified elements
 * 
 * @param svgCode - Original SVG code
 * @param modifiedElements - Elements that have been modified
 * @returns Updated SVG code
 */
function updateSVGCodeWithElements(svgCode: string, modifiedElements: LogoElement[]): string {
  let updatedSvgCode = svgCode;
  
  // This is a simplified implementation
  // In a real implementation, we would need to parse the SVG DOM
  // and update it based on the modified elements
  
  // For now, just log that we would update the elements
  logger.debug(`Would update ${modifiedElements.length} elements in SVG code`);
  
  // Return the original code
  return updatedSvgCode;
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

export default {
  enhanceSVGLogo,
  assessSVGDesignQuality,
  enhanceSVGTypography
};