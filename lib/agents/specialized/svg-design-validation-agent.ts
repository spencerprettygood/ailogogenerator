import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  SVGValidationAgentInput,
  SVGValidationResultOutput,
  SVGDesignQualityScore,
} from '../../types-agents';
import { SVGDesignValidator } from '../../utils/svg-design-validator';
import { handleError, ErrorCategory } from '../../utils/error-handler';

/**
 * Enhanced SVG Validation Agent with Design Quality Assessment
 *
 * This agent extends the base SVG validator with comprehensive design quality evaluation,
 * assessing aesthetic qualities like color harmony, composition balance, visual weight
 * distribution, typography quality, and negative space utilization.
 */
export class SVGDesignValidationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('svg-design-validation', ['svg-validation'], {
      model: 'claude-3-5-sonnet-20240620', // Use full model for detailed design feedback
      temperature: 0.2, // Low temperature for consistent, deterministic output
      maxTokens: 2048, // Increased for comprehensive design feedback
      ...config,
    });

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

Return ONLY the improved SVG code without any explanations if repair is needed.`;
  }

  /**
   * Generate the prompt for SVG validation and design assessment
   */
  protected async generatePrompt(input: SVGValidationAgentInput): Promise<string> {
    const { svg, brandName, repair = true } = input;

    // First, run design validation to see if we need AI assistance
    const validationResult = SVGDesignValidator.validateDesignQuality(svg);

    // If the SVG is already high quality and valid, don't need AI assistance
    const designQuality = (validationResult as any).designQualityScore;
    if (validationResult.isValid && designQuality && designQuality.overallAesthetic > 80) {
      return ''; // Signal that we don't need AI processing
    }

    let prompt = `Please analyze this SVG logo for "${brandName}" and provide detailed feedback on both technical quality and design aesthetics.

Technical assessment:
- Is the SVG well-formed and valid?
- Are there any security vulnerabilities?
- Is the file optimized for size and performance?
- Is it accessible with proper title and description elements?

Design quality assessment:
- Color Harmony: Evaluate the color palette, harmony principles used, and psychological effectiveness
- Composition: Assess balance, golden ratio application, rule of thirds, visual hierarchy
- Visual Weight: Analyze distribution of elements, emphasis, eye flow, and overall balance
- Typography: Evaluate font choices, kerning, legibility, and harmony with graphical elements
- Negative Space: Assess intentional use of negative space, figure-ground relationship, and breathing room

`;

    if (repair && !validationResult.isValid) {
      prompt += `The SVG has validation issues. Please provide repaired SVG code that fixes the problems while maintaining the original design intent.

`;
    }

    prompt += `Here's the SVG to analyze:

${svg}

Please provide a comprehensive analysis with actionable feedback.`;

    return prompt;
  }

  /**
   * Process SVG validation, design assessment, and repair
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput
  ): Promise<SVGValidationResultOutput> {
    const input = originalInput as SVGValidationAgentInput;
    const { svg, repair = true, optimize = true } = input;

    try {
      // Step 1: Run comprehensive SVG validation and design quality assessment
      const processResult = SVGDesignValidator.processWithDesignAssessment(svg, {
        repair,
        optimize,
      });

      // Step 2: If automated processing was successful, use those results
      if (processResult.success) {
        return {
          success: true,
          result: {
            svg: processResult.svg,
            isValid: true,
            securityScore: processResult.validation.securityScore,
            accessibilityScore: processResult.validation.accessibilityScore,
            optimizationScore: processResult.validation.optimizationScore,
            designQualityScore: processResult.designQuality as any,
            designFeedback: this.formatDesignFeedback(processResult.designQuality as any),
            modifications: (processResult.repair as any)?.modifications || [],
          },
          tokensUsed: this.metrics.tokenUsage.total,
          processingTime: this.metrics.executionTime,
        };
      }

      // Step 3: If automated repair failed, try to use AI-assisted repair
      if (responseContent && responseContent.trim()) {
        const svgMatch = responseContent.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) {
          const aiRepairedSvg = svgMatch[0];

          // Validate the AI-repaired SVG
          const aiValidation = SVGDesignValidator.validateDesignQuality(aiRepairedSvg);

          if (aiValidation.isValid) {
            // Extract design feedback from AI response
            const designFeedbackMatch = responseContent.match(
              /Design quality assessment:([\s\S]*?)(?:The SVG has validation|Here's the SVG|$)/i
            );
            const designFeedback = designFeedbackMatch?.[1]?.trim() || '';

            return {
              success: true,
              result: {
                svg: aiRepairedSvg,
                isValid: true,
                securityScore: aiValidation.securityScore,
                accessibilityScore: aiValidation.accessibilityScore,
                optimizationScore: aiValidation.optimizationScore,
                designQualityScore: (aiValidation as any).designQualityScore,
                designFeedback:
                  designFeedback ||
                  this.formatDesignFeedback((aiValidation as any).designQualityScore),
                modifications: ['Applied AI-assisted design and technical improvements'],
              },
              tokensUsed: this.metrics.tokenUsage.total,
              processingTime: this.metrics.executionTime,
            };
          }
        }
      }

      // Step 4: If both automated and AI repair failed, return the validation issues
      const validationResult = SVGDesignValidator.validateDesignQuality(svg);

      return {
        success: false,
        error: handleError({
          error: 'SVG validation and repair failed to fix all critical issues',
          category: ErrorCategory.SVG,
          details: {
            validationErrors: validationResult.errors,
            designQuality: (validationResult as any).designQualityScore,
          },
          retryable: true,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: handleError({
          error: 'SVG design validation process failed',
          category: ErrorCategory.SVG,
          details: { originalError: error instanceof Error ? error.message : String(error) },
          retryable: true,
        }),
      };
    }
  }

  /**
   * Format design quality feedback into a structured report
   *
   * @param designQualityScore - The design quality score object
   * @returns Formatted design feedback as a string
   */
  private formatDesignFeedback(designQualityScore?: any): string {
    if (!designQualityScore) return 'Design quality assessment not available.';

    const lines = [
      '## SVG Design Quality Assessment',
      '',
      '### Overall Scores',
      `- Overall Quality: ${designQualityScore.overall || 'N/A'}/100`,
      `- Balance: ${designQualityScore.balance || 'N/A'}/100`,
      `- Harmony: ${designQualityScore.harmony || 'N/A'}/100`,
      '',
      '### Design Dimension Scores',
      `- Symmetry: ${designQualityScore.symmetry || 'N/A'}/100`,
      `- Simplicity: ${designQualityScore.simplicity || 'N/A'}/100`,
      `- Clarity: ${designQualityScore.clarity || 'N/A'}/100`,
    ];

    if (
      designQualityScore.suggestions &&
      Array.isArray(designQualityScore.suggestions) &&
      designQualityScore.suggestions.length > 0
    ) {
      lines.push('', '### Design Improvement Suggestions');
      lines.push(...designQualityScore.suggestions.map((suggestion: string) => `- ${suggestion}`));
    }

    return lines.join('\n');
  }
}
