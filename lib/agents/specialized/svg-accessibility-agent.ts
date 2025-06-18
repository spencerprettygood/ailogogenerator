import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SVGValidationAgentInput,
  SVGValidationAgentOutput 
} from '../../types-agents';
import { SVGAccessibilityValidator, SVGAccessibilityScore } from '../../utils/svg-accessibility-validator';

/**
 * SVGAccessibilityAgent - Validates and improves SVG accessibility
 */
export class SVGAccessibilityAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'svg-accessibility', 
      ['svg-validation', 'design-theory'],
      {
        model: 'claude-3-5-haiku-20240307', // Use faster model for validation
        temperature: 0.1, // Low temperature for consistent, deterministic output
        maxTokens: 1000,
        ...config
      }
    );
    
    // Initialize system prompt for when Claude's help is needed for complex repairs
    this.systemPrompt = `You are an SVG Accessibility Specialist who helps improve SVG logos for accessibility.

Your task is to analyze the SVG code and provide specific improvements for:
1. Color contrast - Ensure sufficient contrast ratios for WCAG compliance
2. Text alternatives - Add appropriate title, desc, and aria attributes
3. Semantic structure - Use proper grouping and roles for screen readers
4. Scalability - Ensure readability at small sizes
5. Interactive elements - Make interactive elements keyboard accessible

Always preserve the original design intent while making your improvements.
Only provide the improved SVG code without explanation.`;
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
    
    if (accessibilityScore) {
      // Add details about the specific accessibility issues
      if (accessibilityScore.colorContrast < 70) {
        issuesPrompt += '- Improve color contrast for better visibility\n';
      }
      
      if (accessibilityScore.textAlternatives < 70) {
        issuesPrompt += '- Add appropriate text alternatives (title, desc, aria-label)\n';
      }
      
      if (accessibilityScore.semanticStructure < 70) {
        issuesPrompt += '- Improve semantic structure for screen readers\n';
      }
      
      if (accessibilityScore.scalability < 70) {
        issuesPrompt += '- Enhance scalability for better rendering at small sizes\n';
      }
      
      if (accessibilityScore.interactiveElements < 70) {
        issuesPrompt += '- Make interactive elements more accessible\n';
      }
    }
    
    // If no specific issues were found, use a general prompt
    if (!issuesPrompt) {
      issuesPrompt = '- General accessibility improvements\n';
    }
    
    return `Please improve the accessibility of this SVG logo for "${brandName}".

Issues to address:
${issuesPrompt}

Here's the SVG to improve:

\`\`\`svg
${svg}
\`\`\`

Return only the improved SVG code without any explanations.`;
  }
  
  /**
   * Process SVG accessibility assessment and improvement
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGValidationAgentOutput> {
    const input = originalInput as SVGValidationAgentInput;
    const { svg, brandName } = input;
    
    try {
      // Step 1: Get comprehensive accessibility assessment
      const accessibilityResult = SVGAccessibilityValidator.validateAccessibility(svg);
      
      // Step 2: If we don't need improvements, return the assessment
      if (accessibilityResult.accessibilityAssessment && 
          accessibilityResult.accessibilityAssessment.overallAccessibility >= 80) {
        return {
          success: true,
          result: {
            svg,
            isValid: accessibilityResult.isValid,
            accessibilityScore: accessibilityResult.accessibilityAssessment.overallAccessibility,
            designFeedback: this.generateAccessibilityFeedback(accessibilityResult.accessibilityAssessment),
            accessibilityAssessment: accessibilityResult.accessibilityAssessment
          }
        };
      }
      
      // Step 3: If we have Claude's response, try to use it for improvements
      let improvedSvg = svg;
      let improvedByAI = false;
      
      if (responseContent) {
        // Extract SVG from Claude's response
        const svgMatch = responseContent.match(/<svg[\s\S]*<\/svg>/);
        if (svgMatch) {
          const candidateSvg = svgMatch[0];
          
          // Validate the candidate SVG
          const candidateValidation = SVGAccessibilityValidator.validateAccessibility(candidateSvg);
          
          // Only use Claude's improved version if it's valid and has better accessibility
          if (candidateValidation.isValid && 
              candidateValidation.accessibilityAssessment &&
              accessibilityResult.accessibilityAssessment &&
              candidateValidation.accessibilityAssessment.overallAccessibility > 
              accessibilityResult.accessibilityAssessment.overallAccessibility) {
            improvedSvg = candidateSvg;
            improvedByAI = true;
          }
        }
      }
      
      // Step 4: If Claude didn't improve it, apply automated improvements
      if (!improvedByAI) {
        improvedSvg = this.applyAutomatedAccessibilityImprovements(svg, brandName);
      }
      
      // Step 5: Get final assessment of the improved SVG
      const finalAssessment = SVGAccessibilityValidator.validateAccessibility(improvedSvg);
      
      // Generate a list of modifications made
      const modifications: string[] = [];
      
      if (improvedByAI) {
        modifications.push('Applied AI-based accessibility improvements');
      } else {
        modifications.push('Applied automated accessibility improvements');
      }
      
      // Return the improved SVG with accessibility assessment
      return {
        success: true,
        result: {
          svg: improvedSvg,
          isValid: finalAssessment.isValid,
          modifications,
          accessibilityScore: finalAssessment.accessibilityAssessment?.overallAccessibility || 0,
          designFeedback: this.generateAccessibilityFeedback(finalAssessment.accessibilityAssessment),
          accessibilityAssessment: finalAssessment.accessibilityAssessment
        }
      };
    } catch (error) {
      console.error('Failed to process SVG accessibility:', error);
      return {
        success: false,
        error: {
          message: 'SVG accessibility process failed',
          details: error instanceof Error ? error.message : String(error)
        }
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
    
    // 4. Add viewBox if missing
    if (!/<svg[^>]*viewBox\s*=/i.test(improvedSvg)) {
      const widthMatch = improvedSvg.match(/width\s*=\s*["']([0-9.]+)/i);
      const heightMatch = improvedSvg.match(/height\s*=\s*["']([0-9.]+)/i);
      
      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        
        improvedSvg = improvedSvg.replace(
          /<svg([^>]*?)>/i, 
          `<svg$1 viewBox="0 0 ${width} ${height}">`
        );
      } else {
        // Default viewBox if dimensions are not specified
        improvedSvg = improvedSvg.replace(
          /<svg([^>]*?)>/i, 
          '<svg$1 viewBox="0 0 100 100">'
        );
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
    
    // 6. Convert absolute font sizes to relative where needed
    improvedSvg = improvedSvg.replace(
      /font-size\s*=\s*["'](\d+)["']/gi,
      (match, size) => {
        const fontSize = parseInt(size, 10);
        if (fontSize < 10) {
          // Convert small font sizes to em units
          return `font-size="${fontSize / 10}em"`;
        }
        return match;
      }
    );
    
    // 7. Increase thin stroke widths for better visibility
    improvedSvg = improvedSvg.replace(
      /stroke-width\s*=\s*["'](0\.\d+|0|1)["']/gi,
      'stroke-width="1.5"'
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