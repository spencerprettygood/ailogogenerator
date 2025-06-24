/**
 * CSS Animation Provider
 * 
 * This provider implements animations using CSS transitions and keyframes.
 * CSS animations are widely supported across browsers and provide good
 * performance for most common animation types.
 * 
 * Key features:
 * - Generates CSS keyframes for various animation types
 * - Applies CSS classes to SVG elements for animation
 * - Handles animation timing, easing, and delays
 * - Supports sequential animations with staggered delays
 */

import { 
  AnimationProvider, 
  AnimationType, 
  AnimationOptions, 
  AnimatedSVGLogo,
  AnimationEasing
} from '../types';
import { sanitizeSVG, optimizeSVGFromOptimizer as optimizeSVG, extractAnimatableElements } from '../utils';

/**
 * CSS Animation Provider
 * 
 * Implements the AnimationProvider interface using CSS animations.
 */
export class CSSAnimationProvider implements AnimationProvider {
  id = 'css';
  name = 'CSS Animation Provider';
  description = 'Provides animations using CSS transitions and keyframes';
  supportedAnimationTypes = [
    AnimationType.FADE_IN,
    AnimationType.FADE_IN_UP,
    AnimationType.FADE_IN_DOWN,
    AnimationType.FADE_IN_LEFT,
    AnimationType.FADE_IN_RIGHT,
    AnimationType.ZOOM_IN,
    AnimationType.ZOOM_OUT,
    AnimationType.SPIN,
    AnimationType.PULSE,
    AnimationType.FLOAT,
    AnimationType.BOUNCE,
    AnimationType.SHIMMER,
    AnimationType.SEQUENTIAL,
    AnimationType.DRAW,
    AnimationType.CUSTOM
  ];
  
  /**
   * Check if this provider supports the given animation type
   * 
   * @param type - The animation type to check
   * @returns Boolean indicating if the animation type is supported
   */
  supportsAnimationType(type: AnimationType): boolean {
    return this.supportedAnimationTypes.includes(type);
  }
  
  /**
   * Apply CSS animation to an SVG
   * 
   * @param svg - The SVG content to animate
   * @param options - Animation options
   * @returns Promise resolving to an AnimatedSVGLogo with the animated SVG and CSS
   */
  async animate(svg: string, options: AnimationOptions): Promise<AnimatedSVGLogo> {
    // Sanitize and optimize SVG first
    const cleanSvg = sanitizeSVG(svg);
    const optimizedSvg = optimizeSVG(cleanSvg);
    
    // Generate unique animation ID to avoid conflicts
    const animationId = `anim_${Math.random().toString(36).slice(2, 11)}`;
    
    // Determine which elements to animate
    let elementsToAnimate: string[] = [];
    
    if (options.elements && options.elements.length > 0) {
      // Use specified elements
      elementsToAnimate = options.elements;
    } else if (options.type === AnimationType.SEQUENTIAL) {
      // For sequential animations, try to use sequenceOrder or extract animatable elements
      elementsToAnimate = options.sequenceOrder || extractAnimatableElements(optimizedSvg);
    } else {
      // Default to animating the root SVG element
      elementsToAnimate = ['svg'];
    }
    
    // Apply animation classes to SVG
    const animatedSvg = this.applyAnimationClasses(optimizedSvg, elementsToAnimate, animationId);
    
    // Generate CSS for the animation
    const cssCode = this.generateCSSForAnimation(options, animationId, elementsToAnimate);
    
    return {
      originalSvg: svg,
      animatedSvg,
      cssCode,
      animationOptions: options
    };
  }
  
  /**
   * Apply CSS animation classes to SVG elements
   * 
   * @param svg - The SVG content
   * @param elements - Array of element selectors to animate
   * @param animationId - Unique ID for the animation
   * @returns SVG with animation classes applied
   */
  private applyAnimationClasses(svg: string, elements: string[], animationId: string): string {
    // If targeting the root SVG element
    if (elements.includes('svg') || elements.length === 0) {
      // Add class to the root SVG element
      return svg.replace(
        /(<svg[^>]*)>/,
        `$1 class="${animationId}">`
      );
    }
    
    // For server-side animation class application, we need to use regex
    // This is limited but works for simple cases
    let result = svg;
    
    // Apply animation classes to specified elements
    elements.forEach((selector, index) => {
      // For simple ID selectors
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        const regex = new RegExp(`(<[^>]*\\sid\\s*=\\s*["']${id}["'][^>]*)(\\s*class\\s*=\\s*["']([^"']*)["'])?([^>]*>)`, 'g');
        
        result = result.replace(regex, (match, before, classAttr, existingClasses, after) => {
          if (classAttr) {
            // Element already has a class attribute
            return `${before} class="${existingClasses} ${animationId}_${index}"${after}`;
          } else {
            // Element doesn't have a class attribute
            return `${before} class="${animationId}_${index}"${after}`;
          }
        });
      }
      // For tag selectors (like 'path', 'circle', etc.)
      else if (/^[a-z]+$/i.test(selector)) {
        const tag = selector;
        // This is simplistic and might affect unintended elements
        const regex = new RegExp(`(<${tag}[^>]*)(\\s*class\\s*=\\s*["']([^"']*)["'])?([^>]*>)`, 'g');
        
        result = result.replace(regex, (match, before, classAttr, existingClasses, after) => {
          if (classAttr) {
            return `${before} class="${existingClasses} ${animationId}_${index}"${after}`;
          } else {
            return `${before} class="${animationId}_${index}"${after}`;
          }
        });
      }
    });
    
    return result;
  }
  
  /**
   * Generate CSS for the animation
   * 
   * @param options - Animation options
   * @param animationId - Unique ID for the animation
   * @param elements - Array of element selectors to animate
   * @returns CSS code for the animation
   */
  private generateCSSForAnimation(
    options: AnimationOptions, 
    animationId: string,
    elements: string[]
  ): string {
    const { type, timing } = options;
    const duration = timing.duration || 1000;
    const delay = timing.delay || 0;
    const easing = timing.easing || AnimationEasing.EASE;
    const iterations = timing.iterations || 1;
    const iterationCount = iterations === Infinity ? 'infinite' : iterations;
    const direction = timing.direction || 'normal';
    
    let css = '';
    
    // Common animation properties
    const commonProps = `
    animation-duration: ${duration}ms;
    animation-timing-function: ${easing};
    animation-fill-mode: forwards;
    animation-delay: ${delay}ms;
    animation-iteration-count: ${iterationCount};
    animation-direction: ${direction};
    `;
    
    // Generate keyframes and animation styles based on animation type
    switch (type) {
      case AnimationType.FADE_IN:
        css += `
@keyframes ${animationId}_fade_in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;
        // If animating the root SVG
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} {
  opacity: 0;
  animation-name: ${animationId}_fade_in;
  ${commonProps}
}
`;
        } else {
          // For specific elements
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  opacity: 0;
  animation-name: ${animationId}_fade_in;
  ${commonProps}
}
`;
          });
        }
        break;
        
      case AnimationType.FADE_IN_UP:
        css += `
@keyframes ${animationId}_fade_in_up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} {
  opacity: 0;
  animation-name: ${animationId}_fade_in_up;
  ${commonProps}
}
`;
        } else {
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  opacity: 0;
  animation-name: ${animationId}_fade_in_up;
  ${commonProps}
}
`;
          });
        }
        break;
        
      case AnimationType.ZOOM_IN:
        css += `
@keyframes ${animationId}_zoom_in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} {
  opacity: 0;
  transform-origin: ${options.transformOrigin || 'center center'};
  animation-name: ${animationId}_zoom_in;
  ${commonProps}
}
`;
        } else {
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  opacity: 0;
  transform-origin: ${options.transformOrigin || 'center center'};
  animation-name: ${animationId}_zoom_in;
  ${commonProps}
}
`;
          });
        }
        break;
        
      case AnimationType.SPIN:
        css += `
@keyframes ${animationId}_spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} {
  transform-origin: ${options.transformOrigin || 'center center'};
  animation-name: ${animationId}_spin;
  ${commonProps}
}
`;
        } else {
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  transform-origin: ${options.transformOrigin || 'center center'};
  animation-name: ${animationId}_spin;
  ${commonProps}
}
`;
          });
        }
        break;
        
      case AnimationType.PULSE:
        css += `
@keyframes ${animationId}_pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} {
  transform-origin: ${options.transformOrigin || 'center center'};
  animation-name: ${animationId}_pulse;
  ${commonProps}
}
`;
        } else {
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  transform-origin: ${options.transformOrigin || 'center center'};
  animation-name: ${animationId}_pulse;
  ${commonProps}
}
`;
          });
        }
        break;
        
      case AnimationType.DRAW:
        // Path drawing animation using stroke-dasharray/dashoffset
        css += `
@keyframes ${animationId}_draw {
  to {
    stroke-dashoffset: 0;
  }
}
`;
        // For draw animations, we specifically target path elements
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation-name: ${animationId}_draw;
  ${commonProps}
}
`;
        } else {
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation-name: ${animationId}_draw;
  ${commonProps}
}
`;
          });
        }
        break;
        
      case AnimationType.SEQUENTIAL:
        // Sequential animation (elements appear one after another)
        const staggerDelay = options.stagger || 100; // Default 100ms between elements
        
        css += `
@keyframes ${animationId}_sequential {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;
        
        // Apply staggered delays to elements
        elements.forEach((_, index) => {
          const elementDelay = delay + (index * staggerDelay);
          css += `
.${animationId}_${index} {
  opacity: 0;
  animation-name: ${animationId}_sequential;
  animation-duration: ${duration}ms;
  animation-timing-function: ${easing};
  animation-fill-mode: forwards;
  animation-delay: ${elementDelay}ms;
  animation-iteration-count: ${iterationCount};
  animation-direction: ${direction};
}
`;
        });
        break;
        
      case AnimationType.CUSTOM:
        // Custom animation with user-provided keyframes
        if (options.customKeyframes) {
          css += `
@keyframes ${animationId}_custom {
  ${options.customKeyframes}
}
`;
          
          if (elements.includes('svg') || elements.length === 0) {
            css += `
.${animationId} {
  animation-name: ${animationId}_custom;
  ${commonProps}
}
`;
          } else {
            elements.forEach((_, index) => {
              css += `
.${animationId}_${index} {
  animation-name: ${animationId}_custom;
  ${commonProps}
}
`;
            });
          }
        }
        
        // Add any custom CSS if provided
        if (options.customCSS) {
          css += options.customCSS;
        }
        break;
        
      default:
        // Default fade-in animation for unsupported types
        css += `
@keyframes ${animationId}_default {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;
        
        if (elements.includes('svg') || elements.length === 0) {
          css += `
.${animationId} {
  opacity: 0;
  animation-name: ${animationId}_default;
  ${commonProps}
}
`;
        } else {
          elements.forEach((_, index) => {
            css += `
.${animationId}_${index} {
  opacity: 0;
  animation-name: ${animationId}_default;
  ${commonProps}
}
`;
          });
        }
        break;
    }
    
    return css;
  }
}