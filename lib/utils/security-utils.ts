/**
 * Result of security validation operations
 */
export interface SecurityValidationResult {
  isValid: boolean;
  violations: Record<string, boolean>;
  errors: string[];
  severity?: 'low' | 'medium' | 'high';
  details?: string;
}

// Export the InputSanitizer as the default object for compatibility
const securityUtils = {
  sanitizeBrief: (input: string) => InputSanitizer.sanitizeBrief(input),
  validateSVG: (svg: string) => InputSanitizer.validateSVG(svg),
  cleanSVG: (svg: string) => InputSanitizer.cleanSVG(svg),
};

export default securityUtils;

// Function for optimizing and securing SVG content
export function secureAndOptimizeSvg(svg: string): string {
  // First clean the SVG for security
  const cleanedSvg = InputSanitizer.cleanSVG(svg);

  // Perform basic optimization (removing comments, etc.)
  const optimizedSvg = cleanedSvg
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><'); // Remove whitespace between tags

  return optimizedSvg;
}

export class InputSanitizer {
  /**
   * Sanitizes user input to prevent prompt injection and other security issues
   * @param input - The raw user input string
   * @returns Sanitized string safe for processing
   */
  static sanitizeBrief(input: string): string {
    // Bail early on empty input
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove potential injection patterns
    const patterns = [
      // Prompt injection attempts
      /ignore\s+previous\s+instructions/gi,
      /disregard\s+(your|earlier|above|prior)\s+instructions/gi,
      /forget\s+(your|earlier|above|prior)\s+instructions/gi,

      // Role confusion attempts
      /system\s*:/gi,
      /assistant\s*:/gi,
      /user\s*:/gi,

      // Code injection attempts
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /data:(?:text|application)\/(?:javascript|html)/gi,

      // Template injection
      /\{\{.*?\}\}/g,
      /\$\{.*?\}/g,

      // Command injection
      /`.*?`/g,
      /\$\(.*?\)/g,

      // Delimiter smuggling
      /```(\w*)\n[\s\S]*?```/g,

      // Other dangerous patterns
      /process\.env/gi,
      /require\s*\(/gi,
      /import\s+[\w\{\}\s,]+\s+from/gi,
      /eval\s*\(/gi,
    ];

    let sanitized = input;
    patterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    });

    // Apply character limit for additional safety
    // This prevents excessively long inputs that could be used in DoS attacks
    return sanitized.slice(0, 2000);
  }

  /**
   * Validates SVG content for security issues
   * @param svgContent - The SVG string to validate
   * @returns Validation result with details of any security issues
   */
  static validateSVG(svgContent: string): SecurityValidationResult {
    const errors: string[] = [];

    // Bail early on empty SVG
    if (!svgContent || typeof svgContent !== 'string') {
      return {
        isValid: false,
        violations: { empty_content: true },
        errors: ['SVG content is empty or invalid'],
        severity: 'high',
      };
    }

    // Define comprehensive security checks
    const security_checks = {
      // Script-based vulnerabilities (high severity)
      has_scripts: /<script/i.test(svgContent),
      has_javascript_href: /href\s*=\s*["']\s*javascript:/i.test(svgContent),
      has_data_uri: /data:(?:text\/html|application\/javascript)/i.test(svgContent),
      has_event_handlers: /\son\w+\s*=/i.test(svgContent),

      // External content risks (medium severity)
      has_external_refs: /href\s*=\s*["'][^"']*:\/\//i.test(svgContent),
      has_remote_images: /xlink:href\s*=\s*["']\s*https?:/i.test(svgContent),
      has_foreignObject: /<foreignObject/i.test(svgContent),
      has_use_element: /<use[^>]*href\s*=\s*["'][^#]/i.test(svgContent),

      // Potential CSS-based attacks
      has_css_imports: /@import/i.test(svgContent),

      // Other issues (low severity)
      malformed_xml: !/<svg[\s>]/i.test(svgContent),
      size_exceeds_limit: svgContent.length > 15360, // 15KB
      has_suspicious_content: /eval\s*\(|Function\s*\(|setTimeout\s*\(/i.test(svgContent),
    };

    // Generate detailed errors for violations
    if (security_checks.has_scripts) {
      errors.push('SVG contains script tags which are not allowed (high severity).');
    }

    if (security_checks.has_javascript_href) {
      errors.push('SVG contains javascript: URIs which are not allowed (high severity).');
    }

    if (security_checks.has_data_uri) {
      errors.push('SVG contains potentially dangerous data URIs (high severity).');
    }

    if (security_checks.has_event_handlers) {
      errors.push('SVG contains event handler attributes which are not allowed (high severity).');
    }

    if (security_checks.has_external_refs) {
      errors.push('SVG contains external references which are not allowed (medium severity).');
    }

    if (security_checks.has_remote_images) {
      errors.push('SVG contains remote image references which are not allowed (medium severity).');
    }

    if (security_checks.has_foreignObject) {
      errors.push('SVG contains foreignObject elements which are not allowed (medium severity).');
    }

    if (security_checks.has_use_element) {
      errors.push(
        'SVG contains external use elements which may reference external content (medium severity).'
      );
    }

    if (security_checks.has_css_imports) {
      errors.push('SVG contains CSS @import statements which are not allowed (medium severity).');
    }

    if (security_checks.malformed_xml) {
      errors.push('SVG content appears to be malformed or invalid (low severity).');
    }

    if (security_checks.size_exceeds_limit) {
      errors.push(
        `SVG exceeds maximum allowed size of 15KB (current size: ${Math.round(svgContent.length / 1024)}KB) (low severity).`
      );
    }

    if (security_checks.has_suspicious_content) {
      errors.push('SVG contains potentially malicious code patterns (high severity).');
    }

    // Determine overall severity based on violations
    let severity: 'low' | 'medium' | 'high' = 'low';

    if (
      security_checks.has_scripts ||
      security_checks.has_javascript_href ||
      security_checks.has_data_uri ||
      security_checks.has_event_handlers ||
      security_checks.has_suspicious_content
    ) {
      severity = 'high';
    } else if (
      security_checks.has_external_refs ||
      security_checks.has_remote_images ||
      security_checks.has_foreignObject ||
      security_checks.has_use_element ||
      security_checks.has_css_imports
    ) {
      severity = 'medium';
    }

    return {
      isValid: errors.length === 0,
      violations: security_checks,
      errors,
      severity: errors.length > 0 ? severity : undefined,
    };
  }

  /**
   * Cleans SVG content by removing potentially dangerous elements and attributes
   * @param svgContent - The SVG string to sanitize
   * @returns Cleaned SVG string that should be safe for rendering
   */
  static cleanSVG(svgContent: string): string {
    // Bail early on empty SVG
    if (!svgContent || typeof svgContent !== 'string') {
      return '';
    }

    let cleaned = svgContent;

    // Remove scripts and their content
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove inline event handlers
    cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: URLs and data: URLs with potentially executable content
    cleaned = cleaned.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');
    cleaned = cleaned.replace(
      /href\s*=\s*["']\s*data:(?:text\/html|application\/javascript)[^"']*["']/gi,
      'href="#"'
    );

    // Remove external references (http/https URLs)
    cleaned = cleaned.replace(/href\s*=\s*["'][^"']*:\/\/[^"']*["']/gi, 'href="#"');
    cleaned = cleaned.replace(/xlink:href\s*=\s*["'][^"']*:\/\/[^"']*["']/gi, 'xlink:href="#"');

    // Remove foreignObject elements and their content
    cleaned = cleaned.replace(
      /<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi,
      ''
    );

    // Remove use elements referencing external content
    cleaned = cleaned.replace(/<use[^>]*href\s*=\s*["'][^#][^"']*["'][^>]*\/>/gi, '');
    cleaned = cleaned.replace(
      /<use[^>]*href\s*=\s*["'][^#][^"']*["'][^>]*>(?:[\s\S]*?)<\/use>/gi,
      ''
    );

    // Remove CSS imports
    cleaned = cleaned.replace(/@import\s+["'][^"']*["'];?/gi, '');

    // Remove potentially dangerous attributes
    const dangerousAttrs = ['formaction', 'xlink:href', 'action', 'content', 'data', 'ping'];

    dangerousAttrs.forEach(attr => {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });

    // Ensure the SVG has a valid opening tag
    if (!/<svg[\s>]/i.test(cleaned)) {
      // If completely invalid, return a safe empty SVG
      if (!cleaned.includes('<svg')) {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>';
      }

      // Try to fix malformed opening tag
      cleaned = cleaned.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return cleaned;
  }
}

interface RequestInfo {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

/**
 * Handles rate limiting functionality for API endpoints
 * Limits requests based on a specified window and maximum number of requests
 */
export class RateLimiter {
  private static requests = new Map<string, RequestInfo>();

  /**
   * Checks if a request should be allowed based on rate limiting rules
   * @param identifier - Unique identifier for the requestor (usually IP address)
   * @returns Result indicating whether the request is allowed and retry time if not
   */
  static check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = Number(process.env.RATE_LIMIT_MAX || '10');

    const requestInfo = this.requests.get(identifier) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > requestInfo.resetTime) {
      // Reset window has passed, start a new counting period
      requestInfo.count = 1;
      requestInfo.resetTime = now + windowMs;
    } else if (requestInfo.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        retryAfter: requestInfo.resetTime - now,
      };
    } else {
      // Increment request count
      requestInfo.count++;
    }

    // Update stored request info
    this.requests.set(identifier, requestInfo);
    return { allowed: true };
  }

  /**
   * Clears all rate limit data
   * Primarily used for testing purposes
   */
  static clear(): void {
    this.requests.clear();
  }
}
