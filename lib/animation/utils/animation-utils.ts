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
  const defaultOptions: Record<AnimationType, Partial<AnimationOptions>> = {
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