import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  RequirementsAgentInput, 
  RequirementsAgentOutput 
} from '../../types-agents';
import { DesignSpec, LogoBrief } from '../../types';
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
        model: 'claude-3-haiku-20240307', // Use faster model for analysis
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
Your entire response must be valid JSON that can be parsed directly.

# Few-Shot Examples

Here are examples of high-quality inputs and outputs that show how to extract structured requirements:

## Example 1: Tech Startup

User Brief: "I need a logo for my new tech startup called ByteWave. We're building a platform that helps companies manage their cloud infrastructure more efficiently. Our target users are IT professionals and CIOs at mid to large enterprises. I like clean, modern designs with maybe some blue colors since that feels trustworthy and tech-oriented."

Expected Output:
\`\`\`json
{
  "brand_name": "ByteWave",
  "brand_description": "A platform that helps companies manage cloud infrastructure efficiently",
  "style_preferences": "Clean, modern, professional, minimalist",
  "color_palette": "Blues with accents of white and possibly light gray; focus on trustworthy and tech-oriented colors",
  "imagery": "Abstract wave patterns, cloud symbols, data visualization elements, or circuit-like connections",
  "target_audience": "IT professionals and CIOs at mid to large enterprises",
  "additional_requests": "Design should convey efficiency and reliability",
  "industry": "Technology"
}
\`\`\`

## Example 2: Local Bakery

User Brief: "We're opening a neighborhood bakery called 'Flour & Joy' that specializes in artisanal sourdough and pastries made with organic ingredients. We want to attract health-conscious families and young professionals in our urban neighborhood. Something warm and inviting would be nice."

Expected Output:
\`\`\`json
{
  "brand_name": "Flour & Joy",
  "brand_description": "Neighborhood bakery specializing in artisanal sourdough and organic pastries",
  "style_preferences": "Warm, inviting, artisanal, handcrafted feel",
  "color_palette": "Warm earthy tones like terracotta, cream, soft browns; potentially wheat gold accents",
  "imagery": "Wheat stalks, bread, rolling pin, or other baking elements; possibly hand-drawn style",
  "target_audience": "Health-conscious families and young professionals in urban neighborhoods",
  "additional_requests": "Emphasize organic and artisanal nature of products",
  "industry": "Food & Beverage"
}
\`\`\`

## Example 3: Fitness Brand with Image

User Brief: "I'm launching 'FlexFit' - a fitness program for busy professionals who want efficient workouts. The program includes 30-minute HIIT sessions and nutrition planning. I've attached an image of the type of aesthetic I like - energetic and bold."

Image Description: "A modern fitness logo with dynamic angles, bold typography, and gradient colors from orange to red. The image shows an abstract representation of movement."

Expected Output:
\`\`\`json
{
  "brand_name": "FlexFit",
  "brand_description": "Fitness program offering efficient 30-minute HIIT workouts and nutrition planning for busy professionals",
  "style_preferences": "Energetic, bold, modern, dynamic",
  "color_palette": "Gradient colors from orange to red; high energy colors with strong contrast",
  "imagery": "Abstract representation of movement, dynamic angles, possibly incorporating a stylized 'F' or timer element",
  "target_audience": "Busy professionals seeking efficient, effective fitness solutions",
  "additional_requests": "Convey energy and efficiency; incorporate elements from reference image",
  "industry": "Fitness & Health"
}
\`\`\`

Use these examples as a guide for how to properly extract and structure design requirements from user briefs.`;
  }
  
  /**
   * Generate the prompt for the requirements analysis
   */
  protected async generatePrompt(input: RequirementsAgentInput): Promise<string> {
    const { brief, imageDescriptions } = input;
    
    let prompt = `Please analyze this logo brief and extract the key design requirements as structured JSON, following the format specified in my instructions.\n\nLOGO BRIEF:\n${brief}`;
    
    // Add image descriptions if available
    if (imageDescriptions && imageDescriptions.length > 0) {
      prompt += `\n\nREFERENCE IMAGES:\nThe user has also uploaded the following reference images:\n${imageDescriptions.join('\n')}`;
    }
    
    // Add structured guidance for common industries if we can detect the likely industry
    const detectedIndustry = this.detectIndustryFromBrief(brief);
    if (detectedIndustry) {
      prompt += `\n\nNOTE: The brief appears to be related to the ${detectedIndustry} industry. Consider industry-specific design conventions while maintaining the brand's unique identity.`;
    }
    
    return prompt;
  }
  
  /**
   * Helper method to detect possible industry from brief to provide better contextual examples
   */
  private detectIndustryFromBrief(brief: string): string | null {
    // Simple keyword-based detection for common industries
    const industryKeywords: Record<string, string[]> = {
      'Technology': ['tech', 'software', 'app', 'digital', 'IT', 'computer', 'AI', 'artificial intelligence', 'platform', 'SaaS'],
      'Finance': ['finance', 'bank', 'investment', 'money', 'financial', 'accounting', 'insurance', 'wealth'],
      'Healthcare': ['health', 'medical', 'doctor', 'clinic', 'hospital', 'wellness', 'therapy', 'pharmaceutical'],
      'Food & Beverage': ['food', 'restaurant', 'cafe', 'bakery', 'coffee', 'catering', 'cuisine', 'bistro', 'menu'],
      'Retail': ['shop', 'store', 'retail', 'boutique', 'fashion', 'clothing', 'apparel', 'merchandise'],
      'Education': ['education', 'school', 'academy', 'university', 'college', 'learning', 'teaching', 'tutor', 'training'],
      'Real Estate': ['real estate', 'property', 'housing', 'realty', 'apartment', 'home', 'construction', 'development']
    };
    
    // Lowercase the brief for case-insensitive matching
    const briefLower = brief.toLowerCase();
    
    // Check each industry's keywords against the brief
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      for (const keyword of keywords) {
        if (briefLower.includes(keyword.toLowerCase())) {
          return industry;
        }
      }
    }
    
    return null;
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