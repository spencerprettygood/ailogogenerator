import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  RequirementsAgentInput,
  RequirementsAgentOutput,
} from '../../types-agents';
import { DesignSpec } from '../../types';
import { safeJsonParse } from '../../utils/json-utils';
import { handleError, ErrorCategory } from '../../utils/error-handler';

/**
 * RequirementsAgent - Analyzes user brief to extract structured design requirements
 */
export class RequirementsAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('requirements', ['requirements-analysis'], {
      model: 'claude-3-haiku-20240307', // Use faster model for analysis
      temperature: 0.1, // Low temperature for consistent, deterministic output
      maxTokens: 2048, // Increased token limit for more detailed specs
      ...config,
    });

    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized design requirements analyzer for an AI-powered logo generator.
    
Your task is to analyze a brief provided by the user and extract structured design requirements.
Focus on understanding the brand identity, design preferences, and target audience.

IMPORTANT: You MUST return your analysis as a single, valid JSON object enclosed in \`\`\`json tags. The structure must be as follows:
{
  "brand_name": "extracted brand name",
  "brand_description": "concise description of what the brand is/does",
  "style_preferences": "design style, aesthetics, look and feel",
  "color_palette": "preferred colors or color meanings",
  "imagery": "icons, symbols, or visual elements to include",
  "target_audience": "who the brand targets",
  "additional_requests": "any other specific requests from the brief",
  "industry": "the primary industry category for the brand (e.g., technology, finance, healthcare, retail, etc.)"
}

Every field in the JSON is REQUIRED. If information for a field is completely missing, make a reasonable inference based on the brief and industry context.

Do NOT include any text before or after the JSON object.
Your entire response must be a single, valid JSON object.`;
  }

  /**
   * Generate the prompt for the requirements analysis
   */
  protected async generatePrompt(input: RequirementsAgentInput): Promise<string> {
    const { brief, imageDescriptions } = input;

    let prompt = `Please analyze this logo brief and extract the key design requirements as structured JSON, following the format specified in my instructions.\n\n# Logo Brief:\n${brief}`;

    // Add image descriptions if available
    if (imageDescriptions && imageDescriptions.length > 0) {
      prompt += `\n\n# Reference Images:\nThe user has also provided reference images with the following descriptions:\n- ${imageDescriptions.join('\n- ')}`;
    }

    prompt += '\n\nReturn your analysis in a single, valid JSON object inside \`\`\`json tags.';

    return prompt;
  }

  /**
   * Process the response from the AI
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput
  ): Promise<RequirementsAgentOutput> {
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

    const designSpec = parsed as DesignSpec;

    // Validate that all required fields are present
    const requiredFields: (keyof DesignSpec)[] = [
      'brand_name',
      'brand_description',
      'style_preferences',
      'color_palette',
      'imagery',
      'target_audience',
      'additional_requests',
      'industry',
    ];

    const missingFields = requiredFields.filter(
      field => !(field in designSpec) || !designSpec[field]
    );

    if (missingFields.length > 0) {
      const errorMessage = `Missing or empty required fields in design spec: ${missingFields.join(', ')}`;
      return {
        success: false,
        error: handleError({
          error: errorMessage,
          category: ErrorCategory.API,
          details: { parsedResponse: designSpec, missingFields },
          retryable: true,
        }),
      };
    }

    this.log('Successfully parsed and validated design spec.');
    return {
      success: true,
      result: { designSpec },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}
