export interface SecurityValidationResult {
  isValid: boolean;
  violations: Record<string, boolean>;
  errors: string[];
}

export class InputSanitizer {
  static sanitizeBrief(input: string): string {
    // Remove potential injection patterns
    const patterns = [
      /ignore\s+previous\s+instructions/gi,
      /system\s*:/gi,
      /assistant\s*:/gi,
      /<script.*?>/gi,
      /javascript:/gi,
      /\{\{.*?\}\}/g, // Template injection
      /\$\{.*?\}/g    // Variable injection
    ];
    
    let sanitized = input;
    patterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    });
    
    return sanitized.slice(0, 2000); // Length limit
  }
  
  static validateSVG(svgContent: string): SecurityValidationResult {
    const errors: string[] = [];
    
    // Define security checks
    const security_checks = {
      has_scripts: /<script/i.test(svgContent),
      has_external_refs: /href\s*=\s*["'][^"']*:\/\//i.test(svgContent),
      has_event_handlers: /on\w+\s*=/i.test(svgContent),
      has_foreignObject: /<foreignObject/i.test(svgContent),
      has_use_element: /<use/i.test(svgContent),
      size_exceeds_limit: svgContent.length > 15360 // 15KB
    };
    
    // Generate errors for violations
    if (security_checks.has_scripts) {
      errors.push("SVG contains script tags which are not allowed.");
    }
    
    if (security_checks.has_external_refs) {
      errors.push("SVG contains external references which are not allowed.");
    }
    
    if (security_checks.has_event_handlers) {
      errors.push("SVG contains event handler attributes which are not allowed.");
    }
    
    if (security_checks.has_foreignObject) {
      errors.push("SVG contains foreignObject elements which are not allowed.");
    }
    
    if (security_checks.has_use_element) {
      errors.push("SVG contains use elements which may reference external content.");
    }
    
    if (security_checks.size_exceeds_limit) {
      errors.push(`SVG exceeds maximum allowed size of 15KB (current size: ${Math.round(svgContent.length / 1024)}KB).`);
    }
    
    return {
      isValid: errors.length === 0,
      violations: security_checks,
      errors
    };
  }
  
  static cleanSVG(svgContent: string): string {
    // Remove scripts
    let cleaned = svgContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers
    cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove external references
    cleaned = cleaned.replace(/href\s*=\s*["'][^"']*:\/\/[^"']*["']/gi, '');
    
    // Remove foreignObject elements
    cleaned = cleaned.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    
    // Remove use elements
    cleaned = cleaned.replace(/<use\b[^<]*(?:(?!<\/use>)<[^<]*)*<\/use>/gi, '');
    
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
      resetTime: now + windowMs
    };
    
    if (now > requestInfo.resetTime) {
      // Reset window has passed, start a new counting period
      requestInfo.count = 1;
      requestInfo.resetTime = now + windowMs;
    } else if (requestInfo.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        retryAfter: requestInfo.resetTime - now
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