import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SVGValidationAgentInput, 
  SVGValidationAgentOutput 
} from '../../types-agents';
import { InputSanitizer } from '../../utils/security-utils';
import { SVGValidator } from '../../utils/svg-validator';

/**
 * SVGValidationAgent - Validates and repairs SVG for security and quality
 */
export class SVGValidationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'svg-validation', 
      ['svg-validation'],
      {
        model: 'claude-3-5-haiku-20240307', // Use faster model for validation
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
        ...(validationResult.errors || []).map(error => ({
          type: 'error',
          severity: 'high',
          message: String(error)
        })),
        ...(validationResult.warnings || []).map(warning => ({
          type: 'warning',
          severity: 'low',
          message: String(warning)
        }))
      ];
    }
    
    return validationResult;
  }
  
  /**
   * Generate the prompt for SVG validation
   * This agent doesn't primarily use prompts, but can request Claude's help for repair
   */
  protected async generatePrompt(input: SVGValidationAgentInput): Promise<string> {
    const { svg, brandName, repair = true } = input;
    
    // Only used if repair is needed and automated tools aren't sufficient
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
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGValidationAgentOutput> {
    const input = originalInput as SVGValidationAgentInput;
    const { svg, repair = true, optimize = true } = input;
    
    try {
      // Step 1: Use comprehensive SVG validator for initial validation
      const validationResult = this.ensureValidationIssues(SVGValidator.validate(svg));
      
      // Basic security check with InputSanitizer for backward compatibility
      const securityResult = InputSanitizer.validateSVG(svg);
      
      // If valid and no repair/optimization needed, return early
      if (validationResult.isValid && securityResult.isValid && !repair && !optimize) {
        return {
          success: true,
          result: {
            svg,
            isValid: true,
            securityScore: validationResult.securityScore,
            accessibilityScore: validationResult.accessibilityScore,
            optimizationScore: validationResult.optimizationScore,
            modifications: []
          }
        };
      }
      
      // Step 2: If invalid but repair isn't requested, return validation result with detailed issues
      if ((!validationResult.isValid || !securityResult.isValid) && !repair) {
        return {
          success: false,
          error: {
            message: 'SVG validation failed',
            details: [
              ...validationResult.issues.map(issue => `${issue.severity.toUpperCase()}: ${issue.message}`),
              ...securityResult.errors
            ]
          }
        };
      }
      
      // Step 3: Apply comprehensive automated repairs using SVGValidator
      let processedResult;
      
      if (repair && optimize) {
        // Use the single-call process method that does validation, repair, and optimization
        processedResult = this.ensureValidationIssues(SVGValidator.process(svg));
      } else if (repair) {
        // Just repair without optimization
        const repairResult = this.ensureValidationIssues(SVGValidator.repair(svg));
        processedResult = {
          original: svg,
          processed: repairResult.repaired,
          validation: validationResult,
          repair: repairResult,
          overallScore: Math.round((validationResult.securityScore + validationResult.accessibilityScore) / 2),
          success: repairResult.issuesRemaining.filter(i => i.severity === 'critical').length === 0
        };
      } else if (optimize) {
        // Just optimize without repair
        const optimizationResult = this.ensureValidationIssues(SVGValidator.optimize(svg));
        processedResult = {
          original: svg,
          processed: optimizationResult.optimized,
          validation: validationResult,
          optimization: optimizationResult,
          overallScore: validationResult.optimizationScore,
          success: validationResult.isValid
        };
      } else {
        // Neither repair nor optimize (should never reach here due to early return)
        processedResult = {
          original: svg,
          processed: svg,
          validation: validationResult,
          success: validationResult.isValid
        };
      }
      
      // If automated repair wasn't sufficient, use Claude for complex repair
      if (!processedResult.success && responseContent) {
        // Extract SVG from Claude's response
        const svgMatch = responseContent.match(/<svg[\s\S]*<\/svg>/);
        if (svgMatch) {
          const claudeRepairedSvg = svgMatch[0];
          
          // Validate the Claude-repaired SVG
          const claudeValidation = SVGValidator.validate(claudeRepairedSvg);
          
          if (claudeValidation.isValid) {
            // If Claude's repair is valid, use it
            processedResult.processed = claudeRepairedSvg;
            processedResult.success = true;
            processedResult.claudeRepair = true;
          }
        }
      }
      
      // Step 4: Final check and return results
      if (!processedResult.success) {
        return {
          success: false,
          error: {
            message: 'SVG repair failed to fix all critical issues',
            details: processedResult.validation.issues
              .filter(i => i.severity === 'critical')
              .map(i => i.message)
          }
        };
      }
      
      // Calculate file size details
      const originalSize = Buffer.byteLength(svg, 'utf8');
      const processedSize = Buffer.byteLength(processedResult.processed, 'utf8');
      const reductionPercent = Math.round((1 - (processedSize / originalSize)) * 100);
      
      // Extract modifications list
      const modifications: string[] = [];
      
      if (processedResult.repair) {
        modifications.push(...processedResult.repair.issuesFixed.map(issue => 
          `Fixed ${issue.severity} ${issue.type} issue: ${issue.message}`
        ));
      }
      
      if (processedResult.optimization) {
        modifications.push(...processedResult.optimization.optimizations);
      }
      
      if (processedResult.claudeRepair) {
        modifications.push('Applied advanced Claude-based SVG repair');
      }
      
      // Return the fully processed result
      return {
        success: true,
        result: {
          svg: processedResult.processed,
          isValid: true,
          modifications,
          securityScore: processedResult.validation.securityScore,
          accessibilityScore: processedResult.validation.accessibilityScore,
          optimizationScore: processedResult.validation.optimizationScore,
          overallScore: processedResult.overallScore,
          optimizationResults: {
            originalSize,
            optimizedSize: processedSize,
            reductionPercent
          }
        }
      };
    } catch (error) {
      console.error('Failed to process SVG validation:', error);
      return {
        success: false,
        error: {
          message: 'SVG validation process failed',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}