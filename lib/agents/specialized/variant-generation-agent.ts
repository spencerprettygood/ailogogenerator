import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  VariantGenerationAgentInput, 
  VariantGenerationAgentOutput 
} from '../../types-agents';

/**
 * VariantGenerationAgent - Creates monochrome variants and favicon from the main logo
 */
export class VariantGenerationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'variant-generation', 
      ['variant-generation'],
      {
        model: 'claude-3-haiku-20240307', // Use faster model for variant generation
        temperature: 0.3,
        maxTokens: 2000,
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized variant generation agent for an AI logo generator.
    
Your task is to create monochrome versions (black and white) and a simplified favicon version of the main SVG logo.

IMPORTANT REQUIREMENTS:
1. Create a black monochrome version (black shapes on transparent background)
2. Create a white monochrome version (white shapes on transparent background)
3. Create a simplified favicon version suitable for small display (16x16px)
4. Maintain the recognizability of the original logo in all variants
5. Follow SVG best practices for all variants
6. Ensure all SVGs have proper viewBox attributes

You MUST return your variants in the following JSON format:
{
  "variants": {
    "monochrome": {
      "black": "<!-- black monochrome SVG -->",
      "white": "<!-- white monochrome SVG -->"
    },
    "favicon": {
      "svg": "<!-- simplified favicon SVG -->"
    }
  }
}

For monochrome variants:
- Convert all colors to either pure black (#000000) or pure white (#FFFFFF)
- Remove gradients and replace with solid fills
- Maintain the original proportions and viewBox

For the favicon:
- Simplify the design to work at 16x16 pixels
- Remove fine details that won't be visible at small sizes
- Focus on maintaining core brand recognition
- Use a square viewBox (e.g., "0 0 16 16")

Your entire response must be valid JSON that can be parsed directly.
Do NOT include any text before or after the JSON object.`;
  }
  
  /**
   * Generate the prompt for variant generation
   */
  protected async generatePrompt(input: VariantGenerationAgentInput): Promise<string> {
    const { svg, brandName } = input;
    
    return `Please create monochrome and favicon variants for the following SVG logo for "${brandName}":

\`\`\`svg
${svg}
\`\`\`

Create:
1. A pure black monochrome version (all visible elements in #000000)
2. A pure white monochrome version (all visible elements in #FFFFFF)
3. A simplified favicon version that works well at 16x16 pixels

Maintain the core identity and recognizability of the logo while adapting it appropriately for each variant.
Ensure all SVG variants are valid, optimized, and follow best practices.`;
  }
  
  /**
   * Process the response from Claude
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<VariantGenerationAgentOutput> {
    try {
      // Clean and parse the JSON response
      const cleanedContent = responseContent.trim();
      
      // Try to extract JSON from response if it's not pure JSON
      let jsonContent = cleanedContent;
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const variantData = JSON.parse(jsonContent);
      
      // Validate the variants structure
      if (!variantData.variants || 
          !variantData.variants.monochrome || 
          !variantData.variants.favicon ||
          !variantData.variants.monochrome.black ||
          !variantData.variants.monochrome.white ||
          !variantData.variants.favicon.svg) {
        return {
          success: false,
          error: {
            message: 'Invalid variants format: missing required fields',
            details: variantData
          }
        };
      }
      
      // Basic validation of SVG content for each variant
      const blackSvg = variantData.variants.monochrome.black;
      const whiteSvg = variantData.variants.monochrome.white;
      const faviconSvg = variantData.variants.favicon.svg;
      
      // Validate SVG structure
      for (const [name, svg] of [
        ['black monochrome', blackSvg], 
        ['white monochrome', whiteSvg], 
        ['favicon', faviconSvg]
      ]) {
        if (!svg.includes('<svg') || !svg.includes('</svg>')) {
          return {
            success: false,
            error: {
              message: `Invalid ${name} SVG: missing SVG tags`,
              details: { svgPreview: svg.substring(0, 100) + '...' }
            }
          };
        }
      }
      
      // For this demo, we're just mocking the PNG generation
      // In a real implementation, this would use Sharp.js to convert SVGs to PNGs
      const mockPngVariants = {
        size256: 'data:image/png;base64,mockPngData256',
        size512: 'data:image/png;base64,mockPngData512',
        size1024: 'data:image/png;base64,mockPngData1024'
      };
      
      // Mock ICO generation
      const mockIco = 'data:image/x-icon;base64,mockIcoData';
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          variants: {
            monochrome: {
              black: blackSvg,
              white: whiteSvg
            },
            favicon: {
              svg: faviconSvg,
              ico: mockIco
            },
            pngVariants: mockPngVariants
          }
        }
      };
    } catch (error) {
      console.error('Failed to process variant generation agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse variant generation output',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}