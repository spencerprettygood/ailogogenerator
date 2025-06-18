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
    'object'
  ],
  
  // Potentially harmful attributes that should be removed
  disallowedAttributes: [
    'onload',
    'onerror',
    'onabort',
    'onfocus',
    'onblur',
    'onchange',
    'onclick',
    'onmousedown',
    'onmousemove',
    'onmouseout',
    'onmouseover',
    'onmouseup',
    'onkeydown',
    'onkeypress',
    'onkeyup',
    'javascript:',
    'data:',
    'xlink:href'
  ],
  
  // Maximum SVG size allowed (in bytes)
  maxSvgSize: 1024 * 100, // 100KB
};

/**
 * Sanitize SVG content to remove potentially harmful elements and attributes
 * 
 * @param svgContent - The SVG content to sanitize
 * @returns Sanitized SVG content
 */
export function sanitizeSVG(svgContent: string): string {
  // Check SVG size
  if (svgContent.length > SECURITY_CONFIG.maxSvgSize) {
    console.warn(`SVG size exceeds maximum allowed size (${SECURITY_CONFIG.maxSvgSize} bytes)`);
  }
  
  let sanitized = svgContent;
  
  // Server-side sanitization when DOMParser is not available
  if (typeof DOMParser === 'undefined') {
    // Use regex-based sanitization as fallback
    return regexSanitize(svgContent);
  }
  
  try {
    // Parse SVG using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid SVG: ' + parserError.textContent);
    }
    
    // Remove disallowed elements
    SECURITY_CONFIG.disallowedElements.forEach(tagName => {
      const elements = doc.getElementsByTagName(tagName);
      for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].remove();
      }
    });
    
    // Remove disallowed attributes
    const allElements = doc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      for (let j = element.attributes.length - 1; j >= 0; j--) {
        const attrName = element.attributes[j].name.toLowerCase();
        const attrValue = element.attributes[j].value.toLowerCase();
        
        // Check if attribute name or value contains disallowed content
        const isDisallowed = SECURITY_CONFIG.disallowedAttributes.some(disallowed => 
          attrName.includes(disallowed) || attrValue.includes(disallowed)
        );
        
        if (isDisallowed) {
          element.removeAttribute(element.attributes[j].name);
        }
      }
    }
    
    // Serialize back to string
    const serializer = new XMLSerializer();
    sanitized = serializer.serializeToString(doc);
    
  } catch (error) {
    console.error('Error sanitizing SVG:', error);
    // Fall back to regex-based sanitization
    sanitized = regexSanitize(svgContent);
  }
  
  return sanitized;
}

/**
 * Fallback sanitization using regex when DOM methods are not available
 * 
 * @param svgContent - The SVG content to sanitize
 * @returns Sanitized SVG content
 */
function regexSanitize(svgContent: string): string {
  let sanitized = svgContent;
  
  // Remove disallowed elements
  SECURITY_CONFIG.disallowedElements.forEach(element => {
    const regex = new RegExp(`<${element}[^>]*>.*?<\\/${element}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    
    // Also remove self-closing tags
    const selfClosingRegex = new RegExp(`<${element}[^>]*\\/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });
  
  // Remove disallowed attributes
  SECURITY_CONFIG.disallowedAttributes.forEach(attr => {
    // Match attributes in the form name="value" or name='value' or name=value
    const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*(['"])(.*?)\\1`, 'gi');
    sanitized = sanitized.replace(attrRegex, '');
    
    // Also match attributes without quotes
    const attrNoQuotesRegex = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]+`, 'gi');
    sanitized = sanitized.replace(attrNoQuotesRegex, '');
  });
  
  return sanitized;
}

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
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      
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
  
  try {
    // Try to parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { isValid: false, error: 'SVG parsing error: ' + parserError.textContent };
    }
    
    // Check for root SVG element
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      return { isValid: false, error: 'No SVG element found in content' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Error validating SVG: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
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
 * Extract all elements from an SVG that can be animated
 * 
 * @param svgContent - The SVG content to analyze
 * @returns Array of element IDs or selectors that can be animated
 */
export function extractAnimatableElements(svgContent: string): string[] {
  const animatableElements: string[] = [];
  
  try {
    // Parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Get all elements with IDs
    const elementsWithId = doc.querySelectorAll('[id]');
    elementsWithId.forEach(el => {
      animatableElements.push(`#${el.id}`);
    });
    
    // Get all paths, circles, rects without IDs
    const elementTypes = ['path', 'circle', 'rect', 'polygon', 'ellipse', 'line', 'polyline', 'text', 'g'];
    elementTypes.forEach(type => {
      const elements = doc.querySelectorAll(type + ':not([id])');
      
      if (elements.length === 1) {
        // If there's only one element of this type, we can target it directly
        animatableElements.push(type);
      } else if (elements.length > 1) {
        // For multiple elements, include them by index
        elements.forEach((_, index) => {
          animatableElements.push(`${type}:nth-of-type(${index + 1})`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error extracting animatable elements:', error);
  }
  
  return animatableElements;
}

/**
 * Check if an SVG supports a specific animation type
 * 
 * @param svgContent - The SVG content to check
 * @param animationType - The animation type to check compatibility for
 * @returns Object with compatibility result and optional reason
 */
export function checkAnimationCompatibility(
  svgContent: string, 
  animationType: string
): { isCompatible: boolean; reason?: string } {
  try {
    // Parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { isCompatible: false, reason: 'Invalid SVG: parsing error' };
    }
    
    switch (animationType) {
      case 'draw':
        // Check if SVG has path elements for draw animation
        const paths = doc.querySelectorAll('path');
        if (paths.length === 0) {
          return { isCompatible: false, reason: 'Draw animation requires path elements' };
        }
        break;
        
      case 'morph':
        // Check if SVG has path elements for morphing
        const morphPaths = doc.querySelectorAll('path');
        if (morphPaths.length === 0) {
          return { isCompatible: false, reason: 'Morph animation requires path elements' };
        }
        break;
        
      case 'typewriter':
        // Check if SVG has text elements for typewriter effect
        const textElements = doc.querySelectorAll('text');
        if (textElements.length === 0) {
          return { isCompatible: false, reason: 'Typewriter animation requires text elements' };
        }
        break;
    }
    
    return { isCompatible: true };
  } catch (error) {
    return { 
      isCompatible: false, 
      reason: `Error checking compatibility: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}