/**
 * SVG Sanitizer
 *
 * Comprehensive security-focused SVG sanitization to prevent XSS vulnerabilities
 * by removing potentially dangerous elements and attributes.
 */

// We're defining this interface to ensure type safety while we wait for DOMPurify to be installed
interface DOMPurifyStatic {
  sanitize(html: string | Node, options?: unknown): string;
  addHook(hookName: string, callback: (node: Element) => void): void;
  setConfig(config: Record<string, unknown>): void;
}

// Will be properly initialized after dependency is installed
let DOMPurify: DOMPurifyStatic;

/**
 * Initialize the DOMPurify library when in a browser environment
 * This function will be called automatically on import in a browser context
 */
function initDOMPurify() {
  try {
    // Only try to import in browser environment
    if (typeof window !== 'undefined') {
      // Import will be resolved after npm installation
      // @ts-ignore - Dynamic import
      import('dompurify').then(module => {
        DOMPurify = module.default;
        configureDOMPurify();
      });
    }
  } catch (error) {
    console.error('Failed to initialize DOMPurify:', error);
  }
}

/**
 * Configure DOMPurify with SVG-specific settings
 */
function configureDOMPurify() {
  if (!DOMPurify) return;

  // Add hook to remove all event handlers and javascript: URLs
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    // Remove all event handlers
    if (node.attributes) {
      // Create a safe copy of the attributes to avoid modification during iteration
      const attributes = Array.from(node.attributes);
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (
          attr &&
          attr.name &&
          (attr.name.startsWith('on') ||
            (attr.value && attr.value.toLowerCase().includes('javascript:')))
        ) {
          node.removeAttribute(attr.name);
        }
      }
    }

    // Check for javascript: URLs
    if (node.getAttribute('href') || node.getAttribute('xlink:href')) {
      const href = node.getAttribute('href') || node.getAttribute('xlink:href') || '';
      if (href.toLowerCase().includes('javascript:')) {
        node.removeAttribute('href');
        node.removeAttribute('xlink:href');
      }
    }

    // Add safe target attribute to links
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// Initialize DOMPurify immediately in browser environments
initDOMPurify();

/**
 * Allowed SVG elements that are considered safe
 */
const ALLOWED_SVG_TAGS = [
  'svg',
  'a',
  'altglyph',
  'altglyphdef',
  'altglyphitem',
  'animatecolor',
  'animatemotion',
  'animatetransform',
  'circle',
  'clippath',
  'defs',
  'desc',
  'ellipse',
  'filter',
  'font',
  'g',
  'glyph',
  'glyphref',
  'hkern',
  'image',
  'line',
  'lineargradient',
  'marker',
  'mask',
  'metadata',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialgradient',
  'rect',
  'stop',
  'style',
  'switch',
  'symbol',
  'text',
  'textpath',
  'title',
  'tref',
  'tspan',
  'use',
  'view',
  'vkern',
];

/**
 * Dangerous elements that should always be removed
 */
const FORBIDDEN_SVG_TAGS = [
  'script',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'foreignobject',
];

/**
 * Dangerous attributes that should always be removed
 */
const FORBIDDEN_SVG_ATTRIBUTES = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onmousemove',
  'onmousedown',
  'onmouseup',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'formaction',
  'href',
  'xlink:href',
  'action',
  'src',
];

/**
 * Sanitize SVG content to prevent XSS attacks
 *
 * This function removes potentially dangerous elements and attributes
 * from SVG content to prevent Cross-Site Scripting (XSS) attacks.
 *
 * @param svgContent - The SVG content to sanitize
 * @returns Sanitized SVG content
 */
export function sanitizeSVG(svgContent: string): string {
  // If not initialized or in Node.js environment, use regex-based fallback
  if (typeof window === 'undefined' || !DOMPurify) {
    return fallbackSanitizeSVG(svgContent);
  }

  // Configure DOMPurify for SVG content
  const config = {
    USE_PROFILES: { svg: true },
    ADD_TAGS: ALLOWED_SVG_TAGS,
    FORBID_TAGS: FORBIDDEN_SVG_TAGS,
    FORBID_ATTR: FORBIDDEN_SVG_ATTRIBUTES,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true,
  };

  // Sanitize the SVG
  return DOMPurify.sanitize(svgContent, config);
}

/**
 * Fallback sanitization using regex when DOMPurify is not available
 * Not as robust as DOMPurify but provides basic protection
 *
 * @param svgContent - The SVG content to sanitize
 * @returns Sanitized SVG content
 */
function fallbackSanitizeSVG(svgContent: string): string {
  let sanitized = svgContent;

  // Remove dangerous tags
  FORBIDDEN_SVG_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');

    // Also remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // Remove dangerous attributes
  FORBIDDEN_SVG_ATTRIBUTES.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove javascript: URLs
  const jsUrlRegex = /\b(href|xlink:href|src)\s*=\s*["']?javascript:/gi;
  sanitized = sanitized.replace(jsUrlRegex, ' data-removed=');

  // Remove event handlers (on*)
  const eventRegex = /\bon\w+\s*=\s*["'][^"']*["']/gi;
  sanitized = sanitized.replace(eventRegex, '');

  return sanitized;
}

/**
 * Validate whether an SVG is safe for display
 *
 * @param svgContent - The SVG content to validate
 * @returns Boolean indicating if the SVG is safe
 */
export function isValidSVG(svgContent: string): boolean {
  // Basic validation to check if content is SVG
  if (!svgContent || typeof svgContent !== 'string') {
    return false;
  }

  // Check for SVG opening and closing tags
  if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
    return false;
  }

  // Check for obvious malicious content
  const hasForbiddenTags = FORBIDDEN_SVG_TAGS.some(tag => {
    const regex = new RegExp(`<${tag}[^>]*>`, 'i');
    return regex.test(svgContent);
  });

  if (hasForbiddenTags) {
    return false;
  }

  return true;
}

/**
 * Process SVG content for safe display
 * Combines validation and sanitization
 *
 * @param svgContent - The SVG content to process
 * @returns Object with sanitized SVG and validation status
 */
export function processSVGForDisplay(svgContent: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  try {
    // Basic validation
    if (!isValidSVG(svgContent)) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Invalid SVG content detected',
      };
    }

    // Sanitize the SVG
    const sanitized = sanitizeSVG(svgContent);

    // Ensure sanitization didn't remove all SVG content
    if (!isValidSVG(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Sanitization removed critical SVG content',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  } catch (error) {
    return {
      isValid: false,
      sanitized: '',
      error: `SVG processing error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Special sanitization for SVGs that will be animated
 * Ensures the SVG structure is compatible with animation
 *
 * @param svgContent - The SVG content to sanitize for animation
 * @returns Sanitized SVG suitable for animation
 */
export function sanitizeSVGForAnimation(svgContent: string): string {
  // First apply regular sanitization
  const sanitized = sanitizeSVG(svgContent);

  // Additional processing for animation compatibility
  // 1. Ensure SVG has viewBox attribute
  let processed = sanitized;

  // Add viewBox if not present but width/height are available
  if (!processed.includes('viewBox=')) {
    const widthMatch = processed.match(/width=["']([^"']+)["']/);
    const heightMatch = processed.match(/height=["']([^"']+)["']/);

    let width: number | undefined, height: number | undefined;
    if (widthMatch && widthMatch[1]) {
      width = parseFloat(widthMatch[1]);
    }
    if (heightMatch && heightMatch[1]) {
      height = parseFloat(heightMatch[1]);
    }
    if (
      typeof width === 'number' &&
      typeof height === 'number' &&
      !isNaN(width) &&
      !isNaN(height)
    ) {
      processed = processed.replace(/<svg/, `<svg viewBox=\"0 0 ${width} ${height}\"`);
    }
  }

  // 2. Ensure all elements have IDs for animation targeting
  // This is a simplified example - a full implementation would parse and modify the DOM

  return processed;
}

/**
 * Check if an SVG is suitable for animation
 *
 * @param svgContent - The SVG content to check
 * @returns Boolean indicating if the SVG can be animated
 */
export function isAnimatable(svgContent: string): boolean {
  // Basic check if the content is a valid SVG
  if (!isValidSVG(svgContent)) {
    return false;
  }

  // Check for presence of viewBox or width/height attributes
  const hasViewBox = /viewBox=["'][^"']+["']/i.test(svgContent);
  const hasWidth = /width=["'][^"']+["']/i.test(svgContent);
  const hasHeight = /height=["'][^"']+["']/i.test(svgContent);

  if (!hasViewBox && (!hasWidth || !hasHeight)) {
    return false;
  }

  // Check for minimum required elements to animate
  // This is a simple check - a more comprehensive version would parse the DOM
  const hasPaths = svgContent.includes('<path');
  const hasShapes = /(<circle|<rect|<ellipse|<polygon|<polyline)/i.test(svgContent);

  return hasPaths || hasShapes;
}
