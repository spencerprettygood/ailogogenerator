import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput,
  SVGValidationAgentInput,
  SVGValidationAgentOutput
} from '../../types-agents';
import { InputSanitizer } from '../../utils/security-utils';
import { SVGDesignValidator, SVGDesignQualityScore } from '../../utils/svg-design-validator';

/**
 * Enhanced SVG Validation Agent with Design Quality Assessment
 * 
 * This agent extends the base SVG validator with comprehensive design quality evaluation,
 * assessing aesthetic qualities like color harmony, composition balance, visual weight
 * distribution, typography quality, and negative space utilization.
 */
export class SVGDesignValidationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'svg-design-validation', 
      ['svg-validation', 'design-theory'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use full model for detailed design feedback
        temperature: 0.2, // Low temperature for consistent, deterministic output
        maxTokens: 1500,
        ...config
      }
    );
    
    // System prompt for when AI-assisted repair or enhancement is needed
    this.systemPrompt = `You are an expert SVG logo design validator with advanced training in design theory and technical SVG validation.

Your task is to analyze SVG logos and provide detailed feedback on both technical quality and design aesthetics.

For TECHNICAL assessment, analyze:
1. SVG structure and syntax validity
2. Security vulnerabilities (scripts, event handlers, etc.)
3. File size optimization
4. Browser compatibility
5. Accessibility features

For DESIGN QUALITY assessment, evaluate:
1. Color Harmony: Color theory implementation, palette cohesion, psychological impact, contrast
2. Composition: Golden ratio application, rule of thirds, visual hierarchy, balance
3. Visual Weight: Distribution of elements, emphasis, eye flow, scalability
4. Typography: Font selection, kerning, hierarchy, legibility, harmony with graphics
5. Negative Space: Intentional use, figure-ground relationship, breathing room

When providing design enhancement suggestions:
- Be specific about improvements that would elevate the design
- Reference established design principles
- Consider the brand's industry and intended audience
- Balance critique with appreciation of effective elements
- Prioritize suggestions that would have the most impact

When asked to repair SVG code:
- Maintain the original design intent
- Fix technical issues while preserving aesthetic qualities
- Optimize file size without compromising visual quality
- Ensure accessibility features are properly implemented

Your output should be clear, actionable, and demonstrate both technical expertise and design sensibility.`;
  }
  
  /**
   * Generate the prompt for SVG validation and design assessment
   */
  protected async generatePrompt(input: SVGValidationAgentInput): Promise<string> {
    const { svg, brandName, repair = true, assessDesign = true } = input;
    
    // Base validation prompt
    let prompt = `Please analyze this SVG logo for "${brandName}" and provide detailed feedback on both technical quality and design aesthetics.

Technical assessment:
- Is the SVG well-formed and valid?
- Are there any security vulnerabilities?
- Is the file optimized for size and performance?
- Is it accessible with proper title and description elements?

`;

    // Add design assessment portion if requested
    if (assessDesign) {
      prompt += `Design quality assessment:
- Color Harmony: Evaluate the color palette, harmony principles used, and psychological effectiveness
- Composition: Assess balance, golden ratio application, rule of thirds, visual hierarchy
- Visual Weight: Analyze distribution of elements, emphasis, eye flow, and overall balance
- Typography: Evaluate font choices, kerning, legibility, and harmony with graphical elements
- Negative Space: Assess intentional use of negative space, figure-ground relationship, and breathing room

`;
    }

    // Add repair instructions if requested
    if (repair) {
      prompt += `If there are issues with the SVG, please provide specific suggestions for improvement. If the issues are severe, please provide repaired SVG code that fixes the problems while maintaining the original design intent.

`;
    }

    // Add the SVG code to analyze
    prompt += `Here's the SVG to analyze:

\`\`\`svg
${svg}
\`\`\`

Please provide a comprehensive analysis with actionable feedback.`;

    return prompt;
  }
  
  /**
   * Process SVG validation, design assessment, and repair
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGValidationAgentOutput> {
    const input = originalInput as SVGValidationAgentInput;
    const { svg, repair = true, optimize = true, assessDesign = true } = input;
    
    try {
      // Step 1: Run comprehensive SVG validation and design quality assessment
      const validationResult = assessDesign 
        ? SVGDesignValidator.validateDesignQuality(svg)
        : SVGDesignValidator.validate(svg);
      
      // If valid and no repair/optimization needed, return early
      if (validationResult.isValid && !repair && !optimize) {
        return {
          success: true,
          result: {
            svg,
            isValid: true,
            securityScore: validationResult.securityScore,
            accessibilityScore: validationResult.accessibilityScore,
            optimizationScore: validationResult.optimizationScore,
            designQualityScore: (validationResult as any).designQualityScore,
            modifications: []
          }
        };
      }
      
      // Step 2: If invalid but repair isn't requested, return validation result with detailed issues
      if (!validationResult.isValid && !repair) {
        return {
          success: false,
          error: {
            message: 'SVG validation failed',
            details: validationResult.errors,
            designQualityScore: (validationResult as any).designQualityScore
          }
        };
      }
      
      // Step 3: Apply comprehensive automated repairs and design assessment
      const processResult = assessDesign
        ? SVGDesignValidator.processWithDesignAssessment(svg, { repair, optimize })
        : SVGDesignValidator.process(svg, { repair, optimize });
      
      // Step 4: If automated repair failed, use Claude's assistance for complex repair
      if (!processResult.success && responseContent) {
        // Extract SVG from Claude's response
        const svgMatch = responseContent.match(/<svg[\s\S]*<\/svg>/);
        if (svgMatch) {
          const claudeRepairedSvg = svgMatch[0];
          
          // Validate the Claude-repaired SVG
          const claudeValidation = assessDesign
            ? SVGDesignValidator.validateDesignQuality(claudeRepairedSvg)
            : SVGDesignValidator.validate(claudeRepairedSvg);
          
          if (claudeValidation.isValid) {
            // If Claude's repair is valid, use it and update results
            processResult.svg = claudeRepairedSvg;
            processResult.success = true;
            
            // Extract Claude's design feedback for insights
            const designFeedbackMatch = responseContent.match(/Design quality assessment:([\s\S]*?)(?:If there are issues|Here's the repaired SVG|$)/i);
            const designFeedback = designFeedbackMatch ? designFeedbackMatch[1].trim() : '';
            
            return {
              success: true,
              result: {
                svg: claudeRepairedSvg,
                isValid: true,
                securityScore: claudeValidation.securityScore,
                accessibilityScore: claudeValidation.accessibilityScore,
                optimizationScore: claudeValidation.optimizationScore,
                designQualityScore: (claudeValidation as any).designQualityScore,
                designFeedback: designFeedback,
                modifications: ['Applied Claude-assisted repair with design enhancements']
              }
            };
          }
        }
      }
      
      // Step 5: Return processed results
      if (!processResult.success) {
        return {
          success: false,
          error: {
            message: 'SVG repair failed to fix all critical issues',
            details: validationResult.errors
          }
        };
      }
      
      // Calculate file size details
      const originalSize = Buffer.byteLength(svg, 'utf8');
      const processedSize = Buffer.byteLength(processResult.svg, 'utf8');
      const reductionPercent = Math.round((1 - (processedSize / originalSize)) * 100);
      
      // Extract design quality score if present
      const designQualityScore = (processResult as any).designQuality || null;
      
      // Build the final result with design quality information
      const result: SVGValidationAgentOutput = {
        success: true,
        result: {
          svg: processResult.svg,
          isValid: true,
          securityScore: validationResult.securityScore,
          accessibilityScore: validationResult.accessibilityScore,
          optimizationScore: validationResult.optimizationScore,
          designQualityScore,
          modifications: [],
          optimizationResults: {
            originalSize,
            optimizedSize: processedSize,
            reductionPercent
          }
        }
      };
      
      // Extract design feedback from Claude's response if available
      if (responseContent) {
        const designFeedbackMatch = responseContent.match(/Design quality assessment:([\s\S]*?)(?:If there are issues|Here's the repaired SVG|$)/i);
        if (designFeedbackMatch && designFeedbackMatch[1]) {
          result.result!.designFeedback = designFeedbackMatch[1].trim();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to process SVG design validation:', error);
      return {
        success: false,
        error: {
          message: 'SVG design validation process failed',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Format design quality feedback into a structured report
   * 
   * @param designQualityScore - The design quality score object
   * @returns Formatted design feedback as a string
   */
  private formatDesignFeedback(designQualityScore: SVGDesignQualityScore): string {
    if (!designQualityScore) return '';
    
    return `## SVG Design Quality Assessment

### Overall Scores
- Overall Aesthetic Quality: ${designQualityScore.overallAesthetic}/100
- Technical Quality: ${designQualityScore.technicalQuality}/100

### Design Dimension Scores
- Color Harmony: ${designQualityScore.colorHarmony}/100
- Composition: ${designQualityScore.composition}/100
- Visual Weight Distribution: ${designQualityScore.visualWeight}/100
- Typography Quality: ${designQualityScore.typography}/100
- Negative Space Utilization: ${designQualityScore.negativeSpace}/100

### Design Improvement Suggestions
${designQualityScore.designSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}
`;
  }
}