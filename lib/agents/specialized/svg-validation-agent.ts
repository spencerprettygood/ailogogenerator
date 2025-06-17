import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SVGValidationAgentInput, 
  SVGValidationAgentOutput 
} from '../../types-agents';
import { InputSanitizer } from '../../utils/security-utils';

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
        temperature: 0.1, // Low temperature for consistent, deterministic output
        maxTokens: 1000,
        ...config
      }
    );
    
    // This agent doesn't primarily use Claude - it uses direct validation and repair
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
      // Step 1: Validate the SVG using our security utils
      const validationResult = InputSanitizer.validateSVG(svg);
      
      // If valid and no repair/optimization needed, return early
      if (validationResult.isValid && !repair && !optimize) {
        return {
          success: true,
          result: {
            svg,
            isValid: true,
            modifications: []
          }
        };
      }
      
      // Step 2: If invalid but repair isn't requested, return validation result
      if (!validationResult.isValid && !repair) {
        return {
          success: false,
          error: {
            message: 'SVG validation failed',
            details: validationResult.errors
          }
        };
      }
      
      // Step 3: Apply automated repairs
      const modifications: string[] = [];
      let repairedSvg = svg;
      
      // If security issues found, apply automated cleaning
      if (!validationResult.isValid) {
        repairedSvg = InputSanitizer.cleanSVG(svg);
        modifications.push('Removed security vulnerabilities');
        
        // Check if automated repair fixed all issues
        const revalidationResult = InputSanitizer.validateSVG(repairedSvg);
        
        // If automated repair wasn't sufficient, use Claude for complex repair
        if (!revalidationResult.isValid && responseContent) {
          // Extract SVG from Claude's response
          const svgMatch = responseContent.match(/<svg[\s\S]*<\/svg>/);
          if (svgMatch) {
            repairedSvg = svgMatch[0];
            modifications.push('Applied advanced SVG repair');
          }
        }
      }
      
      // Step 4: Check optimization requirements
      let optimizedSvg = repairedSvg;
      const originalSize = Buffer.byteLength(svg, 'utf8');
      let optimizedSize = Buffer.byteLength(optimizedSvg, 'utf8');
      
      if (optimize) {
        // Basic optimization: remove comments, unnecessary whitespace, etc.
        optimizedSvg = optimizedSvg
          .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
          .replace(/>\s+</g, '><') // Remove whitespace between tags
          .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
          .replace(/\s+>/g, '>') // Remove space before closing tags
          .replace(/<\s+/g, '<'); // Remove space after opening tags
        
        modifications.push('Applied basic SVG optimization');
        optimizedSize = Buffer.byteLength(optimizedSvg, 'utf8');
      }
      
      // Calculate optimization results
      const reductionPercent = Math.round((1 - (optimizedSize / originalSize)) * 100);
      
      // Step 5: Final validation of the optimized SVG
      const finalValidation = InputSanitizer.validateSVG(optimizedSvg);
      
      if (!finalValidation.isValid) {
        return {
          success: false,
          error: {
            message: 'SVG repair failed to fix all issues',
            details: finalValidation.errors
          }
        };
      }
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          svg: optimizedSvg,
          isValid: true,
          modifications,
          optimizationResults: {
            originalSize,
            optimizedSize,
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