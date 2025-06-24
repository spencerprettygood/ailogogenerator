/**
 * SVG Processing Pipeline
 * 
 * This module provides an optimized pipeline for processing SVG content
 * through multiple stages like parsing, validation, sanitization, and optimization.
 * It includes caching at each stage for improved performance.
 */

import { sanitizeSVG, optimizeSVG, validateSVG, extractAnimatableElements, checkAnimationCompatibility } from './utils';
import { AnimationType } from './types';
import { Logger } from '../utils/logger';
import { createMemoizedFunction } from '../utils/cache-manager';
import { 
  handleError, 
  ErrorCategory, 
  createAppError 
} from '../utils/error-handler';

// Cache size configuration
const CACHE_SIZES = {
  VALIDATION: 100,
  ELEMENT_EXTRACTION: 50,
  COMPATIBILITY_CHECK: 50,
  PROCESS_FULL: 50
};

// Logger instance
const logger = new Logger('SVGProcessingPipeline');

/**
 * Result of the SVG validation stage
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Result of the SVG element extraction stage
 */
export interface ElementExtractionResult {
  elements: string[];
}

/**
 * Result of the compatibility check stage
 */
export interface CompatibilityResult {
  isCompatible: boolean;
  reason?: string;
}

/**
 * Result of the full SVG processing pipeline
 */
export interface ProcessingResult {
  originalSvg: string;
  validationResult: ValidationResult;
  sanitizedSvg?: string;
  optimizedSvg?: string;
  animatableElements?: string[];
  animationCompatibility?: Record<AnimationType, CompatibilityResult>;
  error?: string;
  processingTime: number;
}

/**
 * Generate a fingerprint hash for SVG content
 * @param svg SVG content to hash
 * @returns A hash key for the SVG content
 */
function getSvgFingerprint(svg: string): string {
  // Use a simple but effective hash combining length and content samples
  const length = svg.length;
  const prefix = svg.substring(0, Math.min(50, length));
  const suffix = svg.substring(Math.max(0, length - 50));
  return `${prefix.length}:${length}:${suffix.length}`;
}

/**
 * Memoized SVG validation function
 */
export const validateSvgWithCache = createMemoizedFunction(
  validateSVG,
  { maxSize: CACHE_SIZES.VALIDATION }
);

/**
 * Memoized function to extract animatable elements from SVG
 */
export const extractElementsWithCache = createMemoizedFunction(
  (svg: string): ElementExtractionResult => ({ elements: extractAnimatableElements(svg) }),
  { maxSize: CACHE_SIZES.ELEMENT_EXTRACTION }
);

/**
 * Memoized function to check animation compatibility
 */
export const checkCompatibilityWithCache = createMemoizedFunction(
  (svg: string, animationType: AnimationType): CompatibilityResult => 
    checkAnimationCompatibility(svg, animationType),
  { 
    maxSize: CACHE_SIZES.COMPATIBILITY_CHECK,
    getKey: (svg, animationType) => `${getSvgFingerprint(svg)}:${animationType}`
  }
);

/**
 * Check compatibility with all animation types
 * @param svg SVG content to check
 * @returns Record mapping animation types to compatibility results
 */
export function checkAllAnimationCompatibility(svg: string): Record<AnimationType, CompatibilityResult> {
  const result: Record<AnimationType, CompatibilityResult> = {} as Record<AnimationType, CompatibilityResult>;
  
  // Check compatibility for each animation type
  Object.values(AnimationType).forEach(type => {
    result[type] = checkCompatibilityWithCache(svg, type);
  });
  
  return result;
}

/**
 * Full SVG processing pipeline with caching
 * @param svg Raw SVG content to process
 * @returns Processing result with all stages
 */
export const processSvgWithCache = createMemoizedFunction(
  (svg: string): ProcessingResult => {
    const startTime = Date.now();
    const processingId = `proc_${Math.random().toString(36).substring(2, 9)}`;
    
    logger.debug(`Starting SVG processing pipeline [${processingId}]`);
    
    // Initialize result object
    const result: ProcessingResult = {
      originalSvg: svg,
      validationResult: { isValid: false },
      processingTime: 0
    };
    
    try {
      // Validate SVG first
      result.validationResult = validateSvgWithCache(svg);
      
      if (!result.validationResult.isValid) {
        logger.warn(`SVG validation failed [${processingId}]: ${result.validationResult.error}`);
        result.error = `Validation failed: ${result.validationResult.error}`;
        result.processingTime = Date.now() - startTime;
        return result;
      }
      
      // If valid, proceed with sanitization
      try {
        result.sanitizedSvg = sanitizeSVG(svg);
      } catch (error) {
        const appError = handleError(error, {
          category: ErrorCategory.SVG,
          context: { processingId },
          rethrow: false
        });
        
        logger.error(`SVG sanitization failed [${processingId}]`, {
          error: appError.message,
          processingId
        });
        
        result.error = `Sanitization failed: ${appError.message}`;
        result.processingTime = Date.now() - startTime;
        return result;
      }
      
      // Proceed with optimization
      try {
        result.optimizedSvg = optimizeSVG(result.sanitizedSvg);
      } catch (error) {
        const appError = handleError(error, {
          category: ErrorCategory.SVG,
          context: { processingId },
          rethrow: false
        });
        
        logger.error(`SVG optimization failed [${processingId}]`, {
          error: appError.message,
          processingId
        });
        
        result.error = `Optimization failed: ${appError.message}`;
        result.processingTime = Date.now() - startTime;
        return result;
      }
      
      // Extract animatable elements
      const extractionResult = extractElementsWithCache(result.optimizedSvg);
      result.animatableElements = extractionResult.elements;
      
      // Check animation compatibility with all animation types
      result.animationCompatibility = checkAllAnimationCompatibility(result.optimizedSvg);
      
      logger.debug(`SVG processing pipeline completed successfully [${processingId}]`);
    } catch (error) {
      logger.error(`Unexpected error in SVG processing pipeline [${processingId}]`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processingId
      });
      
      result.error = `Processing failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      result.processingTime = Date.now() - startTime;
    }
    
    return result;
  },
  { 
    maxSize: CACHE_SIZES.PROCESS_FULL,
    getKey: getSvgFingerprint
  }
);

/**
 * Reset all SVG processing caches
 */
export function clearSvgProcessingCaches(): void {
  // This will clear the caches for all memoized functions
  // Note: createMemoizedFunction provides a clear() method on the returned function
  (validateSvgWithCache as any).clear();
  (extractElementsWithCache as any).clear();
  (checkCompatibilityWithCache as any).clear();
  (processSvgWithCache as any).clear();
  
  logger.info('All SVG processing caches cleared');
}