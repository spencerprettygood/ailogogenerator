/**
 * Utilities for optimizing SVGs before animation
 */

/**
 * Optimize an SVG for animation by removing unnecessary elements and attributes
 * @param svg The SVG string to optimize
 * @returns Optimized SVG string
 */
export function optimizeSVG(svg: string): string {
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
    
    // Ensure SVG has an ID for animation targeting
    const svgElement = doc.querySelector('svg');
    if (svgElement && !svgElement.hasAttribute('id')) {
      svgElement.setAttribute('id', `svg-${Math.random().toString(36).substring(2, 11)}`);
    }
    
    // Ensure paths have IDs for individual animation
    const paths = doc.querySelectorAll('path:not([id])');
    paths.forEach((path, index) => {
      path.setAttribute('id', `path-${index}`);
    });
    
    return new XMLSerializer().serializeToString(doc);
  } catch (error) {
    console.warn('SVG optimization failed, returning original:', error);
    return svg;
  }
}

/**
 * Check if an SVG is suitable for animation (has paths, not too complex)
 * @param svg The SVG string to check
 * @returns Object with validation results
 */
export function validateSVGForAnimation(svg: string): { 
  isValid: boolean; 
  issues: string[]; 
  complexity: number;
} {
  const issues: string[] = [];
  let complexity = 0;
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    
    // Check for parsing errors
    const parserErrors = doc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      issues.push('SVG has parsing errors');
      return { isValid: false, issues, complexity: 0 };
    }
    
    // Check that SVG has a root element
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      issues.push('Missing SVG root element');
      return { isValid: false, issues, complexity: 0 };
    }
    
    // Check for viewBox or width/height
    if (!svgElement.hasAttribute('viewBox') && 
        (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height'))) {
      issues.push('SVG is missing viewBox or width/height attributes');
    }
    
    // Check for animatable elements
    const paths = doc.querySelectorAll('path');
    const shapes = doc.querySelectorAll('rect, circle, ellipse, line, polygon, polyline');
    
    if (paths.length === 0 && shapes.length === 0) {
      issues.push('SVG has no animatable path or shape elements');
    }
    
    // Calculate complexity
    complexity = paths.length * 2 + shapes.length;
    
    // Check if SVG is too complex for smooth animation
    if (complexity > 100) {
      issues.push('SVG is very complex, animation may not be smooth');
    }
    
    // Check for scripting elements that might interfere with animation
    const scripts = doc.querySelectorAll('script');
    if (scripts.length > 0) {
      issues.push('SVG contains script elements that may interfere with animation');
    }
    
    // Check for unsupported elements for animation
    const unsupportedElements = doc.querySelectorAll('foreignObject, image, video');
    if (unsupportedElements.length > 0) {
      issues.push('SVG contains elements that may not animate properly');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      complexity
    };
  } catch (error) {
    issues.push(`SVG validation error: ${error instanceof Error ? error.message : String(error)}`);
    return { isValid: false, issues, complexity: 0 };
  }
}