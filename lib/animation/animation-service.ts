import { AnimationOptions, AnimationResponse, AnimatedSVGLogo, AnimationType, AnimationEasing, AnimationTrigger, AnimationProvider } from './types';
import { SVGLogo } from '../types';
import { AnimationRegistry } from './animation-registry';
import { getBestProviderForType, createAllProviders } from './providers';

/**
 * Core service for applying animations to SVG logos
 * 
 * The SVGAnimationService provides a centralized way to apply animations to SVG logos
 * using a provider-based architecture. It automatically selects the most appropriate
 * animation provider based on the requested animation type and browser support.
 * 
 * The service supports multiple animation technologies:
 * - SMIL: SVG's native animation capabilities
 * - CSS: Standard CSS animations and transitions
 * - JavaScript: Dynamic JS-based animations for complex effects
 * 
 * @example
 * ```typescript
 * // Apply a fade-in animation to an SVG
 * const result = await SVGAnimationService.animateSVG(svgContent, {
 *   type: AnimationType.FADE_IN,
 *   timing: {
 *     duration: 1000,
 *     easing: AnimationEasing.EASE_IN_OUT
 *   }
 * });
 * 
 * // Use the animated SVG and associated CSS/JS
 * const { animatedSvg, cssCode, jsCode } = result.result;
 * ```
 * 
 * @see {@link AnimationProvider} for details on individual providers
 * @see {@link AnimationOptions} for available animation options
 */
export class SVGAnimationService {
  /**
   * Animates an SVG using the appropriate provider based on the animation type
   * 
   * This method is the main entry point for the animation system. It:
   * 1. Registers all available animation providers if not already registered
   * 2. Finds the best provider for the requested animation type
   * 3. Uses the selected provider to apply the animation
   * 4. Falls back to built-in methods if no provider supports the animation type
   * 
   * @param svg - The SVG content to animate (as a string)
   * @param options - Animation configuration options
   * @returns Promise resolving to an AnimationResponse containing the animated SVG and any required CSS/JS
   * 
   * @throws Will throw an error if the animation process fails
   * 
   * @example
   * ```typescript
   * const animationResult = await SVGAnimationService.animateSVG(svgString, {
   *   type: AnimationType.DRAW,
   *   timing: {
   *     duration: 1500,
   *     easing: AnimationEasing.EASE_OUT
   *   }
   * });
   * ```
   */
  public static async animateSVG(svg: string, options: AnimationOptions): Promise<AnimationResponse> {
    const startTime = Date.now();
    
    try {
      // Ensure all providers are registered
      this.registerProviders();
      
      // Get the registry instance
      const registry = AnimationRegistry.getInstance();
      
      // Find a provider that supports the requested animation type
      let provider = registry.getDefaultProviderForType(options.type);
      
      // If no provider in registry, try to get the best provider based on browser capabilities
      if (!provider) {
        provider = getBestProviderForType(options.type);
      }
      
      // If still no provider supports this animation, use the built-in methods as fallback
      if (!provider) {
        console.warn(`No registered provider found for animation type ${options.type}. Using fallback.`);
        return this.animateSVGWithFallback(svg, options);
      }
      
      // Use the provider to animate the SVG
      const animatedLogo = await provider.animate(svg, options);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        result: animatedLogo,
        processingTime
      };
      
    } catch (error) {
      console.error('Error animating SVG:', error);
      return {
        success: false,
        error: {
          message: 'Failed to animate SVG',
          details: error instanceof Error ? error.message : String(error)
        },
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Fallback method to animate SVGs using built-in implementations
   * 
   * This method is used when no registered provider supports the requested animation type.
   * It implements basic versions of common animations directly within the service.
   * 
   * @param svg - The SVG content to animate
   * @param options - Animation configuration options
   * @returns Promise resolving to an AnimationResponse containing the animated SVG
   * 
   * @internal
   * This is a fallback method and should not be called directly.
   */
  private static async animateSVGWithFallback(svg: string, options: AnimationOptions): Promise<AnimationResponse> {
    const startTime = Date.now();
    
    try {
      // Parse the SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      
      // Apply animation based on animation type
      let animatedSvg = svg;
      let cssCode = '';
      let jsCode = '';
      
      switch (options.type) {
        case AnimationType.FADE_IN:
          ({ animatedSvg, cssCode } = this.applyFadeInAnimation(svg, options));
          break;
        case AnimationType.ZOOM_IN:
          ({ animatedSvg, cssCode } = this.applyZoomInAnimation(svg, options));
          break;
        case AnimationType.DRAW:
          ({ animatedSvg, cssCode } = this.applyDrawAnimation(svg, options));
          break;
        case AnimationType.SPIN:
          ({ animatedSvg, cssCode } = this.applySpinAnimation(svg, options));
          break;
        case AnimationType.SEQUENTIAL:
          ({ animatedSvg, cssCode } = this.applySequentialAnimation(svg, options));
          break;
        case AnimationType.MORPH:
          ({ animatedSvg, cssCode, jsCode } = this.applyMorphAnimation(svg, options));
          break;
        case AnimationType.CUSTOM:
          ({ animatedSvg, cssCode, jsCode } = this.applyCustomAnimation(svg, options));
          break;
        default:
          // Apply a default animation if type is not recognized
          ({ animatedSvg, cssCode } = this.applyFadeInAnimation(svg, options));
      }
      
      const result: AnimatedSVGLogo = {
        originalSvg: svg,
        animatedSvg,
        animationOptions: options,
        cssCode,
        jsCode
      };
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        result,
        processingTime
      };
      
    } catch (error) {
      console.error('Error animating SVG with fallback method:', error);
      return {
        success: false,
        error: {
          message: 'Failed to animate SVG with fallback method',
          details: error instanceof Error ? error.message : String(error)
        },
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Applies a fade-in animation to the SVG
   */
  private static applyFadeInAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string } {
    const { timing } = options;
    const uniqueId = this.generateUniqueId();
    
    // Add animation class to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in"`);
    
    // Generate CSS for the animation
    const cssCode = `
      .animated-svg.fade-in {
        opacity: 0;
        animation: fadeIn ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms forwards;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    
    return { animatedSvg, cssCode };
  }
  
  /**
   * Applies a zoom-in animation to the SVG
   */
  private static applyZoomInAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string } {
    const { timing } = options;
    const uniqueId = this.generateUniqueId();
    const transformOrigin = options.transformOrigin || 'center center';
    
    // Add animation class to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg zoom-in"`);
    
    // Generate CSS for the animation
    const cssCode = `
      .animated-svg.zoom-in {
        opacity: 0;
        transform: scale(0.5);
        transform-origin: ${transformOrigin};
        animation: zoomIn ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms forwards;
      }
      
      @keyframes zoomIn {
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
    
    return { animatedSvg, cssCode };
  }
  
  /**
   * Applies a drawing animation to the SVG paths
   */
  private static applyDrawAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string } {
    const { timing } = options;
    const uniqueId = this.generateUniqueId();
    
    // Add animation class to the SVG element
    let animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg draw-animation"`);
    
    // Add stroke-dasharray and stroke-dashoffset attributes to all path elements
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(animatedSvg, 'image/svg+xml');
    
    const paths = svgDoc.querySelectorAll('path');
    paths.forEach((path, index) => {
      path.classList.add('draw-path');
      path.setAttribute('data-index', index.toString());
    });
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate CSS for the animation
    const staggerDelay = options.stagger || 100;
    const cssCode = `
      .animated-svg.draw-animation .draw-path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        fill-opacity: 0;
      }
      
      ${Array.from(paths).map((_, index) => `
      .animated-svg.draw-animation .draw-path[data-index="${index}"] {
        animation: drawPath ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay + (index * staggerDelay)}ms forwards;
      }
      `).join('\n')}
      
      @keyframes drawPath {
        to {
          stroke-dashoffset: 0;
          fill-opacity: 1;
        }
      }
    `;
    
    return { animatedSvg, cssCode };
  }
  
  /**
   * Applies a spinning animation to the SVG
   */
  private static applySpinAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string } {
    const { timing } = options;
    const uniqueId = this.generateUniqueId();
    const transformOrigin = options.transformOrigin || 'center center';
    const iterations = timing.iterations || 1;
    
    // Add animation class to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg spin-animation"`);
    
    // Generate CSS for the animation
    const cssCode = `
      .animated-svg.spin-animation {
        transform-origin: ${transformOrigin};
        animation: spin ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${iterations === Infinity ? 'infinite' : iterations} ${timing.direction || 'normal'};
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    
    return { animatedSvg, cssCode };
  }
  
  /**
   * Applies a sequential animation to elements in the SVG
   */
  private static applySequentialAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string } {
    const { timing } = options;
    const uniqueId = this.generateUniqueId();
    const staggerDelay = options.stagger || 200;
    
    // Add animation class to the SVG element
    let animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg sequential-animation"`);
    
    // Parse the SVG to identify elements
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(animatedSvg, 'image/svg+xml');
    
    // Get elements to animate
    let elements: Element[] = [];
    if (options.sequenceOrder && options.sequenceOrder.length > 0) {
      // Animate elements in the specified order
      elements = options.sequenceOrder
        .map(id => svgDoc.getElementById(id))
        .filter(el => el !== null) as Element[];
    } else {
      // Animate all direct children of the SVG
      elements = Array.from(svgDoc.querySelector('svg')?.children || []);
    }
    
    // Add animation classes to elements
    elements.forEach((el, index) => {
      el.classList.add('sequential-item');
      el.setAttribute('data-index', index.toString());
    });
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate CSS for the animation
    const cssCode = `
      .animated-svg.sequential-animation .sequential-item {
        opacity: 0;
        transform: translateY(20px);
      }
      
      ${elements.map((_, index) => `
      .animated-svg.sequential-animation .sequential-item[data-index="${index}"] {
        animation: sequentialFadeIn ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay + (index * staggerDelay)}ms forwards;
      }
      `).join('\n')}
      
      @keyframes sequentialFadeIn {
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
    
    return { animatedSvg, cssCode };
  }
  
  /**
   * Applies a morphing animation to SVG paths (requires SMIL or JavaScript)
   */
  private static applyMorphAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string; jsCode: string } {
    const { timing } = options;
    const uniqueId = this.generateUniqueId();
    
    // Add animation class to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg morph-animation"`);
    
    // Generate CSS for styling
    const cssCode = `
      .animated-svg.morph-animation {
        /* Base styling for the morphing SVG */
      }
    `;
    
    // For morphing, we need JavaScript (GSAP or similar)
    const jsCode = `
      // This example uses GSAP MorphSVG plugin for morphing
      // Note: This requires the GSAP library and MorphSVG plugin to be loaded
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof gsap !== 'undefined' && gsap.plugins?.MorphSVG) {
          const svg = document.getElementById('${uniqueId}');
          const paths = svg.querySelectorAll('path');
          
          if (paths.length >= 2) {
            const firstPath = paths[0];
            const secondPath = paths[1];
            
            gsap.to(firstPath, {
              morphSVG: secondPath,
              duration: ${timing.duration / 1000},
              delay: ${(timing.delay || 0) / 1000},
              ease: "${timing.easing || 'power2.inOut'}",
              yoyo: true,
              repeat: ${timing.iterations === Infinity ? -1 : (timing.iterations || 1) - 1}
            });
          }
        } else {
          console.warn('GSAP or MorphSVG plugin not loaded. Morphing animation will not work.');
        }
      });
    `;
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Applies a custom animation using provided keyframes and CSS
   */
  private static applyCustomAnimation(svg: string, options: AnimationOptions): { animatedSvg: string; cssCode: string; jsCode: string } {
    const uniqueId = this.generateUniqueId();
    
    // Add animation class to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg custom-animation"`);
    
    // Use custom CSS if provided, otherwise use a simple fade-in
    const cssCode = options.customCSS || `
      .animated-svg.custom-animation {
        animation: customAnimation ${options.timing.duration}ms ${options.timing.easing || AnimationEasing.EASE} ${options.timing.delay || 0}ms forwards;
      }
      
      @keyframes customAnimation {
        ${options.customKeyframes || `
        from { opacity: 0; }
        to { opacity: 1; }
        `}
      }
    `;
    
    // Custom JS code if provided
    const jsCode = options.jsCode || '';
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Generates a unique ID for the animated SVG
   */
  private static generateUniqueId(): string {
    return `animated-svg-${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Predefined animation templates that users can select from
 */

  /**
   * Register all available animation providers
   */
  private static registerProviders() {
    const registry = AnimationRegistry.getInstance();
    
    // Only register providers if the registry is empty
    if (registry.getAllProviders().length === 0) {
      // Create all providers and register them
      const providers = createAllProviders();
      providers.forEach(provider => {
        registry.registerProvider(provider);
      });
    }
  }

  /**
   * Validate SVG before animation to ensure it's well-formed
   * @param svg The SVG to validate
   * @returns Validated SVG or throws an error if invalid
   */
  private static validateSVG(svg: string): string {
    try {
      // Simple validation to ensure the SVG is well-formed
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      
      // Check for parsing errors
      const parserErrors = doc.getElementsByTagName('parsererror');
      if (parserErrors.length > 0) {
        throw new Error('Invalid SVG: Document contains parser errors');
      }
      
      // Check that it has an SVG root element
      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        throw new Error('Invalid SVG: Missing root <svg> element');
      }
      
      // Ensure it has viewBox or width/height
      if (!svgElement.hasAttribute('viewBox') && 
          (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height'))) {
        console.warn('SVG is missing viewBox or width/height attributes');
        // Add a default viewBox if needed
        svgElement.setAttribute('viewBox', '0 0 300 300');
      }
      
      // Return the validated (and potentially fixed) SVG
      return new XMLSerializer().serializeToString(doc);
    } catch (error) {
      console.error('SVG validation failed:', error);
      throw error;
    }
  }
  
  /**
   * Optimize SVG for animation by removing unnecessary attributes and elements
   * @param svg The SVG to optimize
   * @returns Optimized SVG
   */
  private static optimizeSVG(svg: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      
      // Remove comments
      const iterator = document.createNodeIterator(
        doc, 
        NodeFilter.SHOW_COMMENT, 
        { acceptNode: () => NodeFilter.FILTER_ACCEPT }
      );
      
      let node;
      while (node = iterator.nextNode()) {
        node.parentNode?.removeChild(node);
      }
      
      // Remove empty groups
      const emptyGroups = doc.querySelectorAll('g:empty');
      emptyGroups.forEach(group => group.parentNode?.removeChild(group));
      
      // Remove unnecessary attributes from all elements
      const allElements = doc.querySelectorAll('*');
      const unnecessaryAttrs = [
        'data-name', 'data-old-color', 'data-original', 
        'xmlns:xlink', 'xml:space', 'enable-background'
      ];
      
      allElements.forEach(el => {
        unnecessaryAttrs.forEach(attr => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
          }
        });
      });
      
      return new XMLSerializer().serializeToString(doc);
    } catch (error) {
      console.warn('SVG optimization failed, returning original:', error);
      return svg;
    }
  }
}

export const animationTemplates = [
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'Simple fade-in animation',
    defaultOptions: {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      },
      trigger: AnimationTrigger.LOAD
    },
    compatibleWithLayers: true,
    compatibleWithText: true
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Logo scales up from the center',
    defaultOptions: {
      type: AnimationType.ZOOM_IN,
      timing: {
        duration: 1200,
        easing: AnimationEasing.EASE_OUT
      },
      trigger: AnimationTrigger.LOAD
    },
    compatibleWithLayers: true,
    compatibleWithText: true
  },
  {
    id: 'draw',
    name: 'Draw Effect',
    description: 'Animated line drawing effect',
    defaultOptions: {
      type: AnimationType.DRAW,
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT
      },
      trigger: AnimationTrigger.LOAD
    },
    compatibleWithLayers: true,
    compatibleWithText: false
  },
  {
    id: 'spin',
    name: 'Spin',
    description: 'Logo spins around its center',
    defaultOptions: {
      type: AnimationType.SPIN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1
      },
      trigger: AnimationTrigger.LOAD
    },
    compatibleWithLayers: true,
    compatibleWithText: true
  },
  {
    id: 'sequential',
    name: 'Sequential Reveal',
    description: 'Elements appear one after another',
    defaultOptions: {
      type: AnimationType.SEQUENTIAL,
      timing: {
        duration: 800,
        easing: AnimationEasing.EASE_OUT
      },
      stagger: 200,
      trigger: AnimationTrigger.LOAD
    },
    compatibleWithLayers: true,
    compatibleWithText: true
  },
  {
    id: 'morph',
    name: 'Morph',
    description: 'Elements morph from one shape to another',
    defaultOptions: {
      type: AnimationType.MORPH,
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1
      },
      trigger: AnimationTrigger.LOAD
    },
    compatibleWithLayers: false,
    compatibleWithText: false
  },
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Logo bounces into view',
    defaultOptions: {
      type: AnimationType.CUSTOM,
      timing: {
        duration: 1000,
        easing: AnimationEasing.BOUNCE,
        iterations: 1
      },
      trigger: AnimationTrigger.LOAD,
      customKeyframes: `
        0% { transform: translateY(-50px); opacity: 0; }
        60% { transform: translateY(10px); opacity: 1; }
        80% { transform: translateY(-5px); }
        100% { transform: translateY(0); }
      `
    },
    compatibleWithLayers: true,
    compatibleWithText: true
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Logo pulses in and out',
    defaultOptions: {
      type: AnimationType.CUSTOM,
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: Infinity
      },
      trigger: AnimationTrigger.LOAD,
      customKeyframes: `
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      `
    },
    compatibleWithLayers: true,
    compatibleWithText: true
  }
];