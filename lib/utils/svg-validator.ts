/**
 * Advanced SVG Validation and Security Module
 *
 * This module provides comprehensive SVG validation, security scanning,
 * automatic repair, and optimization functionality.
 */

export interface ValidationIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface SVGValidationResult {
  isValid: boolean;
  violations: Record<string, boolean>;
  errors: string[];
  warnings: string[];
  securityScore?: number;
  accessibilityScore?: number;
  optimizationScore?: number;
  issues: ValidationIssue[];
}

export interface SVGRepairResult {
  svg: string;
  isRepaired: boolean;
  modifications: string[];
  remainingIssues: string[];
  repaired: string;
  issuesFixed: ValidationIssue[];
  issuesRemaining: ValidationIssue[];
}

export interface SVGOptimizationResult {
  svg: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  optimized: string;
  optimizations: string[];
}

/**
 * SVG Validation and Security Class
 *
 * Provides comprehensive tools for validating, securing, and optimizing SVG content
 */
export class SVGValidator {
  // Configuration for validation
  private static config = {
    // Maximum file size in bytes (15KB)
    maxSize: 15 * 1024,

    // Elements that are considered dangerous
    disallowedElements: [
      'script',
      'foreignObject',
      'iframe',
      'use',
      'embed',
      'object',
      'audio',
      'video',
      'animate',
      'set',
      'animateTransform',
      'animateMotion',
    ],

    // Attributes that are considered dangerous
    disallowedAttributes: [
      // Event handlers
      /^on\w+/i,

      // External references
      'href',
      'xlink:href',

      // Executable content
      'eval',
      'javascript',
      'data',
    ],

    // Protocols that are considered dangerous
    disallowedProtocols: ['javascript:', 'data:', 'vbscript:', 'file:'],

    // SVG root element must have these attributes for proper rendering
    requiredRootAttributes: ['width', 'height', 'viewBox'],

    // Maximum number of nodes in the SVG (to prevent DoS)
    maxNodes: 1000,
  };

  /**
   * Validates an SVG string for security and structure issues
   *
   * @param svgContent - The SVG content to validate
   * @returns Validation result with details about issues found
   */
  static validate(svgContent: string): SVGValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if content is empty or not a string
    if (!svgContent || typeof svgContent !== 'string') {
      errors.push('SVG content is empty or not a string');
      const issues: ValidationIssue[] = [
        {
          type: 'validation',
          severity: 'critical',
          message: 'SVG content is empty or not a string',
        },
      ];
      return {
        isValid: false,
        violations: { empty_content: true },
        errors,
        warnings,
        issues,
        securityScore: 0,
        accessibilityScore: 0,
        optimizationScore: 0,
      };
    }

    // Basic structure checks
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      errors.push('SVG is missing opening or closing SVG tags');
      const issues: ValidationIssue[] = [
        {
          type: 'validation',
          severity: 'critical',
          message: 'SVG is missing opening or closing SVG tags',
        },
      ];
      return {
        isValid: false,
        violations: { missing_svg_tags: true },
        errors,
        warnings,
        issues,
        securityScore: 0,
        accessibilityScore: 0,
        optimizationScore: 0,
      };
    }

    // Size check
    if (Buffer.byteLength(svgContent, 'utf8') > this.config.maxSize) {
      errors.push(`SVG exceeds maximum allowed size of ${this.config.maxSize / 1024}KB`);
    }

    // Define security checks
    const securityChecks: Record<string, boolean> = {
      oversized: Buffer.byteLength(svgContent, 'utf8') > this.config.maxSize,
      has_scripts: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i.test(svgContent),
      has_disallowed_elements: false,
      has_event_handlers: false,
      has_external_urls: false,
      has_disallowed_protocols: false,
      malformed_xml: false,
      excessive_nodes: this.countNodes(svgContent) > this.config.maxNodes,
      missing_required_attributes: false,
      missing_accessibility: !svgContent.includes('<title>') && !svgContent.includes('<desc>'),
    };

    // Check for disallowed elements
    for (const element of this.config.disallowedElements) {
      const pattern = new RegExp(
        `<${element}\\b[^<]*(?:(?!<\\/${element}>)<[^<]*)*<\\/${element}>`,
        'i'
      );
      if (pattern.test(svgContent)) {
        securityChecks.has_disallowed_elements = true;
        errors.push(`SVG contains disallowed <${element}> element`);
      }
    }

    // Check for event handlers and other disallowed attributes
    for (const attrPattern of this.config.disallowedAttributes) {
      const pattern =
        typeof attrPattern === 'string'
          ? new RegExp(`\\s${attrPattern}\\s*=\\s*["\'][^"\']*["\']`, 'i')
          : new RegExp(`\\s${attrPattern.source}\\s*=\\s*["\'][^"\']*["\']`, 'i');

      if (pattern.test(svgContent)) {
        securityChecks.has_event_handlers = true;
        errors.push(
          `SVG contains disallowed attribute: ${typeof attrPattern === 'string' ? attrPattern : attrPattern.source}`
        );
      }
    }

    // Check for external URLs
    if (/<[^>]+(?:href|src|data)\s*=\s*["'][^"']*:\/\/[^"']*["']/i.test(svgContent)) {
      securityChecks.has_external_urls = true;
      warnings.push('SVG contains external URL references which may be a security risk');
    }

    // Check for disallowed protocols
    for (const protocol of this.config.disallowedProtocols) {
      if (svgContent.includes(protocol)) {
        securityChecks.has_disallowed_protocols = true;
        errors.push(`SVG contains disallowed protocol: ${protocol}`);
      }
    }

    // Check for required root attributes
    const svgTagMatch = svgContent.match(/<svg\s+[^>]*>/i);
    if (svgTagMatch) {
      const svgTag = svgTagMatch[0];
      for (const attr of this.config.requiredRootAttributes) {
        if (!new RegExp(`\\s${attr}\\s*=`, 'i').test(svgTag)) {
          securityChecks.missing_required_attributes = true;
          warnings.push(`SVG root element is missing recommended attribute: ${attr}`);
        }
      }
    }

    // Check for accessibility features
    if (securityChecks.missing_accessibility) {
      warnings.push('SVG is missing title or desc elements for accessibility');
    }

    // Try to parse XML structure for malformed XML check
    try {
      // Check if we're in a browser environment
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const parserErrors = doc.getElementsByTagName('parsererror');
        if (parserErrors.length > 0) {
          securityChecks.malformed_xml = true;
          errors.push('SVG contains malformed XML');
        }
      } else {
        // In Node.js environment, use the basic check
        securityChecks.malformed_xml = !this.isWellFormedXML(svgContent);
        if (securityChecks.malformed_xml) {
          errors.push('SVG likely contains malformed XML (basic check)');
        }
      }
    } catch (e) {
      // Fallback to basic check if parsing fails for any reason
      securityChecks.malformed_xml = !this.isWellFormedXML(svgContent);
      if (securityChecks.malformed_xml) {
        errors.push('SVG likely contains malformed XML (basic check)');
      }
    }

    // Check if excessive nesting is used (potential DoS vector)
    if (this.getMaxNestingLevel(svgContent) > 20) {
      warnings.push('SVG has excessive nesting levels which may cause rendering issues');
    }

    // Calculate security, accessibility and optimization scores
    const securityScore = this.calculateSecurityScore(securityChecks);
    const accessibilityScore = this.calculateAccessibilityScore(securityChecks);
    const optimizationScore = this.calculateOptimizationScore(svgContent);

    // Determine overall validity
    const isValid = errors.length === 0;

    // Create a list of issues in the format expected by SVGValidationAgent
    const issues: ValidationIssue[] = [
      ...errors.map(msg => {
        // Determine severity based on the error message
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
        if (msg.includes('script') || msg.includes('event handler') || msg.includes('dangerous')) {
          severity = 'critical';
        } else if (msg.includes('disallowed') || msg.includes('external')) {
          severity = 'high';
        }

        return {
          type: 'security',
          severity,
          message: msg,
        };
      }),
      ...warnings.map(msg => ({
        type: 'warning',
        severity: 'low' as const,
        message: msg,
      })),
    ];

    return {
      isValid,
      violations: securityChecks,
      errors,
      warnings,
      securityScore,
      accessibilityScore,
      optimizationScore,
      issues,
    };
  }

  /**
   * Calculates a security score from 0-100 based on security checks
   *
   * @param securityChecks - The security check results
   * @returns A score from 0-100
   */
  private static calculateSecurityScore(securityChecks: Record<string, boolean>): number {
    // Critical security issues that should reduce score significantly
    const criticalIssues = [
      'has_scripts',
      'has_disallowed_elements',
      'has_event_handlers',
      'has_disallowed_protocols',
    ];

    // Less severe issues
    const minorIssues = ['has_external_urls', 'oversized', 'excessive_nodes'];

    let score = 100;

    // Subtract 25 points for each critical issue
    for (const issue of criticalIssues) {
      if (securityChecks[issue]) {
        score -= 25;
      }
    }

    // Subtract 10 points for each minor issue
    for (const issue of minorIssues) {
      if (securityChecks[issue]) {
        score -= 10;
      }
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates an accessibility score from 0-100
   *
   * @param securityChecks - The security check results
   * @returns A score from 0-100
   */
  private static calculateAccessibilityScore(securityChecks: Record<string, boolean>): number {
    let score = 100;

    // Missing accessibility elements (title/desc)
    if (securityChecks.missing_accessibility) {
      score -= 50;
    }

    // Missing required attributes that affect rendering
    if (securityChecks.missing_required_attributes) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Calculates an optimization score from 0-100
   *
   * @param svgContent - The SVG content to analyze
   * @returns A score from 0-100
   */
  private static calculateOptimizationScore(svgContent: string): number {
    let score = 100;

    // Check for unnecessary whitespace
    if (/>[\s]{2,}</i.test(svgContent)) {
      score -= 10;
    }

    // Check for comments
    if (/<!--[\s\S]*?-->/i.test(svgContent)) {
      score -= 5;
    }

    // Check for empty groups
    if (/<g[^>]*>\s*<\/g>/i.test(svgContent)) {
      score -= 5;
    }

    // Check for metadata
    if (/<metadata>[\s\S]*?<\/metadata>/i.test(svgContent)) {
      score -= 5;
    }

    // Check for editor-specific metadata/attributes
    if (
      /inkscape:|sodipodi:|xmlns:i="http:\/\/ns.adobe.com\/AdobeIllustrator\/10.0\/"|sketch:type/i.test(
        svgContent
      )
    ) {
      score -= 10;
    }

    // Check for precision of decimal values
    const decimalMatches = svgContent.match(/\d+\.\d{3,}/g);
    if (decimalMatches && decimalMatches.length > 0) {
      score -= Math.min(20, decimalMatches.length * 2);
    }

    // Size penalty based on total size
    const size = Buffer.byteLength(svgContent, 'utf8');
    if (size > 10 * 1024) {
      // Over 10KB
      score -= 15;
    } else if (size > 5 * 1024) {
      // Over 5KB
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Attempts to repair common SVG issues
   *
   * @param svgContent - The SVG content to repair
   * @returns Repaired SVG and details about modifications made
   */
  static repair(svgContent: string): SVGRepairResult {
    const modifications: string[] = [];
    let repairedSvg = svgContent;

    // Basic validation to check if we can process this
    if (!svgContent || typeof svgContent !== 'string' || !svgContent.includes('<svg')) {
      return {
        svg: svgContent,
        isRepaired: false,
        modifications: [],
        remainingIssues: ['SVG is invalid or empty and cannot be repaired'],
        repaired: svgContent,
        issuesFixed: [],
        issuesRemaining: [
          {
            type: 'validation',
            severity: 'critical',
            message: 'SVG is invalid or empty and cannot be repaired',
          },
        ],
      };
    }

    // Remove scripts
    const hasScripts = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i.test(repairedSvg);
    if (hasScripts) {
      repairedSvg = repairedSvg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      modifications.push('Removed script elements');
    }

    // Remove disallowed elements
    for (const element of this.config.disallowedElements) {
      const pattern = new RegExp(
        `<${element}\\b[^<]*(?:(?!<\\/${element}>)<[^<]*)*<\\/${element}>`,
        'gi'
      );
      if (pattern.test(repairedSvg)) {
        repairedSvg = repairedSvg.replace(pattern, '');
        modifications.push(`Removed ${element} elements`);
      }
    }

    // Remove event handlers and other dangerous attributes
    for (const attrPattern of this.config.disallowedAttributes) {
      const pattern =
        typeof attrPattern === 'string'
          ? new RegExp(`\\s${attrPattern}\\s*=\\s*["\'][^"\']*["\']`, 'gi')
          : new RegExp(`\\s${attrPattern.source}\\s*=\\s*["\'][^"\']*["\']`, 'gi');

      if (pattern.test(repairedSvg)) {
        repairedSvg = repairedSvg.replace(pattern, '');
        modifications.push(
          `Removed dangerous attributes: ${typeof attrPattern === 'string' ? attrPattern : attrPattern.source}`
        );
      }
    }

    // Remove external URLs and disallowed protocols
    for (const protocol of this.config.disallowedProtocols) {
      const protocolPattern = new RegExp(
        `\\s(?:href|src|data)\\s*=\\s*["']\\s*${protocol}[^"']*["']`,
        'gi'
      );
      if (protocolPattern.test(repairedSvg)) {
        repairedSvg = repairedSvg.replace(protocolPattern, '');
        modifications.push(`Removed URLs with disallowed protocol: ${protocol}`);
      }
    }

    // Add missing viewBox if needed
    if (
      !repairedSvg.includes('viewBox') &&
      repairedSvg.includes('width') &&
      repairedSvg.includes('height')
    ) {
      // Extract width and height
      const widthMatch = repairedSvg.match(/width\s*=\s*["']([0-9.]+)/i);
      const heightMatch = repairedSvg.match(/height\s*=\s*["']([0-9.]+)/i);

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
        repairedSvg = repairedSvg.replace(/<svg/, `<svg viewBox=\"0 0 ${width} ${height}\"`);
        modifications.push('Added viewBox attribute based on width and height');
      }
    }

    // Fix potential malformed XML issues
    if (this.getXMLErrors(repairedSvg).length > 0) {
      repairedSvg = this.fixMalformedXML(repairedSvg);
      modifications.push('Attempted to fix malformed XML');
    }

    // Check if the SVG is still valid after repairs
    const validationResult = this.validate(repairedSvg);

    // Convert remaining issues to ValidationIssue format
    const issuesRemaining: ValidationIssue[] = validationResult.errors.map(error => ({
      type: 'security',
      severity: 'medium',
      message: error,
    }));

    // Create fixed issues list
    const issuesFixed: ValidationIssue[] = modifications.map(mod => ({
      type: 'repair',
      severity: 'medium',
      message: mod,
    }));

    return {
      svg: repairedSvg,
      repaired: repairedSvg,
      isRepaired: modifications.length > 0,
      modifications,
      remainingIssues: validationResult.errors,
      issuesFixed,
      issuesRemaining,
    };
  }

  /**
   * Optimizes SVG content for size and performance
   *
   * @param svgContent - The SVG content to optimize
   * @returns Optimized SVG and size reduction metrics
   */
  static optimize(svgContent: string): SVGOptimizationResult {
    const originalSize = Buffer.byteLength(svgContent, 'utf8');
    let optimizedSvg = svgContent;

    // Remove comments
    optimizedSvg = optimizedSvg.replace(/<!--[\s\S]*?-->/g, '');

    // Remove unnecessary whitespace
    optimizedSvg = optimizedSvg
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
      .replace(/\s+>/g, '>') // Remove space before closing tags
      .replace(/<\s+/g, '<'); // Remove space after opening tags

    // Optimize path data (remove unnecessary decimals)
    optimizedSvg = optimizedSvg.replace(/(\d+\.\d{2})\d+/g, '$1');

    // Remove empty attributes
    optimizedSvg = optimizedSvg.replace(/\s+\w+=""/g, '');

    // Remove metadata if present
    optimizedSvg = optimizedSvg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');

    // Remove empty groups
    optimizedSvg = optimizedSvg.replace(/<g[^>]*>\s*<\/g>/g, '');

    // Calculate size metrics
    const optimizedSize = Buffer.byteLength(optimizedSvg, 'utf8');
    const reductionPercent = Math.round((1 - optimizedSize / originalSize) * 100);

    const optimizations: string[] = [];

    // Track which optimizations were performed
    if (svgContent !== optimizedSvg) {
      if (svgContent.includes('<!--') && !optimizedSvg.includes('<!--')) {
        optimizations.push('Removed comments');
      }

      if (/>[\s]{2,}</g.test(svgContent) && !/>[\s]{2,}</g.test(optimizedSvg)) {
        optimizations.push('Removed unnecessary whitespace');
      }

      if (svgContent.includes('<metadata>') && !optimizedSvg.includes('<metadata>')) {
        optimizations.push('Removed metadata elements');
      }

      if (/<g[^>]*>\s*<\/g>/g.test(svgContent) && !/<g[^>]*>\s*<\/g>/g.test(optimizedSvg)) {
        optimizations.push('Removed empty group elements');
      }

      if (reductionPercent > 0) {
        optimizations.push(
          `Reduced file size by ${reductionPercent}% (${originalSize} → ${optimizedSize} bytes)`
        );
      }

      // If we didn't detect any specific optimizations but the file changed
      if (optimizations.length === 0) {
        optimizations.push('Applied general SVG optimization');
      }
    }

    return {
      svg: optimizedSvg,
      optimized: optimizedSvg,
      originalSize,
      optimizedSize,
      reductionPercent,
      optimizations,
    };
  }

  /**
   * Validates, repairs, and optimizes SVG content in a single operation
   *
   * @param svgContent - The SVG content to process
   * @param options - Processing options
   * @returns Processed SVG with validation, repair, and optimization results
   */
  static process(
    svgContent: string,
    options: {
      repair?: boolean;
      optimize?: boolean;
    } = {}
  ): {
    original: string;
    processed: string;
    validation: SVGValidationResult;
    repair?: SVGRepairResult;
    optimization?: SVGOptimizationResult;
    success: boolean;
    overallScore: number;
  } {
    const { repair = true, optimize = true } = options;

    // Step 1: Validate the SVG
    const validationResult = this.validate(svgContent);
    let processedSvg = svgContent;
    let repairResult: SVGRepairResult | undefined;
    let optimizationResult: SVGOptimizationResult | undefined;

    // Step 2: Repair if needed and requested
    if (!validationResult.isValid && repair) {
      repairResult = this.repair(svgContent);
      processedSvg = repairResult.svg;

      // Re-validate after repair
      const revalidationResult = this.validate(processedSvg);
      if (!revalidationResult.isValid) {
        return {
          original: svgContent,
          processed: svgContent, // Return original if repair didn't fix it
          validation: validationResult,
          repair: repairResult,
          success: false,
          overallScore: 0,
        };
      }
    } else if (!validationResult.isValid) {
      // Invalid but repair not requested
      return {
        original: svgContent,
        processed: svgContent,
        validation: validationResult,
        success: false,
        overallScore: 0,
      };
    }

    // Step 3: Optimize if requested
    if (optimize) {
      optimizationResult = this.optimize(processedSvg);
      processedSvg = optimizationResult.svg;

      // Final validation after optimization
      const finalValidation = this.validate(processedSvg);
      if (!finalValidation.isValid) {
        // If optimization broke it, revert to pre-optimization
        processedSvg = repairResult ? repairResult.svg : svgContent;
        return {
          original: svgContent,
          processed: processedSvg,
          validation: validationResult,
          repair: repairResult,
          success: repairResult ? repairResult.isRepaired : validationResult.isValid,
          overallScore:
            Math.round(
              (validationResult.securityScore || 0) + (validationResult.accessibilityScore || 0)
            ) / 2,
        };
      }
    }

    // Calculate overall score based on available metrics
    let overallScore = 0;
    let scoreCount = 0;

    if (validationResult.securityScore) {
      overallScore += validationResult.securityScore;
      scoreCount++;
    }

    if (validationResult.accessibilityScore) {
      overallScore += validationResult.accessibilityScore;
      scoreCount++;
    }

    if (validationResult.optimizationScore) {
      overallScore += validationResult.optimizationScore;
      scoreCount++;
    }

    overallScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : 50;

    return {
      original: svgContent,
      processed: processedSvg,
      validation: validationResult,
      repair: repairResult,
      optimization: optimizationResult,
      success: true,
      overallScore,
    };
  }

  /**
   * Counts the number of XML nodes in an SVG string
   *
   * @param svgContent - The SVG content to analyze
   * @returns Number of nodes in the SVG
   */
  private static countNodes(svgContent: string): number {
    // Simple regex-based node counting
    // This is an approximation, not a full XML parser
    const openingTags = svgContent.match(/<[^/][^>]*>/g);
    return openingTags ? openingTags.length : 0;
  }

  /**
   * Gets the maximum nesting level in an SVG
   *
   * @param svgContent - The SVG content to analyze
   * @returns Maximum nesting level
   */
  private static getMaxNestingLevel(svgContent: string): number {
    let maxLevel = 0;
    let currentLevel = 0;

    // Simple tokenizer
    for (let i = 0; i < svgContent.length; i++) {
      if (svgContent[i] === '<' && svgContent[i + 1] !== '/') {
        // Opening tag
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (svgContent[i] === '<' && svgContent[i + 1] === '/') {
        // Closing tag
        currentLevel--;
      }
    }

    return maxLevel;
  }

  /**
   * Performs a basic check for well-formed XML
   *
   * @param svgContent - The SVG content to check
   * @returns Whether the XML appears to be well-formed
   */
  private static isWellFormedXML(svgContent: string): boolean {
    // This is a very basic check, not a full XML validator
    const tags: string[] = [];
    const tagPattern = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
    let match;

    while ((match = tagPattern.exec(svgContent)) !== null) {
      const fullTag = match[0];
      if (match && match[1]) {
        const tagName = match[1].toLowerCase();

        if (!fullTag.includes('/>') && !fullTag.startsWith('</')) {
          // Opening tag
          tags.push(tagName);
        } else if (fullTag.startsWith('</')) {
          // Closing tag
          if (tags.length === 0 || tags.pop() !== tagName) {
            return false; // Mismatched closing tag
          }
        }
      }
    }

    return tags.length === 0; // All tags should be closed
  }

  /**
   * Gets a list of XML syntax errors in the SVG
   *
   * @param svgContent - The SVG content to check
   * @returns List of XML syntax errors
   */
  private static getXMLErrors(svgContent: string): string[] {
    const errors: string[] = [];

    // Check for mismatched tags
    const tags: string[] = [];
    const tagPattern = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
    let match;

    while ((match = tagPattern.exec(svgContent)) !== null) {
      const fullTag = match[0];
      if (match && match[1]) {
        const tagName = match[1].toLowerCase();

        if (!fullTag.includes('/>') && !fullTag.startsWith('</')) {
          // Opening tag
          tags.push(tagName);
        } else if (fullTag.startsWith('</')) {
          // Closing tag
          if (tags.length === 0) {
            errors.push(`Unexpected closing tag: ${tagName}`);
          } else if (tags.pop() !== tagName) {
            errors.push(`Mismatched closing tag: ${tagName}`);
          }
        }
      }
    }

    if (tags.length > 0) {
      errors.push(`Unclosed tags: ${tags.join(', ')}`);
    }

    // Check for invalid characters in attribute values
    const attrPattern = /(\w+)=["']([^"']*)["']/g;
    while ((match = attrPattern.exec(svgContent)) !== null) {
      const attrName = match[1];
      const attrValue = match[2];

      if (attrValue && (attrValue.includes('<') || attrValue.includes('>'))) {
        errors.push(`Invalid characters in attribute: ${attrName}`);
      }
    }

    return errors;
  }

  /**
   * Attempts to fix malformed XML in the SVG
   *
   * @param svgContent - The SVG content to fix
   * @returns Fixed SVG content
   */
  private static fixMalformedXML(svgContent: string): string {
    let fixedSvg = svgContent;

    // Fix unclosed tags
    const unclosedTags: string[] = [];
    const tagPattern = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
    let match;

    while ((match = tagPattern.exec(fixedSvg)) !== null) {
      const fullTag = match[0];
      const tagName = match[1]?.toLowerCase();

      if (tagName) {
        if (!fullTag.includes('/>') && !fullTag.startsWith('</')) {
          // Opening tag
          unclosedTags.push(tagName);
        } else if (fullTag.startsWith('</')) {
          // Closing tag
          if (unclosedTags.length > 0) {
            unclosedTags.pop();
          }
        }
      }
    }

    // Close any remaining open tags
    for (let i = unclosedTags.length - 1; i >= 0; i--) {
      fixedSvg += `</${unclosedTags[i]}>`;
    }

    // Fix invalid attribute values
    fixedSvg = fixedSvg.replace(/(\w+)=["']([^"']*)["']/g, (match, attrName, attrValue) => {
      // Replace < and > with entities in attribute values
      const sanitizedValue = attrValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `${attrName}="${sanitizedValue}"`;
    });

    // Ensure proper XML declaration
    if (!fixedSvg.trim().startsWith('<?xml') && !fixedSvg.trim().startsWith('<svg')) {
      fixedSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${fixedSvg}`;
    }

    return fixedSvg;
  }
}
