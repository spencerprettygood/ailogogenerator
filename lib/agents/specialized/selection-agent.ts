import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  SelectionAgentInput, 
  SelectionAgentOutput 
} from '../../types-agents';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { safeJsonParse } from '../../utils/json-utils';

/**
 * SelectionAgent - Evaluates and selects the best concept from the moodboard
 */
export class SelectionAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'selection', 
      ['selection'],
      {
        model: 'claude-3-haiku-20240307', // Use faster model for analysis
        temperature: 0.3, // Low temperature for consistent decision-making
        maxTokens: 1000,
        ...config
      }
    );
    
    this.systemPrompt = `You are a specialized selection agent for an AI-powered logo generator.
    
Your task is to evaluate multiple logo concepts and select the one that best matches the design specifications.
You should consider alignment with brand identity, target audience, visual appeal, and practicality.

CRITICAL: You MUST return your response as a single, valid JSON object enclosed in \`\`\`json tags.
The selectionRationale field must be a single line of text with no line breaks or unescaped quotes.

Example format:
\`\`\`json
{
  "selectedConcept": {
    "name": "concept name here",
    "description": "concept description here",
    "style": "style here",
    "colors": ["color1", "color2"],
    "imagery": "imagery description"
  },
  "selectionRationale": "Single line explanation of why this concept was selected without any line breaks or special characters",
  "score": 85
}
\`\`\`

Your selection rationale should analyze:
1. How well the concept aligns with the brand's identity and values
2. Appropriateness for the target audience
3. Visual distinctiveness and memorability
4. Practicality for various use cases (digital, print, etc.)
5. Adherence to any specific requirements in the brief

The score should be a number from 0-100 representing how well this concept matches the requirements.`;
  }
  
  /**
   * Generate the prompt for the concept selection
   */
  protected async generatePrompt(input: SelectionAgentInput): Promise<string> {
    const { designSpec, concepts } = input;
    
    // Create a detailed prompt that includes both the design spec and the concepts
    let prompt = `Please evaluate these logo concepts and select the best one based on these design specifications:

# Brand Details
- **Brand Name:** ${designSpec.brand_name}
- **Brand Description:** ${designSpec.brand_description}
- **Style Preferences:** ${designSpec.style_preferences}
- **Color Palette:** ${designSpec.color_palette}
- **Imagery Requirements:** ${designSpec.imagery}
- **Target Audience:** ${designSpec.target_audience}
- **Additional Requests:** ${designSpec.additional_requests}

# Concepts to Evaluate

`;

    // Add each concept
    concepts.forEach((concept, index) => {
      prompt += `## CONCEPT ${index + 1}: ${concept.name}
- **Description:** ${concept.description}
- **Style:** ${concept.style}
- **Colors:** ${concept.colors}
- **Imagery:** ${concept.imagery}

`;
    });
    
    prompt += `Please select the BEST concept that most closely matches the design specifications and explain your reasoning. Respond with your JSON object inside \`\`\`json tags.`;
    
    return prompt;
  }
  
  /**
   * Process the response from the AI
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SelectionAgentOutput> {
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

    // Validate required fields
    const requiredFields = ['selectedConcept', 'selectionRationale', 'score'];
    const missingFields = requiredFields.filter(field => !(field in parsed) || !parsed[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: handleError({
          error: `AI response is missing required fields: ${missingFields.join(', ')}`,
          category: ErrorCategory.API,
          details: { parsedResponse: parsed, missingFields },
          retryable: true,
        }),
      };
    }

    // Validate selectedConcept structure
    const selectedConcept = parsed.selectedConcept;
    if (!selectedConcept || typeof selectedConcept !== 'object') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid selected concept structure in AI response',
          category: ErrorCategory.API,
          details: { selectedConcept },
          retryable: true,
        }),
      };
    }

    // Validate score
    const score = parsed.score;
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return {
        success: false,
        error: handleError({
          error: 'Invalid score in AI response. Score must be a number between 0 and 100.',
          category: ErrorCategory.API,
          details: { score },
          retryable: true,
        }),
      };
    }

    this.log('Successfully processed concept selection.');
    return {
      success: true,
      result: {
        selection: {
          selectedConcept,
          selectionRationale: parsed.selectionRationale,
          score
        }
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}