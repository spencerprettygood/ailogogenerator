import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  DesignSpec, 
  RequirementsAgentInput, 
  RequirementsAgentOutput 
} from '../../types-agents';
import { detectIndustry } from '../../industry-templates';

/**
 * RequirementsAgent - Analyzes user brief to extract structured design requirements
 */
export class RequirementsAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'requirements', 
      ['requirements-analysis'],
      {
        model: 'claude-3-5-haiku-20240307', // Use faster model for analysis
        temperature: 0.1, // Low temperature for consistent, deterministic output
        maxTokens: 1000,
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized design requirements analyzer for an AI-powered logo generator.
    
Your task is to analyze a brief provided by the user and extract structured design requirements.
Focus on understanding the brand identity, design preferences, and target audience.

IMPORTANT: You MUST return your analysis as valid JSON in the following format:
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

Every field in the JSON is REQUIRED, even if you have to make reasonable inferences from the brief.
If information for a field is completely missing, provide a sensible default based on industry norms and explain your choice.

Do NOT include any text before or after the JSON object.
Your entire response must be valid JSON that can be parsed directly.`;
  }
  
  /**
   * Generate the prompt for the requirements analysis
   */
  protected async generatePrompt(input: RequirementsAgentInput): Promise<string> {
    const { brief, imageDescriptions } = input;
    
    let prompt = `Please analyze this logo brief and extract the key design requirements as structured JSON:\n\n${brief}`;
    
    // Add image descriptions if available
    if (imageDescriptions && imageDescriptions.length > 0) {
      prompt += `\n\nThe user has also uploaded the following reference images:\n${imageDescriptions.join('\n')}`;
    }
    
    return prompt;
  }
  
  /**
   * Process the response from Claude
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<RequirementsAgentOutput> {
    try {
      // Parse the JSON response
      const cleanedContent = responseContent.trim();
      
      // Try to extract JSON from response if it's not pure JSON
      let jsonContent = cleanedContent;
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const designSpec = JSON.parse(jsonContent) as DesignSpec;
      
      // Validate that all required fields are present
      const requiredFields = [
        'brand_name',
        'brand_description',
        'style_preferences',
        'color_palette',
        'imagery',
        'target_audience',
        'additional_requests',
        'industry'
      ];
      
      const missingFields = requiredFields.filter(field => !designSpec[field as keyof DesignSpec]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: {
            message: `Design spec missing required fields: ${missingFields.join(', ')}`,
            details: { designSpec, missingFields }
          }
        };
      }
      
      // Automatically detect industry and add confidence score if not already set
      if (!designSpec.industry_confidence && designSpec.industry && designSpec.brand_description) {
        const detectionResult = detectIndustry(designSpec.brand_description);
        
        // If the model-provided industry is one of our supported industries, use it with a high confidence
        // Otherwise, use our detection result
        if (detectionResult.primaryIndustry === designSpec.industry) {
          designSpec.industry_confidence = Math.max(detectionResult.confidenceScore, 0.85);
        } else {
          // Keep the model's industry choice but add a moderate confidence score
          designSpec.industry_confidence = 0.7;
        }
      }
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          designSpec
        }
      };
    } catch (error) {
      console.error('Failed to process requirements agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse design requirements',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}