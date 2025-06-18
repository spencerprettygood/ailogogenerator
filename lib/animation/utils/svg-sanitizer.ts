/**
 * SVG Sanitization Module for Animation
 * 
 * This module focuses on sanitizing SVGs specifically for animation purposes,
 * ensuring they're safe and optimal for animation operations.
 */

export interface SVGSanitizationResult {
  svg: string;
  isModified: boolean;
  modifications: string[];
  errors: string[];
  warnings: string[];
}

export interface SanitizationOptions {
  /**
   * Whether to allow animation elements (animate, animateTransform, etc.)
   * Set to true if you want to preserve existing SMIL animations
   * Default: false (remove them to apply our own animations)
   */
  allowSMIL?: boolean;
  
  /**
   * Whether to add IDs to elements for targeting in animations
   * Default: true
   */
  addElementIds?: boolean;
  
  /**
   * Whether to optimize the SVG for animation (remove unnecessary attributes, etc.)
   * Default: true
   */
  optimize?: boolean;
  
  /**
   * Whether to flatten unnecessarily nested groups
   * Default: true
   */
  flattenGroups?: boolean;
  
  /**
   * Whether to auto-fix common issues like missing viewBox
   * Default: true
   */
  autoFix?: boolean;
  
  /**
   * Whether to ensure elements have non-zero stroke width
   * Default: true
   */
  ensureStrokeWidth?: boolean;
}

/**
 * Sanitizes an SVG for animation purposes
 * 
 * @param svgContent - SVG content to sanitize
 * @param options - Sanitization options
 * @returns Sanitized SVG and modification details
 */
export function sanitizeSVGForAnimation(
  svgContent: string, 
  options: SanitizationOptions = {}
): SVGSanitizationResult {
  const {
    allowSMIL = false,
    addElementIds = true,
    optimize = true,
    flattenGroups = true,
    autoFix = true,
    ensureStrokeWidth = true
  } = options;
  
  const result: SVGSanitizationResult = {
    svg: svgContent,
    isModified: false,
    modifications: [],
    errors: [],
    warnings: []
  };
  
  // Check if the SVG is empty or not a string
  if (!svgContent || typeof svgContent !== 'string') {
    result.errors.push('SVG content is empty or not a string');
    return result;
  }
  
  try {
    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parserErrors = doc.querySelector('parsererror');
    if (parserErrors) {
      result.errors.push('SVG parsing error: Invalid SVG structure');
      return result;
    }
    
    // Get the SVG element
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      result.errors.push('No SVG element found in the provided content');
      return result;
    }
    
    // Auto-fix: Add viewBox if missing
    if (autoFix && !svgElement.hasAttribute('viewBox')) {
      const width = svgElement.getAttribute('width') || '300';
      const height = svgElement.getAttribute('height') || '300';
      
      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      result.modifications.push('Added missing viewBox attribute');
      result.isModified = true;
    }
    
    // Remove SMIL animation elements if not allowed
    if (!allowSMIL) {
      const animationElements = doc.querySelectorAll('animate, animateTransform, animateMotion, set');
      if (animationElements.length > 0) {
        animationElements.forEach(el => {
          el.parentNode?.removeChild(el);
        });
        result.modifications.push(`Removed ${animationElements.length} SMIL animation elements`);
        result.isModified = true;
      }
    }
    
    // Add IDs to elements for animation targeting
    if (addElementIds) {
      const animatableElements = doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, g');
      let idCount = 0;
      
      animatableElements.forEach(el => {
        if (!el.id) {
          const tagName = el.tagName.toLowerCase();
          el.id = `${tagName}-${idCount++}`;
        }
      });
      
      if (idCount > 0) {
        result.modifications.push(`Added IDs to ${idCount} elements`);
        result.isModified = true;
      }
    }
    
    // Ensure stroke-width for path elements
    if (ensureStrokeWidth) {
      const pathElements = doc.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse');
      let strokeFixed = 0;
      
      pathElements.forEach(el => {
        // Only add stroke-width if the element has a stroke but no stroke-width
        if (
          el.getAttribute('stroke') && 
          el.getAttribute('stroke') !== 'none' && 
          !el.getAttribute('stroke-width')
        ) {
          el.setAttribute('stroke-width', '1');
          strokeFixed++;
        }
      });
      
      if (strokeFixed > 0) {
        result.modifications.push(`Added stroke-width to ${strokeFixed} elements`);
        result.isModified = true;
      }
    }
    
    // Flatten unnecessarily nested groups
    if (flattenGroups) {
      const emptyGroups = doc.querySelectorAll('g:empty');
      let removedGroups = 0;
      
      // Remove empty groups
      emptyGroups.forEach(group => {
        group.parentNode?.removeChild(group);
        removedGroups++;
      });
      
      // Flatten single-child groups that don't have transformations or other important attributes
      const singleChildGroups = Array.from(doc.querySelectorAll('g')).filter(g => 
        g.childNodes.length === 1 && 
        g.childNodes[0].nodeType === Node.ELEMENT_NODE &&
        !g.getAttribute('transform') &&
        !g.getAttribute('mask') &&
        !g.getAttribute('clip-path') &&
        !g.getAttribute('filter')
      );
      
      singleChildGroups.forEach(group => {
        const child = group.firstElementChild;
        if (child) {
          // Preserve any classes, IDs, or other attributes from the group
          Array.from(group.attributes).forEach(attr => {
            // Skip data-* attributes which might be used by our animation system
            if (!attr.name.startsWith('data-') && 
                !child.hasAttribute(attr.name)) {
              child.setAttribute(attr.name, attr.value);
            }
          });
          
          // Replace the group with its child
          group.parentNode?.replaceChild(child, group);
          removedGroups++;
        }
      });
      
      if (removedGroups > 0) {
        result.modifications.push(`Flattened or removed ${removedGroups} unnecessary groups`);
        result.isModified = true;
      }
    }
    
    // Optimize SVG
    if (optimize) {
      // Remove comments
      const nodeIterator = document.createNodeIterator(
        doc,
        NodeFilter.SHOW_COMMENT,
        { acceptNode: () => NodeFilter.FILTER_ACCEPT }
      );
      
      let commentNode;
      let removedComments = 0;
      
      while ((commentNode = nodeIterator.nextNode())) {
        commentNode.parentNode?.removeChild(commentNode);
        removedComments++;
      }
      
      // Remove unnecessary attributes
      const allElements = doc.querySelectorAll('*');
      const unnecessaryAttrs = [
        'data-name',
        'data-old-color',
        'data-original',
        'xmlns:xlink',
        'xml:space',
        'enable-background',
        'version'
      ];
      
      let removedAttrs = 0;
      
      allElements.forEach(el => {
        unnecessaryAttrs.forEach(attr => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
            removedAttrs++;
          }
        });
      });
      
      if (removedComments > 0 || removedAttrs > 0) {
        result.modifications.push(`Optimization: Removed ${removedComments} comments and ${removedAttrs} unnecessary attributes`);
        result.isModified = true;
      }
    }
    
    // Ensure the SVG element has an ID for animation targeting
    if (!svgElement.id) {
      svgElement.id = `svg-anim-${Math.random().toString(36).substring(2, 9)}`;
      result.modifications.push('Added ID to SVG element');
      result.isModified = true;
    }
    
    // Serialize the modified SVG
    const serializer = new XMLSerializer();
    result.svg = serializer.serializeToString(doc);
    
  } catch (error) {
    result.errors.push(`Error sanitizing SVG: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return result;
}

/**
 * Checks if an SVG can be animated efficiently
 * 
 * @param svgContent - SVG content to check
 * @returns Whether the SVG is animatable and any issues
 */
export function isAnimatable(svgContent: string): {
  animatable: boolean;
  issues: string[];
  complexity: 'simple' | 'moderate' | 'complex';
} {
  const issues: string[] = [];
  
  try {
    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parserErrors = doc.querySelector('parsererror');
    if (parserErrors) {
      issues.push('Invalid SVG structure');
      return { animatable: false, issues, complexity: 'complex' };
    }
    
    // Get the SVG element
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      issues.push('No SVG element found');
      return { animatable: false, issues, complexity: 'complex' };
    }
    
    // Check if it has a viewBox
    if (!svgElement.hasAttribute('viewBox')) {
      issues.push('Missing viewBox attribute (can be auto-fixed)');
    }
    
    // Check for excessive complexity
    const elements = doc.querySelectorAll('*');
    if (elements.length > 500) {
      issues.push('SVG has over 500 elements which may impact animation performance');
    }
    
    // Check for nested groups (more than 5 levels deep)
    let maxNesting = 0;
    const groups = doc.querySelectorAll('g');
    groups.forEach(group => {
      let parent = group.parentElement;
      let nesting = 1;
      
      while (parent && parent.tagName !== 'svg') {
        if (parent.tagName === 'g') {
          nesting++;
        }
        parent = parent.parentElement;
      }
      
      maxNesting = Math.max(maxNesting, nesting);
    });
    
    if (maxNesting > 5) {
      issues.push(`Excessive group nesting (${maxNesting} levels deep)`);
    }
    
    // Check for elements that are harder to animate
    const foreignObjects = doc.querySelectorAll('foreignObject');
    if (foreignObjects.length > 0) {
      issues.push('Contains foreignObject elements which may not animate well');
    }
    
    // Check for filters which can be performance-intensive
    const filters = doc.querySelectorAll('filter');
    if (filters.length > 0) {
      issues.push('Contains filter elements which may impact animation performance');
    }
    
    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    
    if (elements.length > 200 || maxNesting > 3 || filters.length > 0) {
      complexity = 'moderate';
    }
    
    if (elements.length > 500 || maxNesting > 5 || foreignObjects.length > 0) {
      complexity = 'complex';
    }
    
    // An SVG is still animatable even with issues, they just might be warnings
    return {
      animatable: true,
      issues,
      complexity
    };
    
  } catch (error) {
    issues.push(`Error analyzing SVG: ${error instanceof Error ? error.message : String(error)}`);
    return { animatable: false, issues, complexity: 'complex' };
  }
}

/**
 * Prepares an SVG for animation by adding necessary attributes
 * and ensuring it has the proper structure
 * 
 * @param svgContent - SVG content to prepare
 * @param animationType - Type of animation to prepare for
 * @returns Prepared SVG
 */
export function prepareSVGForAnimation(
  svgContent: string,
  animationType: string
): string {
  // Start by sanitizing the SVG
  const sanitizationResult = sanitizeSVGForAnimation(svgContent);
  
  if (sanitizationResult.errors.length > 0) {
    throw new Error(`Cannot prepare SVG for animation: ${sanitizationResult.errors.join(', ')}`);
  }
  
  let preparedSvg = sanitizationResult.svg;
  
  try {
    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(preparedSvg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }
    
    // Add data attribute for animation type
    svgElement.setAttribute('data-animation-type', animationType);
    
    // Add specific preparations based on animation type
    switch (animationType) {
      case 'draw':
        // For path drawing animations, ensure all paths have proper attributes
        const paths = doc.querySelectorAll('path');
        paths.forEach((path, index) => {
          path.setAttribute('data-draw-index', index.toString());
          
          // Ensure the path has a non-zero stroke-width
          if (!path.getAttribute('stroke-width')) {
            path.setAttribute('stroke-width', '1');
          }
          
          // Ensure the path has a stroke color
          if (!path.getAttribute('stroke')) {
            // Use the fill color as stroke if available, otherwise default to black
            const fill = path.getAttribute('fill');
            path.setAttribute('stroke', fill && fill !== 'none' ? fill : '#000');
          }
        });
        break;
        
      case 'morph':
        // For morphing animations, ensure paths have unique IDs
        const morphPaths = doc.querySelectorAll('path');
        morphPaths.forEach((path, index) => {
          path.id = path.id || `morph-path-${index}`;
        });
        break;
        
      case 'sequential':
        // For sequential animations, add sequence indices
        const elements = Array.from(doc.querySelectorAll('*')).filter(el => 
          el.tagName !== 'defs' && 
          el.tagName !== 'svg'
        );
        
        elements.forEach((el, index) => {
          el.setAttribute('data-sequence-index', index.toString());
        });
        break;
    }
    
    // Serialize the prepared SVG
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
    
  } catch (error) {
    throw new Error(`Error preparing SVG for animation: ${error instanceof Error ? error.message : String(error)}`);
  }
}