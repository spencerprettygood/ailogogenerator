import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  MoodboardAgentInput, 
  MoodboardAgentOutput 
} from '../../types-agents';
import { safeJsonParse } from '../../utils/json-utils';
import { handleError, ErrorCategory } from '../../utils/error-handler';

/**
 * MoodboardAgent - Generates multiple design concepts based on requirements
 */
export class MoodboardAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'moodboard', 
      ['concept-generation'],
      {
        model: 'claude-3-5-sonnet-20240620',
        temperature: 0.75, // Higher temperature for creative variety
        maxTokens: 4096, // Increased token limit for 3 detailed concepts
        ...config
      }
    );
    
    this.systemPrompt = `You are a specialized creative director for an AI-powered logo generator.
Your task is to generate 3 distinct and compelling visual concepts for a logo based on the provided design specifications.
Each concept must represent a unique creative direction but still adhere to the core requirements.

IMPORTANT: You MUST return your concepts as a single, valid JSON object enclosed in \`\`\`json tags. The structure must be as follows:
{
  "concepts": [
    {
      "name": "string", // A short, evocative name for the concept (e.g., "The Innovator's Compass")
      "description": "string", // A detailed paragraph describing the visual concept, its symbolism, and how it meets the brief.
      "style": "string", // The specific design style (e.g., "Geometric Minimalism", "Organic Hand-drawn", "Corporate Modern").
      "colors": "string", // A descriptive summary of the color palette and its rationale.
      "color_hex_codes": ["string"], // An array of specific hex codes for the palette.
      "imagery": "string" // A description of the concrete visual elements and their composition.
    },
    // ... two more concepts ...
  ]
}

For each concept, ensure the name is distinctive, the description is vivid, the style is specific, and the color palette is well-defined with hex codes. Make each concept truly different from the others.`;
  }
  
  /**
   * Generate the prompt for the moodboard generation
   */
  protected async generatePrompt(input: MoodboardAgentInput): Promise<string> {
    const { designSpec } = input;
    
    const prompt = `
# Logo Concept Generation Task

## Design Specifications
Here are the design specifications for the new logo:
\`\`\`json
${JSON.stringify(designSpec, null, 2)}
\`\`\`

## Your Task
Based on the specifications above, generate 3 distinct visual concepts for the logo.
Follow the instructions in the system prompt precisely, ensuring your output is a single, valid JSON object containing three unique and well-described concepts inside \`\`\`json tags.
`;
    return prompt;
  }
  
  /**
   * Process the response from the AI
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput,
  ): Promise<MoodboardAgentOutput> {
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

    if (!parsed.concepts || !Array.isArray(parsed.concepts) || parsed.concepts.length < 3) {
      return {
        success: false,
        error: handleError({
          error: 'Invalid moodboard format: The \'concepts\' array must contain at least 3 concepts.',
          category: ErrorCategory.VALIDATION,
          details: { parsedResponse: parsed },
          retryable: true,
        }),
      };
    }

    // Validate each concept has the required fields
    const requiredFields = ['name', 'description', 'style', 'colors', 'color_hex_codes', 'imagery'];
    for (const [index, concept] of parsed.concepts.entries()) {
      const missingFields = requiredFields.filter(field => !(field in concept) || !concept[field]);
      if (missingFields.length > 0) {
        return {
          success: false,
          error: handleError({
            error: `Concept ${index + 1} is missing or has empty required fields: ${missingFields.join(', ')}`,
            category: ErrorCategory.VALIDATION,
            details: { concept, missingFields, conceptIndex: index },
            retryable: true,
          }),
        };
      }
    }

    return {
      success: true,
      result: {
        moodboard: {
          concepts: parsed.concepts,
        },
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}