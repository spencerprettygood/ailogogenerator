import { BaseAgent } from '../base/base-agent';
import { AgentInput, AnimationAgentOutput, AnimationAgentInput, AgentConfig } from '../../types-agents';
import { SVGAnimationService } from '../../animation/animation-service';
import { AnimationOptions, AnimationType, AnimationEasing } from '../../animation/types';
import { safeJsonParse } from '../../utils/json-utils';
import { handleError, ErrorCategory } from '../../utils/error-handler';

/**
 * Agent responsible for adding animations to SVG logos using AI-driven analysis.
 */
export class AnimationAgent extends BaseAgent {
  private animationService: SVGAnimationService;

  constructor(config?: Partial<AgentConfig>) {
    super('animation', ['animation'], {
      model: 'claude-3-opus-20240229', // Use a powerful model for nuanced animation decisions
      temperature: 0.5,
      maxTokens: 1024,
      ...config,
    });

    this.animationService = new SVGAnimationService();

    this.systemPrompt = `You are a specialized animation expert for an AI logo generator.
Your task is to analyze an SVG logo and brand context, then devise the most suitable and compelling animation strategy.

IMPORTANT REQUIREMENTS:
1.  Analyze the SVG's structure (paths, groups, text elements) to identify animation opportunities.
2.  Consider the brand's personality (from the design spec) to ensure the animation style is aligned.
3.  The goal is to enhance the logo, not distract from it. Prefer subtle, professional animations.
4.  You MUST output your animation plan as a single, valid JSON object that conforms to the AnimationOptions interface.

Example Output:
\`\`\`json
{
  "type": "draw",
  "timing": {
    "duration": 2500,
    "easing": "ease-out",
    "delay": 500
  }
}
\`\`\`

Available Animation Types: ${Object.values(AnimationType).join(', ')}
Available Easing Functions: ${Object.values(AnimationEasing).join(', ')}
`;
  }

  /**
   * Generates a prompt for the AI to determine animation options.
   */
  protected async generatePrompt(input: AnimationAgentInput): Promise<string> {
    const { svg, designSpec } = input;

    const prompt = `
# SVG Animation Task

## SVG Content
Analyze the following SVG structure. Pay attention to element IDs, groups (<g>), paths, and text.
\`\`\`xml
${svg}
\`\`\`

## Brand Context
Use the following brand information to inform the animation's style, pacing, and personality.
\`\`\`json
${JSON.stringify(designSpec, null, 2)}
\`\`\`

## Your Task
Based on the SVG structure and brand context, determine the optimal animation. The animation should be visually appealing, technically sound, and aligned with the brand identity.

Return your answer as a single JSON object conforming to the AnimationOptions interface, enclosed in \`\`\`json tags.
`;
    return prompt;
  }

  /**
   * Processes the AI's response to apply the animation.
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput,
  ): Promise<AnimationAgentOutput> {
    const input = originalInput as AnimationAgentInput;
    const parsedOptions = safeJsonParse(responseContent);

    if (!parsedOptions || typeof parsedOptions !== 'object') {
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

    // Validate required fields
    if (!parsedOptions.type || !parsedOptions.timing) {
      return {
        success: false,
        error: handleError({
          error: 'AI response is missing required fields: type or timing',
          category: ErrorCategory.API,
          details: { parsedOptions },
          retryable: true,
        }),
      };
    }

    const animationOptions = parsedOptions as AnimationOptions;
    this.log(`Applying ${animationOptions.type} animation as recommended by AI.`);

    const animationResponse = await this.animationService.animateSVG(
      input.svg,
      animationOptions,
    );

    if (!animationResponse.success || !animationResponse.result) {
      return {
        success: false,
        error: handleError({
          error: 'Failed to apply animation using SVGAnimationService.',
          category: ErrorCategory.EXTERNAL,
          details: { animationError: animationResponse.error?.message || 'Unknown animation service error' },
          retryable: false,
        }),
      };
    }

    this.log('Animation applied successfully.');

    return {
      success: true,
      result: {
        animatedSvg: animationResponse.result.animatedSvg,
        cssCode: animationResponse.result.cssCode || '',
        jsCode: animationResponse.result.jsCode,
        animationOptions: animationOptions,
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}