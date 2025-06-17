import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SVGGenerationAgentInput, 
  SVGGenerationAgentOutput 
} from '../../types-agents';

/**
 * SVGGenerationAgent - Creates production-ready SVG logo based on selected concept
 */
export class SVGGenerationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'svg-generation', 
      ['svg-generation'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use full model for detailed SVG generation
        temperature: 0.5, // Balanced temperature for creativity with consistency
        maxTokens: 4000, // Larger token limit for SVG generation
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized SVG logo generation agent for an AI logo generator.
    
Your task is to generate a professional, production-ready SVG logo based on the selected design concept and specifications.

IMPORTANT REQUIREMENTS:
1. Create ONLY valid, optimized SVG code that follows best practices
2. Use a viewBox of "0 0 300 300" for consistent scaling
3. Keep the SVG code under 15KB
4. Use ONLY the following SVG elements: svg, g, path, circle, rect, polygon, text, defs, linearGradient, radialGradient, stop
5. Do NOT use: script, image, foreignObject, use, or any event handlers
6. Ensure the logo is:
   - Visually balanced
   - Scalable without loss of quality
   - Appropriate for the brand's identity
   - Following the color palette from the concept
   
You MUST return your response in the following JSON format:
{
  "svg": "<!-- full SVG code here -->",
  "designRationale": "explanation of your design decisions"
}

The SVG code should be a complete, valid SVG with proper syntax and optimization.
It must work when pasted directly into an HTML file or opened in a browser.
Do NOT include any text before or after the JSON object.`;
  }
  
  /**
   * Generate the prompt for SVG generation
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;
    
    return `Please generate a professional SVG logo based on the following design specifications and selected concept:

BRAND DETAILS:
Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Target Audience: ${designSpec.target_audience}

SELECTED CONCEPT:
Name: ${selectedConcept.name}
Description: ${selectedConcept.description}
Style: ${selectedConcept.style}
Colors: ${selectedConcept.colors}
Imagery: ${selectedConcept.imagery}

Additional Requirements:
- The logo should be visually balanced with proper use of negative space
- Use the viewBox "0 0 300 300"
- Optimize the SVG code for file size and rendering performance
- Ensure the logo is unique, memorable, and professionally executed
- The logo should be simple enough to be recognizable at small sizes
- The output must be a complete, valid SVG file that works in all modern browsers
- Do not use filters or complex effects that might not render consistently

Please generate the SVG code for this logo and explain your design decisions.`;
  }
  
  /**
   * Process the response from Claude
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGGenerationAgentOutput> {
    try {
      // Clean and parse the JSON response
      const cleanedContent = responseContent.trim();
      
      // Try to extract JSON from response if it's not pure JSON
      let jsonContent = cleanedContent;
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const svgData = JSON.parse(jsonContent);
      
      // Validate the svg and designRationale fields
      if (!svgData.svg || !svgData.designRationale) {
        return {
          success: false,
          error: {
            message: 'Invalid SVG generation output: missing required fields',
            details: svgData
          }
        };
      }
      
      // Basic validation of SVG content
      const svgContent = svgData.svg;
      if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
        return {
          success: false,
          error: {
            message: 'Invalid SVG: missing SVG tags',
            details: { svgPreview: svgContent.substring(0, 100) + '...' }
          }
        };
      }
      
      // Check for disallowed elements
      const disallowedElements = ['script', 'image', 'foreignObject', 'use'];
      for (const element of disallowedElements) {
        if (svgContent.includes(`<${element}`)) {
          return {
            success: false,
            error: {
              message: `Invalid SVG: contains disallowed element: ${element}`,
              details: { element }
            }
          };
        }
      }
      
      // Check for event handlers
      if (svgContent.match(/\son\w+=/i)) {
        return {
          success: false,
          error: {
            message: 'Invalid SVG: contains event handlers',
            details: { svgPreview: svgContent.substring(0, 100) + '...' }
          }
        };
      }
      
      // Check file size
      const svgSize = Buffer.byteLength(svgContent, 'utf8');
      if (svgSize > 15 * 1024) { // 15KB limit
        return {
          success: false,
          error: {
            message: `SVG exceeds size limit: ${Math.round(svgSize / 1024)}KB (max 15KB)`,
            details: { size: svgSize }
          }
        };
      }
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          svg: svgContent,
          designRationale: svgData.designRationale
        }
      };
    } catch (error) {
      console.error('Failed to process SVG generation agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse SVG generation output',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}