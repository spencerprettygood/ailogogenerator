import { AnimationOptions, AnimationResponse, AnimatedSVGLogo, AnimationType, AnimationEasing, AnimationTrigger } from './types';
import { SVGLogo } from '../types';

/**
 * Core service for applying animations to SVG logos
 */
export class SVGAnimationService {
  /**
   * Applies animation to an SVG logo based on the provided options
   * 
   * @param svg The SVG logo to animate
   * @param options Animation options
   * @returns AnimationResponse containing the animated SVG
   */
  public static async animateSVG(svg: string, options: AnimationOptions): Promise<AnimationResponse> {
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