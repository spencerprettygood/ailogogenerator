import { optimize } from 'svgo';
import { SVGValidator } from '../../utils/svg-validator';

// Types for Stage E
export interface SvgValidationResult {
  isValid: boolean;
  svg: string; // Original or optimized/repaired SVG
  warnings: string[];
  errors?: string[];
  optimized: boolean;
  optimizationResults?: {
    originalSize: number;
    optimizedSize: number;
    reductionPercentage: number;
  };
  scores?: {
    security: number;
    accessibility: number;
    optimization: number;
    overall: number;
    designQuality?: number;
    colorHarmony?: number;
    composition?: number;
    visualHierarchy?: number;
  };
  designAssessment?: {
    overallScore: number;
    recommendations: string[];
    details: Record<string, unknown>;
  };
}

export interface StageEInput {
  svg: string;
  brandName: string;
  repair?: boolean; // Whether to attempt repairs
  optimize?: boolean; // Whether to optimize the SVG
}

export interface StageEOutput {
  success: boolean;
  result?: SvgValidationResult;
  error?: {
    type: 'validation_error' | 'svg_error' | 'system_error';
    message: string;
    details?: unknown;
  };
  processingTime?: number;
}

// Configuration - keeping this for backward compatibility
const STAGE_E_CONFIG = {
  max_svg_size: 15 * 1024, // 15KB maximum size
  min_svg_size: 50, // Minimum reasonable size
  disallowed_elements: [
    'script', 'foreignObject', 'iframe', 'image', 'embed', 'video',
    'audio', 'canvas', 'object', 'animate', 'set', 'animateMotion',
    'animateTransform', 'animateColor'
  ],
  disallowed_attributes: [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
    'onmousedown', 'onmouseup', 'onmousemove', 'onkeydown',
    'onkeyup', 'onkeypress', 'eval', 'javascript'
  ],
  disallowed_protocols: [
    'javascript:', 'data:text/html', 'vbscript:'
  ],
  allowed_elements: [
    'svg', 'g', 'path', 'circle', 'rect', 'polygon', 'polyline',
    'line', 'text', 'tspan', 'defs', 'linearGradient', 'radialGradient',
    'stop', 'ellipse', 'mask', 'clipPath', 'use', 'title', 'desc'
  ]
};

// SVG validator wrapper class that uses the enhanced SVGValidator from utils
class SvgValidator {
  static validate(svg: string): { isValid: boolean; warnings: string[]; errors?: string[] } {
    // Use the enhanced SVGValidator from utils
    const validationResult = SVGValidator.validate(svg);
    
    return {
      isValid: validationResult.isValid,
      warnings: validationResult.warnings,
      errors: validationResult.errors
    };
  }

  static repairSvg(svg: string, brandName: string): string {
    if (!svg || typeof svg !== 'string') {
      throw new Error('Cannot repair empty or non-string SVG');
    }

    // Use the enhanced SVGValidator repair functionality if available
    try {
      const repairResult = SVGValidator.repair(svg);
      
      // If repair worked, return the repaired SVG
      if (repairResult.isRepaired && repairResult.remainingIssues.length === 0) {
        return repairResult.svg;
      }
    } catch (error) {
      console.warn('Advanced SVG repair failed, falling back to basic repair', error);
    }

    // Fall back to the original repair method for backward compatibility
    let repairedSvg = svg;
    
    // Add XML declaration if missing
    if (!repairedSvg.trim().startsWith('<?xml')) {
      repairedSvg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + repairedSvg;
    }
    
    // Add xmlns if missing
    if (!repairedSvg.includes('xmlns=')) {
      repairedSvg = repairedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Add viewBox if missing
    if (!repairedSvg.includes('viewBox=')) {
      // Try to extract width and height
      const widthMatch = repairedSvg.match(/width=["']([^"']*)["']/);
      const heightMatch = repairedSvg.match(/height=["']([^"']*)["']/);
      
      let width = 300;
      let height = 300;
      
      if (widthMatch && heightMatch) {
        const w = widthMatch[1];
        const h = heightMatch[1];
        
        // Convert to numbers if possible
        const numericWidth = parseFloat(w);
        const numericHeight = parseFloat(h);
        
        if (!isNaN(numericWidth) && !isNaN(numericHeight)) {
          width = numericWidth;
          height = numericHeight;
        }
      }
      
      repairedSvg = repairedSvg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
    }
    
    // Add title and desc for accessibility if missing
    if (!repairedSvg.includes('<title>')) {
      const insertPoint = repairedSvg.indexOf('>') + 1;
      repairedSvg = 
        repairedSvg.slice(0, insertPoint) + 
        `\n  <title>${brandName} Logo</title>` + 
        repairedSvg.slice(insertPoint);
    }
    
    if (!repairedSvg.includes('<desc>')) {
      const titleEndIndex = repairedSvg.indexOf('</title>') + 8;
      if (titleEndIndex > 7) {
        repairedSvg = 
          repairedSvg.slice(0, titleEndIndex) + 
          `\n  <desc>Logo for ${brandName}</desc>` + 
          repairedSvg.slice(titleEndIndex);
      } else {
        const insertPoint = repairedSvg.indexOf('>') + 1;
        repairedSvg = 
          repairedSvg.slice(0, insertPoint) + 
          `\n  <desc>Logo for ${brandName}</desc>` + 
          repairedSvg.slice(insertPoint);
      }
    }
    
    // Remove disallowed elements
    for (const element of STAGE_E_CONFIG.disallowed_elements) {
      const openRegex = new RegExp(`<${element}[^>]*>`, 'gi');
      const closeRegex = new RegExp(`</${element}>`, 'gi');
      
      repairedSvg = repairedSvg.replace(openRegex, '<!-- removed disallowed element -->');
      repairedSvg = repairedSvg.replace(closeRegex, '<!-- end removed element -->');
    }
    
    // Remove disallowed attributes
    for (const attr of STAGE_E_CONFIG.disallowed_attributes) {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      repairedSvg = repairedSvg.replace(regex, '');
    }
    
    // Remove disallowed protocols
    for (const protocol of STAGE_E_CONFIG.disallowed_protocols) {
      const regex = new RegExp(protocol, 'gi');
      repairedSvg = repairedSvg.replace(regex, 'removed:');
    }
    
    return repairedSvg;
  }

  static optimizeSvg(svg: string): { svg: string; originalSize: number; optimizedSize: number } {
    // First try to use the enhanced SVGValidator optimize functionality
    try {
      const optimizationResult = SVGValidator.optimize(svg);
      return {
        svg: optimizationResult.svg,
        originalSize: optimizationResult.originalSize,
        optimizedSize: optimizationResult.optimizedSize
      };
    } catch (error) {
      console.warn('Advanced SVG optimization failed, falling back to SVGO', error);
    }
    
    // Fall back to SVGO for backward compatibility
    const originalSize = svg.length;
    
    try {
      // Use SVGO for optimization
      const result = optimize(svg, {
        multipass: true,
        plugins: [
          'preset-default'
        ]
      });
      
      const optimizedSize = result.data.length;
      
      return {
        svg: result.data,
        originalSize,
        optimizedSize
      };
    } catch (error) {
      console.error('SVG optimization error:', error);
      return {
        svg, // Return original if optimization fails
        originalSize,
        optimizedSize: originalSize
      };
    }
  }
}

// Main validation function
export async function validateAndRepairSvg(
  input: StageEInput
): Promise<StageEOutput> {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!input.svg || typeof input.svg !== 'string') {
      throw new Error('Input SVG is required and must be a string');
    }
    
    if (!input.brandName || typeof input.brandName !== 'string') {
      throw new Error('Brand name is required for accessibility elements');
    }
    
    // Initial validation using enhanced SVG validator
    const validationResult = SvgValidator.validate(input.svg);
    let { isValid, warnings, errors } = validationResult;
    let resultSvg = input.svg;
    let optimized = false;
    let optimizationResults;
    let scores;
    
    // If the advanced SVGValidator from utils provided scores, use them
    if ('securityScore' in validationResult && validationResult.securityScore !== undefined) {
      scores = {
        security: validationResult.securityScore,
        accessibility: validationResult.accessibilityScore || 0,
        optimization: validationResult.optimizationScore || 0,
        overall: Math.round((
          (validationResult.securityScore || 0) * 0.5 + 
          (validationResult.accessibilityScore || 0) * 0.3 + 
          (validationResult.optimizationScore || 0) * 0.2
        ))
      };
    }
    
    // Repair if requested and there are warnings or errors
    if (input.repair !== false && (warnings.length > 0 || (errors && errors.length > 0))) {
      // Try using the more advanced SVGValidator.process method first
      try {
        if (typeof SVGValidator.process === 'function') {
          const processResult = SVGValidator.process(resultSvg, { 
            repair: true, 
            optimize: input.optimize !== false 
          });
          
          if (processResult.success) {
            resultSvg = processResult.svg;
            optimized = input.optimize !== false;
            
            // Calculate size reduction if optimized
            if (optimized && processResult.optimization) {
              optimizationResults = {
                originalSize: processResult.optimization.originalSize,
                optimizedSize: processResult.optimization.optimizedSize,
                reductionPercentage: processResult.optimization.reductionPercent
              };
            }
            
            // Use the latest validation result
            const revalidation = SvgValidator.validate(resultSvg);
            isValid = revalidation.isValid;
            warnings = revalidation.warnings;
            errors = revalidation.errors;
            
            // Update scores if available
            if ('securityScore' in revalidation && revalidation.securityScore !== undefined) {
              scores = {
                security: revalidation.securityScore,
                accessibility: revalidation.accessibilityScore || 0,
                optimization: revalidation.optimizationScore || 0,
                overall: Math.round((
                  (revalidation.securityScore || 0) * 0.5 + 
                  (revalidation.accessibilityScore || 0) * 0.3 + 
                  (revalidation.optimizationScore || 0) * 0.2
                ))
              };
            }
          }
        }
      } catch (processError) {
        console.warn('Advanced SVG processing failed, falling back to basic methods', processError);
      }
      
      // If we haven't successfully processed the SVG yet, fall back to the basic methods
      if (!isValid || warnings.length > 0 || (errors && errors.length > 0)) {
        resultSvg = SvgValidator.repairSvg(resultSvg, input.brandName);
        
        // Re-validate after repair
        const revalidation = SvgValidator.validate(resultSvg);
        isValid = revalidation.isValid;
        warnings = revalidation.warnings;
        errors = revalidation.errors;
        
        if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn('SVG repair could not fix all issues:', warnings);
        }
        
        // Update scores if available after repair
        if ('securityScore' in revalidation && revalidation.securityScore !== undefined) {
          scores = {
            security: revalidation.securityScore,
            accessibility: revalidation.accessibilityScore || 0,
            optimization: revalidation.optimizationScore || 0,
            overall: Math.round((
              (revalidation.securityScore || 0) * 0.5 + 
              (revalidation.accessibilityScore || 0) * 0.3 + 
              (revalidation.optimizationScore || 0) * 0.2
            ))
          };
        }
      }
    }
    
    // Optimize if requested and not already optimized
    if (input.optimize !== false && isValid && !optimized) {
      const optimization = SvgValidator.optimizeSvg(resultSvg);
      resultSvg = optimization.svg;
      optimized = true;
      
      // Calculate size reduction
      const originalSize = optimization.originalSize;
      const optimizedSize = optimization.optimizedSize;
      const reductionPercentage = ((originalSize - optimizedSize) / originalSize) * 100;
      
      optimizationResults = {
        originalSize,
        optimizedSize,
        reductionPercentage
      };
      
      // Re-validate after optimization to ensure it's still valid
      const revalidation = SvgValidator.validate(resultSvg);
      if (!revalidation.isValid) {
        // If optimization broke it, revert to pre-optimized version
        resultSvg = input.svg;
        optimized = false;
        optimizationResults = undefined;
        warnings.push('Optimization was reverted because it made the SVG invalid');
      } else {
        // Update scores if available after optimization
        if ('securityScore' in revalidation && revalidation.securityScore !== undefined) {
          scores = {
            security: revalidation.securityScore,
            accessibility: revalidation.accessibilityScore || 0,
            optimization: revalidation.optimizationScore || 0,
            overall: Math.round((
              (revalidation.securityScore || 0) * 0.5 + 
              (revalidation.accessibilityScore || 0) * 0.3 + 
              (revalidation.optimizationScore || 0) * 0.2
            ))
          };
        }
      }
      
      // Apply Design Intelligence assessment
      try {
        // Import design intelligence utilities
        const { assessSVGDesignQuality } = require('../../utils/svg-enhancer');
        
        // Create a minimal SVGLogo object for assessment
        const svgLogo = {
          svgCode: resultSvg,
          width: 300, // Default width from config
          height: 300, // Default height from config
          elements: [], // Will be parsed internally
          colors: {
            primary: '#000000' // Default color, will be extracted from SVG
          },
          name: input.brandName
        };
        
        console.log('Performing design quality assessment on SVG logo');
        const designAssessment = await assessSVGDesignQuality(svgLogo);
        
        // Add design quality scores
        if (!scores) {
          scores = {
            security: 80, // Default values if not set previously
            accessibility: 80,
            optimization: 80,
            overall: 80
          };
        }
        
        // Add design intelligence scores
        scores.designQuality = designAssessment.overallScore;
        scores.colorHarmony = designAssessment.colorHarmony.score;
        scores.composition = designAssessment.composition.score;
        scores.visualHierarchy = designAssessment.visualHierarchy.score;
        
        // Include overall design score in the weighted average
        scores.overall = Math.round((
          (scores.security || 0) * 0.4 + 
          (scores.accessibility || 0) * 0.2 + 
          (scores.optimization || 0) * 0.1 +
          (scores.designQuality || 0) * 0.3 // Add design quality to the overall score
        ));
        
        // Add design assessment to the result
        const validationResult: SvgValidationResult = {
          isValid,
          svg: resultSvg,
          warnings,
          errors,
          optimized,
          optimizationResults,
          scores,
          designAssessment: {
            overallScore: designAssessment.overallScore,
            recommendations: [
              ...designAssessment.colorHarmony.recommendations,
              ...designAssessment.composition.recommendations,
              ...designAssessment.visualHierarchy.recommendations,
              ...designAssessment.accessibility.recommendations,
              ...designAssessment.technicalQuality.recommendations
            ].filter(Boolean), // Filter out any undefined/empty items
            details: {
              colorHarmony: designAssessment.colorHarmony,
              composition: designAssessment.composition,
              visualHierarchy: designAssessment.visualHierarchy,
              accessibility: designAssessment.accessibility,
              technicalQuality: designAssessment.technicalQuality
            }
          }
        };
        
        return {
          success: isValid,
          result: validationResult,
          processingTime: Date.now() - startTime
        };
      } catch (assessmentError) {
        console.error('Error during design quality assessment:', assessmentError);
        // Continue without design assessment if it fails
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // Only reach here if design assessment fails or is skipped
    return {
      success: isValid,
      result: {
        isValid,
        svg: resultSvg,
        warnings,
        errors,
        optimized,
        optimizationResults,
        scores
      },
      processingTime
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    let errorType: 'validation_error' | 'svg_error' | 'system_error' = 'system_error';
    let errorMessage = 'Unknown error occurred during SVG validation';
    let errorDetails: unknown = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (process.env.NODE_ENV === 'development') {
        errorDetails = error.stack;
      }
      
      if (error.message.includes('Input SVG') || 
          error.message.includes('Brand name')) {
        errorType = 'validation_error';
      } else if (error.message.includes('SVG')) {
        errorType = 'svg_error';
      }
    }
    
    return {
      success: false,
      error: { type: errorType, message: errorMessage, details: errorDetails },
      processingTime
    };
  }
}

// Export configuration and metadata
export const STAGE_E_METADATA = {
  name: 'Stage E - SVG Validation & Design Intelligence',
  expected_processing_time_ms: 1500, // Increased for design intelligence
  disallowed_elements: STAGE_E_CONFIG.disallowed_elements,
  disallowed_attributes: STAGE_E_CONFIG.disallowed_attributes,
  max_svg_size: STAGE_E_CONFIG.max_svg_size,
  features: {
    security_scoring: true,
    accessibility_scoring: true,
    optimization_scoring: true,
    enhanced_validation: true,
    enhanced_repair: true,
    svg_optimization: true,
    design_intelligence: true, // New feature
    design_quality_assessment: true, // New feature
    golden_ratio_analysis: true, // New feature
    color_theory_analysis: true, // New feature
    visual_hierarchy_assessment: true // New feature
  }
};