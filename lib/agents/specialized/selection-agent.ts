import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SelectionAgentInput, 
  SelectionAgentOutput 
} from '../../types-agents';

/**
 * SelectionAgent - Evaluates and selects the best concept from the moodboard
 */
export class SelectionAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'selection', 
      ['selection'],
      {
        model: 'claude-3-5-haiku-20240307', // Use faster model for analysis
        temperature: 0.3, // Low temperature for consistent decision-making
        maxTokens: 1000,
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized selection agent for an AI-powered logo generator.
    
Your task is to evaluate multiple logo concepts and select the one that best matches the design specifications.
You should consider alignment with brand identity, target audience, visual appeal, and practicality.

IMPORTANT: You MUST return your selection as valid JSON in the following format:
{
  "selection": {
    "selectedConcept": {
      // Copy of the selected concept object
    },
    "selectionRationale": "detailed explanation of why this concept was selected",
    "score": 85 // A score from 0-100 representing how well this concept matches the requirements
  }
}

Your selection rationale should analyze:
1. How well the concept aligns with the brand's identity and values
2. Appropriateness for the target audience
3. Visual distinctiveness and memorability
4. Practicality for various use cases (digital, print, etc.)
5. Adherence to any specific requirements in the brief

Your entire response must be valid JSON that can be parsed directly.
Do NOT include any text before or after the JSON object.`;
  }
  
  /**
   * Generate the prompt for the concept selection
   */
  protected async generatePrompt(input: SelectionAgentInput): Promise<string> {
    const { designSpec, concepts } = input;
    
    // Create a detailed prompt that includes both the design spec and the concepts
    let prompt = `Please evaluate these logo concepts and select the best one based on these design specifications:

Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Style Preferences: ${designSpec.style_preferences}
Color Palette: ${designSpec.color_palette}
Imagery Requirements: ${designSpec.imagery}
Target Audience: ${designSpec.target_audience}
Additional Requests: ${designSpec.additional_requests}

Here are the concepts to evaluate:

`;

    // Add each concept
    concepts.forEach((concept, index) => {
      prompt += `CONCEPT ${index + 1}: ${concept.name}
Description: ${concept.description}
Style: ${concept.style}
Colors: ${concept.colors}
Imagery: ${concept.imagery}

`;
    });
    
    prompt += `Please select the BEST concept that most closely matches the design specifications and explain your reasoning.`;
    
    return prompt;
  }
  
  /**
   * Process the response from Claude
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SelectionAgentOutput> {
    try {
      // Clean and parse the JSON response
      const cleanedContent = responseContent.trim();
      
      // Try to extract JSON from response if it's not pure JSON
      let jsonContent = cleanedContent;
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const selectionData = JSON.parse(jsonContent);
      
      // Validate the selection object
      if (!selectionData.selection || 
          !selectionData.selection.selectedConcept || 
          !selectionData.selection.selectionRationale || 
          !selectionData.selection.score) {
        return {
          success: false,
          error: {
            message: 'Invalid selection format: missing required fields',
            details: selectionData
          }
        };
      }
      
      // Validate score is in range
      const score = selectionData.selection.score;
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return {
          success: false,
          error: {
            message: 'Invalid score: must be a number between 0 and 100',
            details: { score }
          }
        };
      }
      
      // Validate selected concept has all required fields
      const requiredFields = ['name', 'description', 'style', 'colors', 'imagery'];
      const concept = selectionData.selection.selectedConcept;
      
      const missingFields = requiredFields.filter(field => !concept[field]);
      if (missingFields.length > 0) {
        return {
          success: false,
          error: {
            message: `Selected concept missing required fields: ${missingFields.join(', ')}`,
            details: { concept, missingFields }
          }
        };
      }
      
      // If we have an override in the context, use that concept
      const input = originalInput as SelectionAgentInput;
      if (this.context?.overrides?.manualConceptSelection !== undefined) {
        const index = this.context.overrides.manualConceptSelection as number;
        if (index >= 0 && index < input.concepts.length) {
          const manualConcept = input.concepts[index];
          return {
            success: true,
            result: {
              selection: {
                selectedConcept: manualConcept,
                selectionRationale: "Manually selected by user.",
                score: 100
              }
            }
          };
        }
      }
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          selection: selectionData.selection
        }
      };
    } catch (error) {
      console.error('Failed to process selection agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse concept selection',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}