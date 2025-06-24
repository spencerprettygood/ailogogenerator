/**
 * Animation Utilities Index
 * 
 * This file exports all utility functions related to SVG animation.
 * Centralizing exports here makes imports cleaner in other modules.
 */

export * from './animation-utils';
export { optimizeSVG as optimizeSVGFromSanitizer, sanitizeSVG, validateSVG, prepareSVGForAnimation, extractAnimatableElements, checkAnimationCompatibility } from './svg-sanitizer';
export { optimizeSVG as optimizeSVGFromOptimizer, validateSVGForAnimation } from './svg-optimizer';