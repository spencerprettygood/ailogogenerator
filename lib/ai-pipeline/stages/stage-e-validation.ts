import { optimize } from 'svgo';

// Types for Stage E
export interface SvgValidationResult {
  isValid: boolean;
  svg: string; // Original or optimized/repaired SVG
  warnings: string[];
  optimized: boolean;
  optimizationResults?: {
    originalSize: number;
    optimizedSize: number;
    reductionPercentage: number;
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

// Configuration
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

// SVG validator class
class SvgValidator {
  static validate(svg: string): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check if SVG is empty or not a string
    if (!svg || typeof svg !== 'string') {
      return { isValid: false, warnings: ['SVG is empty or not a string'] };
    }
    
    // Check size
    if (svg.length > STAGE_E_CONFIG.max_svg_size) {
      warnings.push(`SVG exceeds maximum size of ${STAGE_E_CONFIG.max_svg_size / 1024}KB`);
    }
    
    if (svg.length < STAGE_E_CONFIG.min_svg_size) {
      warnings.push(`SVG is suspiciously small (${svg.length} bytes)`);
    }
    
    // Basic structure checks
    if (!svg.includes('<svg')) {
      warnings.push('Missing <svg> element');
      return { isValid: false, warnings };
    }
    
    if (!svg.includes('viewBox') && !svg.includes('width') && !svg.includes('height')) {
      warnings.push('Missing viewBox, width, or height attributes');
    }
    
    // Check for disallowed elements
    for (const element of STAGE_E_CONFIG.disallowed_elements) {
      if (svg.toLowerCase().includes(`<${element.toLowerCase()}`)) {
        warnings.push(`Contains disallowed element: ${element}`);
      }
    }
    
    // Check for disallowed attributes
    for (const attr of STAGE_E_CONFIG.disallowed_attributes) {
      const regex = new RegExp(`\\s${attr}\\s*=`, 'i');
      if (regex.test(svg)) {
        warnings.push(`Contains disallowed attribute: ${attr}`);
      }
    }
    
    // Check for disallowed protocols
    for (const protocol of STAGE_E_CONFIG.disallowed_protocols) {
      if (svg.toLowerCase().includes(protocol.toLowerCase())) {
        warnings.push(`Contains disallowed protocol: ${protocol}`);
      }
    }
    
    // Check for unclosed tags
    const openingTags = svg.match(/<[a-zA-Z][^>/]*>/g) || [];
    const closingTags = svg.match(/<\/[a-zA-Z][^>]*>/g) || [];
    const selfClosingTags = svg.match(/<[a-zA-Z][^>]*\/>/g) || [];
    
    if (openingTags.length - selfClosingTags.length !== closingTags.length) {
      warnings.push('SVG may have unclosed tags');
    }
    
    // Check for required attributes on svg root
    if (!svg.match(/<svg[^>]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/)) {
      warnings.push('Missing xmlns attribute on svg element');
    }
    
    // Check for accessibility
    if (!svg.includes('<title>') && !svg.includes('<desc>')) {
      warnings.push('Missing title or desc elements for accessibility');
    }
    
    // Determine if valid
    const criticalWarnings = warnings.filter(w => 
      w.includes('disallowed') || 
      w.includes('Missing <svg>') ||
      w.includes('suspiciously small')
    );
    
    return {
      isValid: criticalWarnings.length === 0,
      warnings
    };
  }

  static repairSvg(svg: string, brandName: string): string {
    if (!svg || typeof svg !== 'string') {
      throw new Error('Cannot repair empty or non-string SVG');
    }

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
    
    // Initial validation
    let { isValid, warnings } = SvgValidator.validate(input.svg);
    let resultSvg = input.svg;
    let optimized = false;
    let optimizationResults;
    
    // Repair if requested and there are warnings
    if (input.repair !== false && warnings.length > 0) {
      resultSvg = SvgValidator.repairSvg(resultSvg, input.brandName);
      
      // Re-validate after repair
      const revalidation = SvgValidator.validate(resultSvg);
      isValid = revalidation.isValid;
      warnings = revalidation.warnings;
      
      if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('SVG repair could not fix all issues:', warnings);
      }
    }
    
    // Optimize if requested
    if (input.optimize !== false && isValid) {
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
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: isValid,
      result: {
        isValid,
        svg: resultSvg,
        warnings,
        optimized,
        optimizationResults
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
  name: 'Stage E - SVG Validation & Repair',
  expected_processing_time_ms: 1000, // Expected processing time
  disallowed_elements: STAGE_E_CONFIG.disallowed_elements,
  disallowed_attributes: STAGE_E_CONFIG.disallowed_attributes,
  max_svg_size: STAGE_E_CONFIG.max_svg_size,
};