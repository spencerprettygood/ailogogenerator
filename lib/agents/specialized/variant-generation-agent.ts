import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  VariantGenerationAgentInput,
  VariantGenerationAgentOutput,
} from '../../types-agents';
import { SVGValidator } from '../../utils/svg-validator';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { safeJsonParse } from '../../utils/json-utils';

/**
 * VariantGenerationAgent - Creates monochrome variants and favicon from the main logo
 */
export class VariantGenerationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('variant-generation', ['variant-generation'], {
      model: 'claude-3-haiku-20240307', // Use faster model for variant generation
      temperature: 0.3,
      maxTokens: 2000,
      ...config,
    });

    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized variant generation agent for an AI logo generator.
    
Your task is to create monochrome versions (black and white) and a simplified favicon version of the main SVG logo.

IMPORTANT REQUIREMENTS:
1. Create a black monochrome version (black shapes on transparent background)
2. Create a white monochrome version (white shapes on transparent background)
3. Create a simplified favicon version suitable for small display (16x16px)
4. Maintain the recognizability of the original logo in all variants
5. Follow SVG best practices for all variants
6. Ensure all SVGs have proper viewBox attributes

You MUST return your variants in the following JSON format:
\`\`\`json
{
  "variants": {
    "monochrome": {
      "black": "<!-- black monochrome SVG -->",
      "white": "<!-- white monochrome SVG -->"
    },
    "favicon": {
      "svg": "<!-- simplified favicon SVG -->"
    }
  }
}
\`\`\`

For monochrome variants:
- Convert all colors to either pure black (#000000) or pure white (#FFFFFF)
- Remove gradients and replace with solid fills
- Maintain the original proportions and viewBox

For the favicon:
- Simplify the design to work at 16x16 pixels
- Remove fine details that won't be visible at small sizes
- Focus on maintaining core brand recognition
- Use a square viewBox (e.g., "0 0 16 16")

Your entire response must be valid JSON that can be parsed directly.
Do NOT include any text before or after the JSON object.`;
  }

  /**
   * Generate the prompt for variant generation
   */
  protected async generatePrompt(input: VariantGenerationAgentInput): Promise<string> {
    const { svg, brandName } = input;

    return `Please create monochrome and favicon variants for the following SVG logo for "${brandName}":

\`\`\`svg
${svg}
\`\`\`

Follow the instructions in the system prompt to generate the variants in the correct JSON format.`;
  }

  /**
   * Process the response from Claude
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput
  ): Promise<VariantGenerationAgentOutput> {
    const parsed = safeJsonParse(responseContent);

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid JSON response from AI. The response was not a valid object.',
          category: ErrorCategory.API,
          details: { responseContent },
          retryable: true,
        }),
      };
    }

    // Validate variants structure
    if (!parsed.variants || typeof parsed.variants !== 'object') {
      return {
        success: false,
        error: handleError({
          error: 'Missing or invalid variants structure in AI response',
          category: ErrorCategory.API,
          details: { parsed },
          retryable: true,
        }),
      };
    }

    const { variants } = parsed;

    // Validate monochrome variants
    if (!variants.monochrome || !variants.monochrome.black || !variants.monochrome.white) {
      return {
        success: false,
        error: handleError({
          error: 'Missing monochrome variants (black or white) in AI response',
          category: ErrorCategory.API,
          details: { variants },
          retryable: true,
        }),
      };
    }

    // Validate favicon variant
    if (!variants.favicon || !variants.favicon.svg) {
      return {
        success: false,
        error: handleError({
          error: 'Missing favicon variant in AI response',
          category: ErrorCategory.API,
          details: { variants },
          retryable: true,
        }),
      };
    }

    // Validate SVG content for each variant
    const svgVariants = [
      { name: 'black monochrome', svg: variants.monochrome.black },
      { name: 'white monochrome', svg: variants.monochrome.white },
      { name: 'favicon', svg: variants.favicon.svg },
    ];

    for (const { name, svg } of svgVariants) {
      if (typeof svg !== 'string') {
        return {
          success: false,
          error: handleError({
            error: `Invalid ${name} SVG: must be a string`,
            category: ErrorCategory.SVG,
            details: { name, svg },
            retryable: true,
          }),
        };
      }

      const validationResult = SVGValidator.validate(svg);
      if (!validationResult.isValid) {
        this.log(
          `Warning: ${name} SVG failed validation: ${validationResult.errors?.join(', ')}`,
          'warn'
        );
        // Continue execution but log the warning
      }
    }

    this.log('Successfully generated and validated SVG variants.');
    return {
      success: true,
      result: {
        variants: {
          monochrome: {
            black: variants.monochrome.black,
            white: variants.monochrome.white,
          },
          favicon: {
            svg: variants.favicon.svg,
            ico: '', // Placeholder for future implementation
          },
          pngVariants: {
            size256: '', // Placeholder for future implementation
            size512: '', // Placeholder for future implementation
            size1024: '', // Placeholder for future implementation
          },
        },
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}
