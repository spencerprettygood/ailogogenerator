import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  GuidelineAgentInput, 
  GuidelineAgentOutput 
} from '../../types-agents';

/**
 * GuidelineAgent - Creates comprehensive brand guidelines document
 */
export class GuidelineAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'guideline', 
      ['guideline-creation'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use more powerful model for detailed guidelines
        temperature: 0.4,
        maxTokens: 4000, // Larger token limit for comprehensive guidelines
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized brand guidelines generator for an AI logo generator.
    
Your task is to create comprehensive, professional brand guidelines based on the logo design and specifications.

IMPORTANT: Create a complete HTML document with embedded CSS that includes:

1. Logo Usage Guidelines
   - Clear space requirements
   - Minimum size requirements
   - Approved variants and when to use them
   - Examples of proper and improper logo usage

2. Color Palette
   - Primary and secondary colors with hex codes
   - Color usage guidelines and examples

3. Typography
   - Recommended fonts that complement the logo
   - Hierarchy and usage examples

4. Brand Voice & Tone
   - Brief overview of brand personality
   - Communication style recommendations

The HTML document should:
- Be professionally designed with clean layout
- Include all necessary CSS inline (no external dependencies)
- Have a responsive design that works on mobile and desktop
- Include the SVG logo and its variants embedded directly
- Be under 100KB in total size

You MUST return ONLY the complete HTML document with no additional text before or after.
The HTML should start with <!DOCTYPE html> and include all necessary structure.`;
  }
  
  /**
   * Generate the prompt for brand guidelines generation
   */
  protected async generatePrompt(input: GuidelineAgentInput): Promise<string> {
    const { variants, designSpec } = input;
    
    // Prepare SVG data for inclusion in the prompt
    const mainLogo = variants.monochrome.black; // We'll use the black variant as base
    const blackVariant = variants.monochrome.black;
    const whiteVariant = variants.monochrome.white;
    const favicon = variants.favicon.svg;
    
    return `Please create comprehensive brand guidelines for the following brand:

BRAND INFORMATION:
Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Style Preferences: ${designSpec.style_preferences}
Color Palette: ${designSpec.color_palette}
Target Audience: ${designSpec.target_audience}

LOGO VARIANTS:
Main Logo (SVG):
\`\`\`svg
${mainLogo}
\`\`\`

Black Monochrome (SVG):
\`\`\`svg
${blackVariant}
\`\`\`

White Monochrome (SVG):
\`\`\`svg
${whiteVariant}
\`\`\`

Favicon (SVG):
\`\`\`svg
${favicon}
\`\`\`

Please create a complete, professional HTML brand guidelines document that includes:
1. Logo usage rules (spacing, sizing, backgrounds)
2. Color palette with hex codes and usage guidance
3. Typography recommendations
4. Do's and don'ts for logo usage
5. Brand voice/tone recommendations

The HTML should be modern, responsive, and include all CSS inline. Embed the SVG logos directly in the HTML.`;
  }
  
  /**
   * Process the response from Claude
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<GuidelineAgentOutput> {
    try {
      // Clean the response to extract HTML
      const cleanedContent = responseContent.trim();
      
      // Basic validation of HTML structure
      if (!cleanedContent.includes('<!DOCTYPE html>') || 
          !cleanedContent.includes('<html') ||
          !cleanedContent.includes('</html>')) {
        
        // Try to extract HTML if it's wrapped in other content
        const htmlMatch = cleanedContent.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        if (!htmlMatch) {
          return {
            success: false,
            error: {
              message: 'Invalid guidelines: not a proper HTML document',
              details: { preview: cleanedContent.substring(0, 100) + '...' }
            }
          };
        }
      }
      
      // Check for required sections
      const requiredSections = ['logo', 'color', 'typography', 'usage'];
      const missingSection = requiredSections.find(section => 
        !cleanedContent.toLowerCase().includes(section)
      );
      
      if (missingSection) {
        return {
          success: false,
          error: {
            message: `Guidelines missing required section: ${missingSection}`,
            details: { missingSection }
          }
        };
      }
      
      // Check if SVGs are included
      if (!cleanedContent.includes('<svg') || !cleanedContent.includes('</svg>')) {
        return {
          success: false,
          error: {
            message: 'Guidelines missing embedded SVG logos',
            details: {}
          }
        };
      }
      
      // Check file size (100KB limit)
      const htmlSize = Buffer.byteLength(cleanedContent, 'utf8');
      if (htmlSize > 100 * 1024) {
        return {
          success: false,
          error: {
            message: `Guidelines exceed size limit: ${Math.round(htmlSize / 1024)}KB (max 100KB)`,
            details: { size: htmlSize }
          }
        };
      }
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          html: cleanedContent
        }
      };
    } catch (error) {
      console.error('Failed to process guidelines agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse guidelines output',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}