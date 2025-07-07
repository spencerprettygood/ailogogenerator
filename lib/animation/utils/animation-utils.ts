/**
 * Animation utility functions
 */
import { AnimationType, AnimationOptions, AnimationEasing, AnimationTrigger } from '../types';

/**
 * Represents the result of an SVG optimization operation.
 */
export interface SVGOptimizationResult {
  svg: string;
  isOptimized: boolean;
  modifications: string[];
  errors: string[];
}

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
        easing: AnimationEasing.EASE_IN_OUT,
      },
      trigger: AnimationTrigger.LOAD,
    },
    [AnimationType.ZOOM_IN]: {
      timing: {
        duration: 1200,
        easing: AnimationEasing.EASE_OUT,
      },
      trigger: AnimationTrigger.LOAD,
      transformOrigin: 'center',
    },
    [AnimationType.DRAW]: {
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT,
      },
      trigger: AnimationTrigger.LOAD,
    },
    [AnimationType.SPIN]: {
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
      transformOrigin: 'center',
    },
    [AnimationType.PULSE]: {
      timing: {
        duration: 1500,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: Infinity,
      },
      trigger: AnimationTrigger.LOAD,
    },
    [AnimationType.CUSTOM]: {
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      },
      trigger: AnimationTrigger.LOAD,
      customKeyframes: `
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      `,
    },
  };

  // Set defaults for other animation types
  const fallbackOptions = {
    timing: {
      duration: 1000,
      easing: AnimationEasing.EASE_IN_OUT,
    },
    trigger: AnimationTrigger.LOAD,
  };

  return {
    type,
    ...(defaultOptions[type] || fallbackOptions),
    timing: {
      duration: 1000,
      easing: AnimationEasing.EASE_IN_OUT,
      iterations: 1, // Default to 1 iteration
      ...(defaultOptions[type]?.timing || {}),
    },
  } as AnimationOptions;
}

/**
 * Check if the browser supports a specific animation feature
 * @param feature Feature to check
 * @returns Boolean indicating if the feature is supported
 */
export function isBrowserSupported(
  feature: 'css-animations' | 'smil' | 'web-animations-api'
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false; // Server-side rendering
  }

  switch (feature) {
    case 'css-animations':
      return (
        'animation' in document.documentElement.style ||
        'webkitAnimation' in document.documentElement.style
      );

    case 'smil':
      // A more reliable check for SMIL is to see if animation elements have the beginElement method.
      return (
        typeof (document.createElementNS('http://www.w3.org/2000/svg', 'animate') as any)
          .beginElement === 'function'
      );

    case 'web-animations-api':
      return typeof Element.prototype.animate === 'function';

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
    root: doc.querySelector('svg'),
  };
}

/**
 * Generate CSS animation keyframes for a given animation type
 * @param type Animation type
 * @param options Animation options
 * @returns CSS keyframes string
 */
export function generateKeyframes(
  type: AnimationType,
  options?: Partial<AnimationOptions>
): string {
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
      return (
        options?.customKeyframes ||
        `
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      `
      );

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
export function generateBrowserCompatibilityCheck(type: 'css' | 'smil' | 'web-animations'): string {
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
    parts.push(
      options.iterations === Infinity || options.iterations === 'infinite'
        ? 'infinite'
        : `${options.iterations}`
    );
  }
  if (options.direction) parts.push(options.direction);

  return parts.join(' ');
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
    dur: `${options.duration / 1000}s`,
    fill: 'freeze',
  };
  if (options.delay) attrs.begin = `${options.delay / 1000}s`;
  if (options.iterations !== undefined) {
    attrs.repeatCount =
      options.iterations === Infinity || options.iterations === 'infinite'
        ? 'indefinite'
        : `${options.iterations}`;
  }

  const easingMap: Partial<Record<AnimationEasing, { calcMode: string; keySplines?: string }>> = {
    [AnimationEasing.EASE_IN]: { calcMode: 'spline', keySplines: '0.42 0 1 1' },
    [AnimationEasing.EASE_OUT]: { calcMode: 'spline', keySplines: '0 0 0.58 1' },
    [AnimationEasing.EASE_IN_OUT]: { calcMode: 'spline', keySplines: '0.42 0 0.58 1' },
    [AnimationEasing.LINEAR]: { calcMode: 'linear' },
    [AnimationEasing.BOUNCE]: { calcMode: 'spline', keySplines: '0.68 -0.55 0.265 1.55' },
    [AnimationEasing.ELASTIC]: { calcMode: 'spline', keySplines: '.5,2.5,.7,.7' },
  };

  const smilEasing = easingMap[options.easing as AnimationEasing];

  if (smilEasing) {
    attrs.calcMode = smilEasing.calcMode;
    if (smilEasing.keySplines) {
      attrs.keySplines = smilEasing.keySplines;
    }
  } else {
    // Fallback for custom cubic-bezier or other values
    attrs.calcMode = 'linear';
  }

  return attrs;
}

/**
 * Optimize SVG for animation by ensuring proper structure and adding IDs.
 * @param svg SVG content to optimize
 * @returns An object containing the optimized SVG and details of the operation.
 */
export function optimizeSVGForAnimation(svg: string): SVGOptimizationResult {
  const result: SVGOptimizationResult = {
    svg,
    isOptimized: false,
    modifications: [],
    errors: [],
  };

  if (typeof window === 'undefined') {
    result.errors.push('DOM environment not available (e.g., server-side rendering).');
    return result;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    // Check for parsing errors
    if (doc.querySelector('parsererror')) {
      result.errors.push('Invalid SVG: parsererror found in document');
      return result;
    }

    // 1. Add IDs to elements that don't have them
    const elementsToId = Array.from(
      doc.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, g, text')
    );
    let addedIdsCount = 0;
    elementsToId.forEach(el => {
      if (!el.id) {
        el.id = generateAnimationId();
        addedIdsCount++;
      }
    });
    if (addedIdsCount > 0) {
      result.modifications.push(`Added IDs to ${addedIdsCount} elements`);
    }

    // 2. Ensure stroke-width on elements with stroke
    const elementsWithStroke = Array.from(
      doc.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')
    );
    let addedStrokeWidthCount = 0;
    elementsWithStroke.forEach(el => {
      if (el.getAttribute('stroke') && !el.getAttribute('stroke-width')) {
        el.setAttribute('stroke-width', '1'); // Default stroke-width
        addedStrokeWidthCount++;
      }
    });
    if (addedStrokeWidthCount > 0) {
      result.modifications.push(`Added missing stroke-width to ${addedStrokeWidthCount} elements`);
    }

    const serializer = new XMLSerializer();
    result.svg = serializer.serializeToString(doc.documentElement);
    result.isOptimized = true;
  } catch (e: any) {
    result.errors.push(`An unexpected error occurred: ${e.message}`);
  }

  return result;
}

/**
 * Extract animatable elements from SVG based on animation type.
 * @param svg SVG content to analyze
 * @param animationType The type of animation to be applied.
 * @returns Array of elements that can be animated.
 */
export function extractAnimatableElements(svg: string, animationType: AnimationType): Element[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) {
    return [];
  }

  switch (animationType) {
    case AnimationType.DRAW:
      return Array.from(doc.querySelectorAll('path'));
    case AnimationType.SEQUENTIAL:
      return Array.from(svgElement.children);
    case AnimationType.FADE_IN:
    case AnimationType.ZOOM_IN:
    case AnimationType.SPIN:
    case AnimationType.PULSE:
      return [svgElement];
    default:
      return [];
  }
}
