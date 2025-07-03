import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  SVGValidationAgentInput, 
  SVGValidationResultOutput 
} from '../../types-agents';
import { InputSanitizer } from '../../utils/security-utils';
import { SVGValidator, SVGValidationResult, SVGRepairResult } from '../../utils/svg-validator';
import { handleError, ErrorCategory } from '../../utils/error-handler';

/**
 * SVGValidationAgent - Validates and repairs SVG for security and quality
 */
export class SVGValidationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'svg-validation', 
      ['svg-validation'],
      {
        model: 'claude-3-haiku-20240307', // Use faster model for validation
        fallbackModels: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229'], // Fallback models if primary fails
        temperature: 0.1, // Low temperature for consistent, deterministic output
        maxTokens: 1000,
        ...config
      }
    );
    
    // This agent doesn't primarily use Claude - it uses direct validation and repair
    
    // Set a system prompt - required to avoid "text content blocks must be non-empty" error
    this.systemPrompt = `You are a specialized SVG validation and repair agent for an AI logo generator.
    
Your task is to validate and repair SVG logos to ensure they are valid, secure, and optimized.

IMPORTANT REQUIREMENTS:
1. Analyze SVG for validity, security issues, and optimization opportunities
2. Fix common structural and syntax issues
3. Remove potentially dangerous elements (scripts, event handlers, external references)
4. Maintain the original design intent and visual appearance
5. Return only the fixed SVG without any explanations or comments`;
  }
  
  /**
   * Helper function to ensure SVGValidator's ValidationIssue interface is compatible with what we expect
   */
  private ensureValidationIssues(validationResult: any): any {
    if (!validationResult.issues || !Array.isArray(validationResult.issues)) {
      // Create a default issues array if one doesn't exist
      validationResult.issues = [
        ...(validationResult.errors || []).map((error: any) => ({
          type: 'error',
          severity: 'high',
          message: String(error)
        })),
        ...(validationResult.warnings || []).map((warning: any) => ({
          type: 'warning',
          severity: 'low',
          message: String(warning)
        }))
      ];
    }
    
    return validationResult;
  }
  
  /**
   * Generate the prompt for SVG validation.
   * This agent only generates a prompt if automated repair fails and a manual repair is needed.
   */
  protected async generatePrompt(input: SVGValidationAgentInput): Promise<string> {
    const { svg, brandName, repair = true } = input;

    // First, try to validate and repair automatically
    const validationResult = SVGValidator.validate(svg);
    if (validationResult.isValid) {
      return ''; // No need for AI intervention
    }

    if (repair) {
      const repairResult = SVGValidator.repair(svg);
      const reValidation = SVGValidator.validate(repairResult.svg);
      if (reValidation.isValid) {
        return ''; // Automated repair was successful
      }
    }
    
    // If automated repair fails, generate a prompt for Claude
    this.log('Automated SVG repair failed, escalating to AI model.', 'warn');
    return `Please fix the following SVG logo for "${brandName}" to ensure it's valid, secure, and optimized.
Issues to address:
- Ensure proper SVG structure with valid XML
- Remove any potential security issues
- Optimize paths and structures for file size
- Maintain the original design intent

Here's the SVG to repair:

\`\`\`svg
${svg}
\`\`\`

Return only the fixed SVG code without any explanations.`;
  }
  
  /**
   * Process SVG validation and repair
   * This is a hybrid approach using both built-in validation and Claude for complex repairs
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGValidationResultOutput> {
    const input = originalInput as SVGValidationAgentInput;
    const { svg, repair = true, optimize = true } = input;
    
    try {
      // Step 1: Use comprehensive SVG validator for initial validation
      const validationResult = SVGValidator.validate(svg);
      
      // If valid and no repair/optimization needed, return early
      if (validationResult.isValid && !repair && !optimize) {
        return {
          success: true,
          result: {
            svg,
            isValid: true,
            ...this.extractScores(validationResult)
          }
        };
      }

      let processedSvg = svg;
      let modifications: string[] = [];

      // Step 2: Repair if requested
      if (repair && !validationResult.isValid) {
        const repairResult = SVGValidator.repair(svg);
        processedSvg = repairResult.svg;
        modifications.push(...repairResult.modifications);

        // If automated repair failed and we have a response from Claude, use it.
        if (responseContent) {
            const svgMatch = responseContent.match(/<svg[\s\S]*<\/svg>/);
            if (svgMatch) {
                const claudeRepairedSvg = svgMatch[0];
                const claudeValidation = SVGValidator.validate(claudeRepairedSvg);
                if (claudeValidation.isValid) {
                    this.log('Using AI-repaired SVG.');
                    processedSvg = claudeRepairedSvg;
                    modifications.push('Repaired by AI model after automated repair failed.');
                } else {
                    this.log('AI repair was also invalid, using automated repair attempt.', 'warn');
                }
            }
        }
      }

      // Step 3: Optimize if requested
      if (optimize) {
        const optimizationResult = SVGValidator.optimize(processedSvg);
        processedSvg = optimizationResult.svg;
        modifications.push(...optimizationResult.optimizations);
      }

      // Step 4: Final validation and return
      const finalValidation = SVGValidator.validate(processedSvg);

      if (!finalValidation.isValid) {
        this.log('SVG remains invalid after all processing steps.', 'error');
        return {
          success: false,
          error: handleError({
            error: 'SVG validation and repair failed',
            category: ErrorCategory.SVG,
            details: { 
              validationIssues: finalValidation.issues?.map(i => i.message) || ['Unknown validation error'],
              originalSvg: svg.substring(0, 200) + '...'
            },
            retryable: false,
          }),
        };
      }

      return {
        success: true,
        result: {
          svg: processedSvg,
          isValid: true,
          modifications,
          ...this.extractScores(finalValidation)
        },
        tokensUsed: this.metrics.tokenUsage.total,
        processingTime: this.metrics.executionTime,
      };

    } catch (error) {
      return {
        success: false,
        error: handleError({
          error: error instanceof Error ? error.message : String(error),
          category: ErrorCategory.SVG,
          details: { originalSvg: svg.substring(0, 200) + '...' },
          retryable: true,
        }),
      };
    }
  }

  private extractScores(validationResult: SVGValidationResult) {
      return {
        securityScore: validationResult.securityScore,
        accessibilityScore: validationResult.accessibilityScore,
        optimizationScore: validationResult.optimizationScore,
      };
  }
}