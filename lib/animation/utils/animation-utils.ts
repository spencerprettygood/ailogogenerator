/**
 * Animation utility functions
 */
import { AnimationType, AnimationOptions, AnimationEasing, AnimationTrigger } from '../types';

/**
 * Generate a unique ID for animation elements
 * @returns A unique string ID
 */
export function generateAnimationId(): string {
  return `anim-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a default animation options object
 * @param type Animation type
 * @returns Default animation options
 */
export function createDefaultAnimationOptions(type: AnimationType): AnimationOptions {
  // Only specify defaults for a subset of AnimationType - use Partial to avoid exhaustive key requirement
  const defaultOptions: Partial<Record<AnimationType, Partial<AnimationOptions>>> = {
    [AnimationType.FADE_IN]: {
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      },
      trigger: AnimationTrigger.LOAD
    },
    [AnimationType.ZOOM_IN]: {
      timing: {
        duration: 1200,
        easing: AnimationEasing.EASE_OUT
      },
      trigger: AnimationTrigger.LOAD,
      transformOrigin: 'center'
    },
    [AnimationType.DRAW]: {
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT
      },
      trigger: AnimationTrigger.LOAD
    },
    [AnimationType.SPIN]: {
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1
      },
      trigger: AnimationTrigger.LOAD,
      transformOrigin: 'center'
    },
    [AnimationType.PULSE]: {
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: Infinity
      },
      trigger: AnimationTrigger.LOAD
    },
    [AnimationType.CUSTOM]: {
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      },
      trigger: AnimationTrigger.LOAD,
      customKeyframes: `
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      `
    }
  };
  
  // Set defaults for other animation types
  const fallbackOptions = {
    timing: {
      duration: 1000,
      easing: AnimationEasing.EASE_IN_OUT
    },
    trigger: AnimationTrigger.LOAD
  };
  
  return {
    type,
    ...(defaultOptions[type] || fallbackOptions),
    timing: {
      duration: 1000,
      easing: AnimationEasing.EASE_IN_OUT,
      ...(defaultOptions[type]?.timing || {})
    }
  } as AnimationOptions;
}

/**
 * Check if the browser supports a specific animation feature
 * @param feature Feature to check
 * @returns Boolean indicating if the feature is supported
 */
export function isBrowserSupported(feature: 'css-animations' | 'smil' | 'web-animations-api'): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering
  }
  
  switch (feature) {
    case 'css-animations':
      return 'animation' in document.documentElement.style || 
             'webkitAnimation' in document.documentElement.style;
      
    case 'smil':
      // Check if SMIL is supported
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      return !!svgElement && 'animate' in svgElement;
      
    case 'web-animations-api':
      return 'animate' in Element.prototype;
      
    default:
      return false;
  }
}

/**
 * Parse SVG and extract paths, shapes, and other elements
 * @param svgString SVG content string
 * @returns Object containing parsed SVG elements
 */
export function parseSVGElements(svgString: string): {
  paths: Element[];
  shapes: Element[];
  groups: Element[];
  root: Element | null;
} {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return { paths: [], shapes: [], groups: [], root: null };
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  
  return {
    paths: Array.from(doc.querySelectorAll('path')),
    shapes: Array.from(doc.querySelectorAll('rect, circle, ellipse, polygon, polyline')),
    groups: Array.from(doc.querySelectorAll('g')),
    root: doc.querySelector('svg')
  };
}

/**
 * Generate CSS animation keyframes for a given animation type
 * @param type Animation type
 * @param options Animation options
 * @returns CSS keyframes string
 */
export function generateKeyframes(type: AnimationType, options?: Partial<AnimationOptions>): string {
  switch (type) {
    case AnimationType.FADE_IN:
      return `
        0% { opacity: 0; }
        100% { opacity: 1; }
      `;
      
    case AnimationType.ZOOM_IN:
      return `
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
      `;
      
    case AnimationType.SPIN:
      return `
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      `;
      
    case AnimationType.PULSE:
      return `
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      `;
      
    case AnimationType.CUSTOM:
      return options?.customKeyframes || `
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      `;
      
    default:
      return `
        0% { opacity: 0; }
        100% { opacity: 1; }
      `;
  }
}

/**
 * Detect support for various animation features
 */
export function detectAnimationSupport(): { css: boolean; smil: boolean; webAnimations: boolean } {
  return {
    css: isBrowserSupported('css-animations'),
    smil: isBrowserSupported('smil'),
    webAnimations: isBrowserSupported('web-animations-api'),
  };
}

/**
 * Generate JS code snippet to check browser compatibility for an animation type
 */
export function generateBrowserCompatibilityCheck(
  type: 'css' | 'smil' | 'web-animations'
): string {
  switch (type) {
    case 'css':
      return `
        function checkCSS() {
          return (
            'animation' in document.documentElement.style ||
            'webkitAnimation' in document.documentElement.style ||
            'MozAnimation' in document.documentElement.style ||
            'OAnimation' in document.documentElement.style
          );
        }
      `;
    case 'smil':
      return `
        function checkSMIL() {
          var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
          return !!svg && 'animate' in svg && svg.createElementNS;
        }
      `;
    case 'web-animations':
      return `
        function checkWebAnimations() {
          return 'animate' in Element.prototype;
        }
      `;
    default:
      return '';
  }
}

/**
 * Convert timing options to CSS animation shorthand
 */
export function convertTimingToCSS(options: {
  duration: number;
  delay?: number;
  easing: AnimationEasing | string;
  iterations?: number | 'infinite' | undefined;
  direction?: string;
}): string {
  const parts: string[] = [];
  parts.push(`${options.duration}ms`);
  if (options.delay) parts.push(`${options.delay}ms`);
  parts.push(`${options.easing}`);
  if (options.iterations !== undefined) {
    parts.push(options.iterations === Infinity || options.iterations === 'infinite' ? 'infinite' : `${options.iterations}`);
  }
  if (options.direction) parts.push(options.direction);
  return `animation: ${parts.join(' ')};`;
}

/**
 * Convert timing options to SMIL animation attributes
 */
export function convertTimingToSMIL(options: {
  duration: number;
  delay?: number;
  easing: AnimationEasing | string;
  iterations?: number | 'infinite' | undefined;
}): Record<string, string> {
  const attrs: Record<string, string> = {
    dur: `${options.duration}ms`,
    fill: 'freeze',
  };
  if (options.delay) attrs.begin = `${options.delay}ms`;
  if (options.iterations !== undefined) {
    attrs.repeatCount =
      options.iterations === Infinity || options.iterations === 'infinite'
        ? 'indefinite'
        : `${options.iterations}`;
  }
  // Only add calcMode for non-linear easing
  if (options.easing !== AnimationEasing.LINEAR && options.easing !== 'linear') {
    attrs.calcMode = 'paced';
  }
  return attrs;
}

/**
 * Optimize SVG for animation by ensuring proper structure
 * @param svg SVG content to optimize
 * @returns Optimized SVG content
 */
export function optimizeSVGForAnimation(svg: string): string {
  // Add IDs to elements that don't have them
  let optimized = svg;
  
  // Find elements without IDs and add them
  const elementsWithoutIds = svg.match(/<(path|circle|rect|ellipse|line|polygon|polyline|text|g)[^>]*(?!id=)[^>]*>/g);
  
  if (elementsWithoutIds) {
    elementsWithoutIds.forEach((element, index) => {
      const id = `elem-${index + 1}`;
      const elementWithId = element.replace(/<(\w+)/, `<$1 id="${id}"`);
      optimized = optimized.replace(element, elementWithId);
    });
  }
  
  return optimized;
}

/**
 * Extract animatable elements from SVG
 * @param svg SVG content to analyze
 * @returns Array of element IDs that can be animated
 */
export function extractAnimatableElements(svg: string): string[] {
  const matches = svg.match(/id="([^"]+)"/g);
  return matches ? matches.map(m => m.replace(/id="|"/g, '')) : [];
}