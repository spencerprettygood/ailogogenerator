import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  SVGGenerationAgentInput,
  SVGGenerationAgentOutput,
} from '../../types-agents';
import { safeJsonParse } from '../../utils/json-utils';
import { SVGValidator, SVGValidationResult, SVGRepairResult } from '../../utils/svg-validator';
import { handleError, ErrorCategory } from '../../utils/error-handler';

/**
 * SVGGenerationAgent - Creates production-ready SVG logo based on selected concept
 */
export class SVGGenerationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('svg-generation', ['svg-generation'], {
      model: 'claude-3-5-sonnet-20240620',
      fallbackModels: ['claude-3-haiku-20240307'],
      temperature: 0.4,
      maxTokens: 4096,
      ...config,
    });

    // Set the system prompt for this agent with advanced context management and design intelligence
    this.systemPrompt = `You are a specialized SVG logo generation agent, an expert in vector graphics and brand identity.

## ROLE & CAPABILITIES
- You are a professional logo designer with deep expertise in SVG creation.
- You translate brand concepts into compelling, production-ready vector graphics.
- You generate optimized, clean, and valid SVG code following industry best practices.

## TECHNICAL REQUIREMENTS
1.  **VALID SVG ONLY**: Create valid, optimized SVG code.
2.  **VIEWBOX**: Use a \`viewBox="0 0 100 100"\` for consistent scaling.
3.  **SIZE**: Keep the SVG code under 15KB.
4.  **ALLOWED ELEMENTS**: Use only \`svg\`, \`g\`, \`path\`, \`circle\`, \`rect\`, \`polygon\`.
5.  **DISALLOWED ELEMENTS**: Do NOT use \`script\`, \`image\`, \`foreignObject\`, \`use\`, or any event handlers (e.g., \`onclick\`).
6.  **OPTIMIZATION**: Optimize paths for minimum points. Use groups (\`<g>\`) for organization.
7.  **IDs**: Include descriptive, unique element IDs (e.g., "logo-background", "brand-icon").

## ADVANCED DESIGN PRINCIPLES
1.  **GOLDEN RATIO**: Apply mathematical proportions (1:1.618) for visual harmony.
2.  **COLOR THEORY**: Use sophisticated color harmonies with psychological impact.
3.  **HIERARCHY**: Implement Gestalt principles for clear structure.
4.  **NEGATIVE SPACE**: Use negative space intentionally.
5.  **TECHNICAL EXCELLENCE**: Optimize path data and maintain clean vector forms.

## OUTPUT FORMAT
You MUST return your response in the following JSON format. Do NOT include any text before or after the JSON object.

\`\`\`json
{
  "svg": "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>...</svg>",
  "designRationale": "A brief explanation of the design decisions.",
  "designPrinciples": {
    "goldenRatio": "How the golden ratio was applied.",
    "colorTheory": "Color theory principles used.",
    "visualHierarchy": "How visual hierarchy was established.",
    "technicalExcellence": "Technical optimization decisions made."
  }
}
\`\`\`

The SVG code must be a complete, valid SVG string.`;
  }

  /**
   * Generate the prompt for SVG generation.
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;

    const prompt = `
Please generate a professional SVG logo based on the following design specifications and selected concept.

## BRAND CONTEXT
- **Brand Name**: ${designSpec.brand_name}
- **Industry**: ${designSpec.industry || 'general'}
- **Description**: ${designSpec.brand_description}

## DESIGN DIRECTION
- **Selected Concept**: ${selectedConcept.name}
- **Concept Description**: ${selectedConcept.description}
- **Style**: ${selectedConcept.style || designSpec.style_preferences || 'modern, professional'}
- **Colors**: ${selectedConcept.colors || designSpec.color_palette || 'blue, white, gray'}
- **Imagery**: ${selectedConcept.imagery || 'Abstract or typographic elements'}

## REQUIREMENTS
- Generate a complete, optimized SVG logo in the specified JSON format.
- Provide a thoughtful design rationale explaining your creative process and how the logo embodies the brand identity.
- Ensure the design is both visually compelling and functionally effective.
`;
    return prompt;
  }

  /**
   * Process the response from the AI, parse it, validate the SVG, and return the output.
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput
  ): Promise<SVGGenerationAgentOutput> {
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

    const { svg, designRationale, designPrinciples } = parsed;

    if (!svg || typeof svg !== 'string') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid SVG generation output: missing or invalid svg field.',
          category: ErrorCategory.API,
          details: { parsed },
          retryable: true,
        }),
      };
    }

    if (!designRationale || typeof designRationale !== 'string') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid SVG generation output: missing or invalid designRationale field.',
          category: ErrorCategory.API,
          details: { parsed },
          retryable: true,
        }),
      };
    }

    this.log(`Initial SVG received. Validating and repairing...`);

    const validationResult: SVGValidationResult = SVGValidator.validate(svg);

    if (!validationResult.isValid) {
      this.log(
        `SVG validation failed. Issues: ${validationResult.issues?.map(i => i.message).join(', ')}`
      );
      return {
        success: false,
        error: handleError({
          error: 'Generated SVG failed validation.',
          category: ErrorCategory.SVG,
          details: {
            validationIssues: validationResult.issues,
            originalSvg: svg.substring(0, 200) + '...',
          },
          retryable: true,
        }),
      };
    }

    this.log(`SVG validation successful. Repairing and optimizing SVG.`);
    const repairResult: SVGRepairResult = SVGValidator.repair(svg);

    if (repairResult.issuesRemaining && repairResult.issuesRemaining.length > 0) {
      this.log(
        `SVG repair left remaining issues: ${repairResult.issuesRemaining.map(i => i.message).join(', ')}`,
        'warn'
      );
    }

    return {
      success: true,
      result: {
        svg: repairResult.repaired, // Use the validated (and potentially repaired/optimized) SVG
        designRationale: designRationale,
        designPrinciples: designPrinciples,
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}
