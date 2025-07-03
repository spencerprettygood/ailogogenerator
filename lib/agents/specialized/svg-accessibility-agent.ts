import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  SVGValidationAgentInput,
  SVGValidationResultOutput 
} from '../../types-agents';
import { SVGAccessibilityValidator, SVGAccessibilityScore } from '../../utils/svg-accessibility-validator';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { safeJsonParse } from '../../utils/json-utils';

/**
 * SVGAccessibilityAgent - Validates and improves SVG accessibility
 * 
 * This agent performs comprehensive accessibility assessment and applies
 * both automated and AI-assisted improvements to SVG logos for better
 * accessibility compliance (WCAG 2.1).
 */
export class SVGAccessibilityAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'svg-accessibility', 
      ['svg-validation'],
      {
        model: 'claude-3-haiku-20240307', // Use efficient model for accessibility analysis
        temperature: 0.1, // Low temperature for consistent, deterministic output
        maxTokens: 2048, // Increased for detailed accessibility improvements
        ...config
      }
    );
    
    this.systemPrompt = `You are an SVG Accessibility Specialist who improves SVG logos for WCAG 2.1 compliance.

Your task is to analyze the SVG code and provide specific improvements for:
1. Color contrast - Ensure sufficient contrast ratios for WCAG AA/AAA compliance
2. Text alternatives - Add appropriate title, desc, and aria attributes
3. Semantic structure - Use proper grouping and roles for screen readers
4. Scalability - Ensure readability at small sizes (16x16px minimum)
5. Interactive elements - Make any interactive elements keyboard accessible

IMPORTANT: You must return ONLY the improved SVG code without any explanation or markdown formatting.
Preserve the original design intent while making accessibility improvements.
If the SVG cannot be improved, return the original SVG unchanged.`;
  }
  
  /**
   * Generate the prompt for SVG accessibility improvement
   */
  protected async generatePrompt(input: SVGValidationAgentInput): Promise<string> {
    const { svg, brandName } = input;
    
    // Get accessibility assessment to include specific issues in the prompt
    const accessibilityResult = SVGAccessibilityValidator.validateAccessibility(svg);
    const accessibilityScore = accessibilityResult.accessibilityAssessment;
    
    let issuesPrompt = '';
    let needsAIImprovement = false;
    
    if (accessibilityScore) {
      const issues: string[] = [];
      
      if (accessibilityScore.colorContrast < 70) {
        issues.push('- Improve color contrast for better visibility (current score: ' + accessibilityScore.colorContrast + '/100)');
        needsAIImprovement = true;
      }
      
      if (accessibilityScore.textAlternatives < 70) {
        issues.push('- Add appropriate text alternatives (title, desc, aria-label) (current score: ' + accessibilityScore.textAlternatives + '/100)');
        needsAIImprovement = true;
      }
      
      if (accessibilityScore.semanticStructure < 70) {
        issues.push('- Improve semantic structure for screen readers (current score: ' + accessibilityScore.semanticStructure + '/100)');
        needsAIImprovement = true;
      }
      
      if (accessibilityScore.scalability < 70) {
        issues.push('- Enhance scalability for better rendering at small sizes (current score: ' + accessibilityScore.scalability + '/100)');
        needsAIImprovement = true;
      }
      
      if (accessibilityScore.interactiveElements < 70) {
        issues.push('- Make interactive elements more accessible (current score: ' + accessibilityScore.interactiveElements + '/100)');
        needsAIImprovement = true;
      }
      
      if (issues.length > 0) {
        issuesPrompt = issues.join('\n');
      }
      
      // Add specific suggestions from the validator
      if (accessibilityScore.accessibilitySuggestions && accessibilityScore.accessibilitySuggestions.length > 0) {
        issuesPrompt += '\n\nSpecific suggestions:\n' + accessibilityScore.accessibilitySuggestions.map(s => `- ${s}`).join('\n');
      }
    }
    
    // If no significant issues were found or the score is already high, we may not need AI improvement
    if (!needsAIImprovement || (accessibilityScore && accessibilityScore.overallAccessibility >= 80)) {
      // Return empty prompt to signal that we should use automated improvements only
      return '';
    }
    
    return `Please improve the accessibility of this SVG logo for "${brandName}".

Issues to address:
${issuesPrompt || '- General accessibility improvements'}

Here's the SVG to improve:

${svg}

Return only the improved SVG code without any explanations.`;
  }
  
  /**
   * Process SVG accessibility assessment and improvement
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGValidationResultOutput> {
    const input = originalInput as SVGValidationAgentInput;
    const { svg, brandName } = input;
    
    try {
      // Step 1: Get comprehensive accessibility assessment
      const accessibilityResult = SVGAccessibilityValidator.validateAccessibility(svg);
      
      // Step 2: If we already have good accessibility, return the assessment
      if (accessibilityResult.accessibilityAssessment && 
          accessibilityResult.accessibilityAssessment.overallAccessibility >= 80) {
        return {
          success: true,
          result: {
            svg,
            isValid: accessibilityResult.isValid,
            accessibilityScore: accessibilityResult.accessibilityAssessment.overallAccessibility,
            designFeedback: this.generateAccessibilityFeedback(accessibilityResult.accessibilityAssessment),
            modifications: ['No modifications needed - accessibility score already high']
          },
          tokensUsed: this.metrics.tokenUsage.total,
          processingTime: this.metrics.executionTime,
        };
      }
      
      // Step 3: Try to use AI improvements if available
      let improvedSvg = svg;
      let improvedByAI = false;
      const modifications: string[] = [];
      
      if (responseContent && responseContent.trim()) {
        // Extract SVG from AI response
        const svgMatch = responseContent.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) {
          const candidateSvg = svgMatch[0];
          
          // Validate the candidate SVG
          const candidateValidation = SVGAccessibilityValidator.validateAccessibility(candidateSvg);
          
          // Only use AI's improved version if it's valid and has better accessibility
          if (candidateValidation.isValid && 
              candidateValidation.accessibilityAssessment &&
              accessibilityResult.accessibilityAssessment &&
              candidateValidation.accessibilityAssessment.overallAccessibility > 
              accessibilityResult.accessibilityAssessment.overallAccessibility) {
            improvedSvg = candidateSvg;
            improvedByAI = true;
            modifications.push('Applied AI-based accessibility improvements');
          }
        }
      }
      
      // Step 4: If AI didn't improve it significantly, apply automated improvements
      if (!improvedByAI) {
        improvedSvg = this.applyAutomatedAccessibilityImprovements(svg, brandName);
        modifications.push('Applied automated accessibility improvements');
      }
      
      // Step 5: Get final assessment of the improved SVG
      const finalAssessment = SVGAccessibilityValidator.validateAccessibility(improvedSvg);
      
      // Return the improved SVG with accessibility assessment
      return {
        success: true,
        result: {
          svg: improvedSvg,
          isValid: finalAssessment.isValid,
          modifications,
          accessibilityScore: finalAssessment.accessibilityAssessment?.overallAccessibility || 0,
          designFeedback: this.generateAccessibilityFeedback(finalAssessment.accessibilityAssessment)
        },
        tokensUsed: this.metrics.tokenUsage.total,
        processingTime: this.metrics.executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: handleError({
          error: 'SVG accessibility process failed',
          category: ErrorCategory.SVG,
          details: { originalError: error instanceof Error ? error.message : String(error) },
          retryable: true,
        }),
      };
    }
  }
  
  /**
   * Apply automated accessibility improvements to an SVG
   * 
   * @param svg - Original SVG content
   * @param brandName - Brand name for text alternatives
   * @returns Improved SVG content
   */
  private applyAutomatedAccessibilityImprovements(svg: string, brandName: string): string {
    let improvedSvg = svg;
    
    // 1. Add title if missing
    if (!/<title[^>]*>/i.test(improvedSvg)) {
      improvedSvg = improvedSvg.replace(
        /<svg/i, 
        `<svg>\n  <title>${brandName} Logo</title>`
      );
    }
    
    // 2. Add description if missing
    if (!/<desc[^>]*>/i.test(improvedSvg)) {
      improvedSvg = improvedSvg.replace(
        /<\/title>\s*(?=<)/i, 
        `</title>\n  <desc>Logo for ${brandName}</desc>`
      );
      
      // If there was no title to replace after, add after svg opening tag
      if (!/<\/title>/i.test(improvedSvg) && !/<desc[^>]*>/i.test(improvedSvg)) {
        improvedSvg = improvedSvg.replace(
          /<svg[^>]*>/i, 
          `$&\n  <desc>Logo for ${brandName}</desc>`
        );
      }
    }
    
    // 3. Add role and aria-label to SVG root if missing
    if (!/<svg[^>]*role\s*=/i.test(improvedSvg)) {
      improvedSvg = improvedSvg.replace(
        /<svg([^>]*?)>/i, 
        '<svg$1 role="img">'
      );
    }
    
    if (!/<svg[^>]*aria-label\s*=/i.test(improvedSvg)) {
      improvedSvg = improvedSvg.replace(
        /<svg([^>]*?)>/i, 
        `<svg$1 aria-label="${brandName} Logo">`
      );
    }
    
    // 4. Add viewBox if missing (improves scalability)
    if (!/<svg[^>]*viewBox\s*=/i.test(improvedSvg)) {
      const widthMatch = improvedSvg.match(/width="([\d\.]+)"/);
      const heightMatch = improvedSvg.match(/height="([\d\.]+)"/);
      
      if (widthMatch && heightMatch) {
        const width = widthMatch[1] ? parseFloat(widthMatch[1]) : 0;
        const height = heightMatch[1] ? parseFloat(heightMatch[1]) : 0;
        if (width > 0 && height > 0) {
          improvedSvg = improvedSvg.replace(
            /<svg([^>]*?)>/i, 
            `<svg$1 viewBox="0 0 ${width} ${height}">`
          );
        }
      } 
    }
    
    // 5. Add missing aria-labels to interactive elements
    improvedSvg = improvedSvg.replace(
      /<a([^>]*?)>/gi,
      (match, attributes) => {
        if (!attributes.includes('aria-label')) {
          return `<a${attributes} aria-label="${brandName} link">`;
        }
        return match;
      }
    );
    
    // 6. Improve stroke widths for better visibility at small sizes
    improvedSvg = improvedSvg.replace(
      /stroke-width\s*=\s*["'](0\.\d+|0|1)["']/gi,
      'stroke-width="1.5"'
    );
    
    // 7. Ensure focusable elements have appropriate attributes
    improvedSvg = improvedSvg.replace(
      /<(circle|rect|path|polygon)([^>]*?)>/gi,
      (match, tagName, attributes) => {
        // Only add focusable attributes if the element has interactive attributes
        if (attributes.includes('onclick') || attributes.includes('href')) {
          if (!attributes.includes('tabindex')) {
            attributes += ' tabindex="0"';
          }
          if (!attributes.includes('role')) {
            attributes += ' role="button"';
          }
        }
        return `<${tagName}${attributes}>`;
      }
    );
    
    return improvedSvg;
  }
  
  /**
   * Generate human-readable feedback based on accessibility assessment
   * 
   * @param assessment - Accessibility assessment
   * @returns Human-readable feedback
   */
  private generateAccessibilityFeedback(assessment?: SVGAccessibilityScore): string {
    if (!assessment) {
      return 'Unable to assess SVG accessibility.';
    }
    
    const { overallAccessibility, accessibilitySuggestions } = assessment;
    
    let feedback = '';
    
    if (overallAccessibility >= 90) {
      feedback = 'Excellent accessibility! This SVG meets all major accessibility requirements.';
    } else if (overallAccessibility >= 75) {
      feedback = 'Good accessibility. This SVG meets most accessibility requirements.';
    } else if (overallAccessibility >= 50) {
      feedback = 'Moderate accessibility. This SVG meets basic accessibility requirements but could be improved.';
    } else {
      feedback = 'Poor accessibility. This SVG needs significant improvements to meet accessibility standards.';
    }
    
    // Add specific suggestions if available
    if (accessibilitySuggestions && accessibilitySuggestions.length > 0) {
      feedback += '\n\nSuggested improvements:\n' + accessibilitySuggestions.map(s => `- ${s}`).join('\n');
    }
    
    return feedback;
  }
}