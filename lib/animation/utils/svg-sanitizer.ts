// Compatibility: Provide isAnimatable and sanitizeSVGForAnimation for legacy/test imports
/**
 * Checks if an SVG is animatable (simple heuristic: must have at least one animatable element)
 */
export function isAnimatable(svgContent: string): { animatable: boolean; complexity: 'simple' | 'moderate' | 'complex'; issues: string[] } {
  // Heuristic: SVG is animatable if it has at least one path, circle, rect, polygon, or text
  const animatableTags = ['path', 'circle', 'rect', 'polygon', 'text'];
  const issues: string[] = [];
  let count = 0;
  for (const tag of animatableTags) {
    const matches = svgContent.match(new RegExp(`<${tag}[^>]*>`, 'gi'));
    if (matches) count += matches.length;
  }
  if (count === 0) {
    issues.push('No animatable elements found');
  }
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (count > 10) complexity = 'moderate';
  if (count > 50) complexity = 'complex';
  return { animatable: count > 0, complexity, issues };
}

/**
 * Sanitizes SVG for animation (alias for sanitizeSVG)
 */
export function sanitizeSVGForAnimation(svgContent: string): { svg: string; isModified: boolean; modifications: string[]; errors: string[]; warnings: string[] } {
  try {
    const sanitized = sanitizeSVG(svgContent);
    return {
      svg: sanitized,
      isModified: sanitized !== svgContent,
      modifications: sanitized !== svgContent ? ['Sanitized for animation'] : [],
      errors: [],
      warnings: []
    };
  } catch (e) {
    return {
      svg: svgContent,
      isModified: false,
      modifications: [],
      errors: [e instanceof Error ? e.message : String(e)],
      warnings: []
    };
  }
}
/**
 * SVG Sanitizer and Optimizer
 * 
 * This module provides utilities for sanitizing and optimizing SVGs for animation.
 * It ensures that SVGs are valid, safe, and properly structured for animation.
 * 
 * Key functions:
 * - sanitizeSVG: Removes potentially harmful elements and attributes
 * - optimizeSVG: Optimizes SVG structure for better animation performance
 * - validateSVG: Validates SVG structure and content
 * - prepareSVGForAnimation: Prepares SVG specifically for animation
 */
import { createMemoizedFunction } from '../../utils/cache-manager';

/**
 * Security configuration for SVG sanitization
 */
const SECURITY_CONFIG = {
  // Potentially harmful elements that should be removed
  disallowedElements: [
    'script',
    'foreignObject',
    'iframe',
    'video',
    'audio',
    'embed',
    'object',
    'use', // Potentially dangerous for referencing external content
    'animate', // We'll handle animations ourselves
    'set', // SMIL animation we'll handle
    'handler' // Can contain scripts
  ],
  
  // Potentially harmful attributes that should be removed
  disallowedAttributes: [
    // Event handlers
    'onload', 'onerror', 'onabort', 'onfocus', 'onblur', 'onchange',
    'onclick', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover',
    'onmouseup', 'onkeydown', 'onkeypress', 'onkeyup', 'onunload',
    'onscroll', 'onresize', 'onactivate', 'onbegin', 'onend', 'onrepeat',
    
    // Potentially harmful protocols and attributes
    'javascript:', 'data:', 'vbscript:', 'xlink:href', 'href',
    'formaction', 'action', 'content', 'poster', 'srcset',
    
    // Eval-related
    'style', // We'll handle styles via classes
    'externalResourcesRequired'
  ],
  
  // Maximum SVG size allowed (in bytes)
  maxSvgSize: 1024 * 500, // 500KB
  
  // Allowed SVG elements (whitelist approach)
  allowedElements: [
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
    'polygon', 'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern', 
    'linearGradient', 'radialGradient', 'stop', 'filter', 'feGaussianBlur',
    'feOffset', 'feBlend', 'feColorMatrix', 'feComponentTransfer',
    'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
    'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG',
    'feFuncR', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'fePointLight',
    'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'title', 'desc'
  ],
  
  // Allowed SVG attributes (whitelist approach)
  allowedAttributes: [
    'id', 'class', 'viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
    'd', 'points', 'transform', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 
    'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 
    'stroke-dasharray', 'stroke-dashoffset', 'font-family', 'font-size', 
    'font-weight', 'text-anchor', 'opacity', 'filter', 'clip-path', 'clip-rule',
    'mask', 'visibility', 'dominant-baseline', 'stop-color', 'stop-opacity',
    'offset', 'gradientTransform', 'gradientUnits', 'patternTransform',
    'patternUnits', 'preserveAspectRatio', 'xmlns', 'version', 'x1', 'y1', 'x2', 'y2'
  ]
};

// Cache size for sanitization function
const SANITIZATION_CACHE_SIZE = 100;

/**
 * Create a hash key for caching sanitized SVG
 * @param svgContent SVG content to hash
 * @returns A hash key for the SVG content
 */
function getSanitizationHashKey(svgContent: string): string {
  const length = svgContent.length;
  const prefix = svgContent.substring(0, 40);
  const suffix = svgContent.substring(Math.max(0, length - 40));
  return `${length}:${prefix}:${suffix}`;
}

/**
 * Internal sanitization function that does the actual work
 * @param svgContent The SVG content to sanitize
 * @returns Sanitized SVG content
 */
function _sanitizeSVG(svgContent: string): string {
  // Check SVG size
  if (svgContent.length > SECURITY_CONFIG.maxSvgSize) {
    console.warn(`SVG size exceeds maximum allowed size (${SECURITY_CONFIG.maxSvgSize} bytes)`);
  }
  
  // If DOMParser is available, use DOM-based sanitization for better accuracy
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      // Check for parsing errors
      const parserErrors = doc.querySelector('parsererror');
      if (parserErrors) {
        console.warn('SVG parsing error, falling back to regex sanitization');
        return regexSanitize(svgContent);
      }
      
      // Remove disallowed elements
      SECURITY_CONFIG.disallowedElements.forEach(tagName => {
        const elements = doc.getElementsByTagName(tagName);
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i];
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }
      });
      
      // Remove disallowed attributes from all elements
      const allElements = doc.querySelectorAll('*');
      allElements.forEach(el => {
        for (let i = el.attributes.length - 1; i >= 0; i--) {
          const attr = el.attributes[i];
          if (!attr) continue;
          const attrName = attr.name.toLowerCase();
          
          // Check if attribute contains disallowed strings
          let isDisallowed = SECURITY_CONFIG.disallowedAttributes.some(badAttr => 
            attrName === badAttr || 
            attrName.startsWith(badAttr) || 
            attr.value.includes(badAttr)
          );
          
          // Use whitelist approach for extra security
          if (isDisallowed || !SECURITY_CONFIG.allowedAttributes.includes(attrName)) {
            el.removeAttribute(attr.name);
          }
        }
      });
      
      // Verify only allowed elements remain, remove others
      const walkNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const tagName = el.tagName.toLowerCase();
          
          // If not in allowed list, remove the element
          if (!SECURITY_CONFIG.allowedElements.includes(tagName)) {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              return; // Don't process removed element's children
            }
          }
        }
        
        // Process children (in reverse to safely remove them)
        const children = Array.from(node.childNodes);
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (child) {
            walkNode(child);
          }
        }
      };
      
      walkNode(doc.documentElement);
      
      // Ensure SVG is the root element
      const rootElement = doc.documentElement;
      if (rootElement.tagName.toLowerCase() !== 'svg') {
        throw new Error('Root element is not SVG');
      }
      
      return new XMLSerializer().serializeToString(doc);
    } catch (error) {
      console.warn('DOM-based sanitization failed, falling back to regex:', error);
      return regexSanitize(svgContent);
    }
  } else {
    // For server-side or environments without DOM
    return regexSanitize(svgContent);
  }
}

/**
 * Sanitization using regex for server-side compatibility
 * 
 * @param svgContent - The SVG content to sanitize
 * @returns Sanitized SVG content
 */
function regexSanitize(svgContent: string): string {
  let sanitized = svgContent;
  
  // Initial check: ensure it starts with an SVG tag
  if (!sanitized.match(/<svg[^>]*>/i)) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';
  }
  
  // Remove disallowed elements - more robust pattern
  SECURITY_CONFIG.disallowedElements.forEach(element => {
    // Handle elements with content
    const regex = new RegExp(`<${element}[^>]*>.*?<\\/${element}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    
    // Handle self-closing elements
    const selfClosingRegex = new RegExp(`<${element}[^>]*\\/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
    
    // Handle unclosed elements (safety cleanup)
    const unclosedRegex = new RegExp(`<${element}[^>]*>`, 'gi');
    sanitized = sanitized.replace(unclosedRegex, '');
  });
  
  // Remove disallowed attributes
  SECURITY_CONFIG.disallowedAttributes.forEach(attr => {
    // Match attributes in the form name="value" or name='value'
    const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*(['"])(.*?)\\1`, 'gi');
    sanitized = sanitized.replace(attrRegex, '');
    
    // Match attributes without quotes
    const attrNoQuotesRegex = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]+`, 'gi');
    sanitized = sanitized.replace(attrNoQuotesRegex, '');
    
    // Also check for inline event handlers without equals sign (e.g., onclick="...")
    if (attr.startsWith('on')) {
      const eventRegex = new RegExp(`\\s${attr}\\s*`, 'gi');
      sanitized = sanitized.replace(eventRegex, ' ');
    }
  });
  
  // Additional security: remove all attributes containing "javascript:"
  sanitized = sanitized.replace(/\s+\w+\s*=\s*["']?[^"'>\s]*javascript:[^"'>\s]*["']?/gi, '');
  
  // Additional security: remove all attributes containing "data:"
  sanitized = sanitized.replace(/\s+\w+\s*=\s*["']?[^"'>\s]*data:[^"'>\s]*["']?/gi, '');
  
  // Clean up duplicate whitespace
  sanitized = sanitized.replace(/\s{2,}/g, ' ');
  
  return sanitized;
}

/**
 * Memoized version of the sanitization function
 * Creates a cached function that remembers results for recent inputs
 */
export const sanitizeSVG = createMemoizedFunction(_sanitizeSVG, {
  maxSize: SANITIZATION_CACHE_SIZE,
  getKey: getSanitizationHashKey
});

/**
 * Optimize SVG for animation performance
 * 
 * @param svgContent - The SVG content to optimize
 * @returns Optimized SVG content
 */
export function optimizeSVG(svgContent: string): string {
  // For now, just ensure the SVG has an ID attribute on the root element
  // This will be expanded with more optimizations in the future
  
  let optimized = svgContent;
  
  // Ensure SVG has viewBox if it has width/height
  optimized = ensureViewBox(optimized);
  
  // Ensure SVG has ID attribute on root element
  optimized = ensureSvgId(optimized);
  
  return optimized;
}

/**
 * Ensure the SVG has a viewBox attribute if it has width and height
 * 
 * @param svgContent - The SVG content to process
 * @returns SVG content with viewBox added if needed
 */
function ensureViewBox(svgContent: string): string {
  // Only process if there's no viewBox already
  if (!/viewBox\s*=/.test(svgContent)) {
    // Try to extract width and height
    const widthMatch = svgContent.match(/width\s*=\s*["']([^"']+)["']/);
    const heightMatch = svgContent.match(/height\s*=\s*["']([^"']+)["']/);
    
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1] ?? '0');
      const height = parseFloat(heightMatch[1] ?? '0');
      
      // Add viewBox attribute to opening svg tag
      return svgContent.replace(
        /(<svg[^>]*)>/,
        `$1 viewBox="0 0 ${width} ${height}">`
      );
    }
  }
  
  return svgContent;
}

/**
 * Ensure the SVG root element has an ID attribute
 * 
 * @param svgContent - The SVG content to process
 * @returns SVG content with ID added if needed
 */
function ensureSvgId(svgContent: string): string {
  // Check if SVG already has an ID
  if (!/id\s*=/.test(svgContent)) {
    // Generate a random ID
    const id = `svg_${Math.random().toString(36).slice(2, 11)}`;
    
    // Add ID attribute to opening svg tag
    return svgContent.replace(
      /(<svg[^>]*)>/,
      `$1 id="${id}">`
    );
  }
  
  return svgContent;
}

/**
 * Validate SVG structure and content
 * 
 * @param svgContent - The SVG content to validate
 * @returns Object with validation result and optional error message
 */
export function validateSVG(svgContent: string): { isValid: boolean; error?: string } {
  // Basic validation - check if content starts with <svg
  if (!svgContent.trim().match(/<svg[^>]*>/)) {
    return { isValid: false, error: 'Content is not a valid SVG (missing root svg element)' };
  }
  
  // Check for basic SVG structure using regex
  const hasClosingTag = svgContent.includes('</svg>');
  if (!hasClosingTag) {
    return { isValid: false, error: 'Invalid SVG: missing closing </svg> tag' };
  }
  
  // Additional basic checks could be added here
  
  return { isValid: true };
}

/**
 * Prepare SVG specifically for animation by adding necessary structure
 * 
 * @param svgContent - The SVG content to prepare
 * @param animationType - The type of animation to prepare for
 * @returns Prepared SVG content
 */
export function prepareSVGForAnimation(svgContent: string, animationType: string): string {
  // Sanitize and optimize first
  let prepared = sanitizeSVG(svgContent);
  prepared = optimizeSVG(prepared);
  
  // Additional preparation based on animation type
  switch (animationType) {
    case 'draw':
      // Ensure paths have zero initial stroke-dashoffset for draw animation
      prepared = prepared.replace(
        /(<path[^>]*)(\s*\/?>)/gi,
        '$1 stroke-dasharray="0" stroke-dashoffset="0"$2'
      );
      break;
      
    case 'morph':
      // Ensure paths have IDs for morphing
      let pathCounter = 0;
      prepared = prepared.replace(
        /(<path[^>]*?)(id\s*=\s*["'][^"']*["'])?([^>]*?>)/gi,
        (match, start, existingId, end) => {
          if (existingId) {
            return match;
          }
          return `${start} id="path_${pathCounter++}"${end}`;
        }
      );
      break;
  }
  
  return prepared;
}

/**
 * Extract all elements from an SVG that can be animated using regex
 * 
 * @param svgContent - The SVG content to analyze
 * @returns Array of element IDs or selectors that can be animated
 */
export function extractAnimatableElements(svgContent: string): string[] {
  const animatableElements: string[] = [];
  
  // Extract IDs using regex
  const idRegex = /id\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = idRegex.exec(svgContent)) !== null) {
    animatableElements.push(`#${match[1]}`);
  }
  
  // Add generic element selectors for common SVG elements
  const elementTypes = ['path', 'circle', 'rect', 'polygon', 'ellipse', 'line', 'polyline', 'text', 'g'];
  elementTypes.forEach(type => {
    // Count occurrences of this element type
    const regex = new RegExp(`<${type}[^>]*>`, 'g');
    const matches = svgContent.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count === 1) {
      // If there's only one, we can target it directly
      animatableElements.push(type);
    } else if (count > 1) {
      // For multiple elements, suggest nth-of-type selectors
      for (let i = 1; i <= count; i++) {
        animatableElements.push(`${type}:nth-of-type(${i})`);
      }
    }
  });
  
  return animatableElements;
}

/**
 * Check if an SVG supports a specific animation type using regex
 * 
 * @param svgContent - The SVG content to check
 * @param animationType - The animation type to check compatibility for
 * @returns Object with compatibility result and optional reason
 */
export function checkAnimationCompatibility(
  svgContent: string, 
  animationType: string
): { isCompatible: boolean; reason?: string } {
  
  switch (animationType) {
    case 'draw':
      // Check if SVG has path elements for draw animation
      const hasPaths = /<path[^>]*>/i.test(svgContent);
      if (!hasPaths) {
        return { isCompatible: false, reason: 'Draw animation requires path elements' };
      }
      break;
      
    case 'morph':
      // Check if SVG has path elements for morphing
      const hasMorphPaths = /<path[^>]*>/i.test(svgContent);
      if (!hasMorphPaths) {
        return { isCompatible: false, reason: 'Morph animation requires path elements' };
      }
      break;
      
    case 'typewriter':
      // Check if SVG has text elements for typewriter effect
      const hasText = /<text[^>]*>/i.test(svgContent);
      if (!hasText) {
        return { isCompatible: false, reason: 'Typewriter animation requires text elements' };
      }
      break;
  }
  
  return { isCompatible: true };
}