import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  MoodboardAgentInput, 
  MoodboardAgentOutput 
} from '../../types-agents';

/**
 * MoodboardAgent - Generates multiple design concepts based on requirements
 */
export class MoodboardAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'moodboard', 
      ['concept-generation'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use more creative model for concept generation
        temperature: 0.7, // Higher temperature for creative variety
        maxTokens: 2000,
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized concept generator for an AI-powered logo generator.
    
Your task is to generate 3 distinct visual concepts for a logo based on the design specifications provided.
Each concept should have a unique approach while still satisfying the design requirements.

IMPORTANT: You MUST return your concepts as valid JSON in the following format:
{
  "concepts": [
    {
      "name": "concept name that captures the essence",
      "description": "detailed description of the visual concept",
      "style": "specific design style and approach",
      "colors": "specific color palette with hex codes",
      "imagery": "specific visual elements and their arrangement"
    },
    {
      // second concept
    },
    {
      // third concept
    }
  ]
}

For each concept:
1. Give it a distinctive name that captures its essence
2. Provide a detailed description that would enable a designer to visualize it
3. Specify a concrete style, not just generic terms
4. Include specific colors with hex codes (e.g., #FF5733)
5. Describe concrete imagery and composition

Make each concept truly distinct from the others in visual approach, not just minor variations.
Your entire response must be valid JSON that can be parsed directly.
Do NOT include any text before or after the JSON object.`;
  }
  
  /**
   * Generate the prompt for the moodboard generation
   */
  protected async generatePrompt(input: MoodboardAgentInput): Promise<string> {
    const { designSpec } = input;
    
    // Format the design spec into a detailed prompt
    return `Please generate 3 distinct visual concepts for a logo based on these design specifications:

Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Style Preferences: ${designSpec.style_preferences}
Color Palette: ${designSpec.color_palette}
Imagery Requirements: ${designSpec.imagery}
Target Audience: ${designSpec.target_audience}
Additional Requests: ${designSpec.additional_requests}

Create 3 truly different approaches that could work for this brand. Make them distinct in style, imagery, and overall feel.`;
  }
  
  /**
   * Process the response from Claude
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<MoodboardAgentOutput> {
    try {
      // Clean and parse the JSON response
      const cleanedContent = responseContent.trim();
      
      // Try to extract JSON from response if it's not pure JSON
      let jsonContent = cleanedContent;
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const moodboardData = JSON.parse(jsonContent);
      
      // Validate the structure
      if (!moodboardData.concepts || !Array.isArray(moodboardData.concepts) || moodboardData.concepts.length < 3) {
        return {
          success: false,
          error: {
            message: 'Invalid moodboard format: must contain 3 concepts',
            details: moodboardData
          }
        };
      }
      
      // Validate each concept has the required fields
      const requiredFields = ['name', 'description', 'style', 'colors', 'imagery'];
      
      for (const [index, concept] of moodboardData.concepts.entries()) {
        const missingFields = requiredFields.filter(field => !concept[field]);
        
        if (missingFields.length > 0) {
          return {
            success: false,
            error: {
              message: `Concept ${index + 1} missing required fields: ${missingFields.join(', ')}`,
              details: { concept, missingFields }
            }
          };
        }
      }
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          moodboard: {
            concepts: moodboardData.concepts
          }
        }
      };
    } catch (error) {
      console.error('Failed to process moodboard agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse moodboard concepts',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}