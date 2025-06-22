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
        fallbackModels: ['claude-3-5-sonnet-20240229', 'claude-3-opus-20240229'], // Fallback models if primary fails
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
   * Sanitize JSON string by removing control characters that cause parsing errors
   */
  private sanitizeJsonString(jsonString: string): string {
    // Replace control characters (0x00-0x1F) except for valid JSON whitespace (\n, \r, \t)
    // This regex replaces all control chars with empty string except allowed whitespace
    const sanitized = jsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Also try to fix common JSON syntax issues:
    // 1. Unescaped backslashes in strings
    // 2. Unescaped quotes in strings
    // But we have to be careful not to break valid JSON...
    
    return sanitized;
  }

  /**
   * Process the response from Claude
   * This method parses the SVG generation output with robust error handling
   * for control characters and other JSON parsing issues
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
      
      // Sanitize the JSON string to remove problematic control characters
      const sanitizedJsonContent = this.sanitizeJsonString(jsonContent);
      
      // Try parsing with more detailed error handling
      let svgData;
      try {
        svgData = JSON.parse(sanitizedJsonContent);
      } catch (parseError) {
        console.error('JSON parse error details:', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          jsonPreview: sanitizedJsonContent.substring(0, 100) + '...',
          // Try to identify the position of the error if available
          position: parseError instanceof SyntaxError && 
                   parseError.message.includes('position') ? 
                   parseError.message.match(/position (\d+)/)?.[1] : 'unknown'
        });
        
        // As a fallback, try to extract just the SVG part if the JSON parsing failed
        // This is a more robust approach to extract values that handles multi-line strings
        // First, try to find SVG content between <svg> tags
        let extractedSvg = '';
        let extractedRationale = '';
        
        // Extract SVG - try multiple approaches
        // 1. First look for SVG content between actual SVG tags
        const svgTagMatch = sanitizedJsonContent.match(/<svg[\s\S]*<\/svg>/);
        if (svgTagMatch) {
          extractedSvg = svgTagMatch[0];
          console.log('Found SVG content by matching SVG tags');
        } else {
          // 2. Try to extract from JSON if that didn't work
          const svgKeyMatch = sanitizedJsonContent.match(/"svg"\s*:\s*"([\s\S]*?)(?:"|,\s*")/);
          if (svgKeyMatch) {
            extractedSvg = svgKeyMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            console.log('Found SVG content by matching JSON key');
          }
        }
        
        // Extract design rationale
        const rationaleMatch = sanitizedJsonContent.match(/"designRationale"\s*:\s*"([\s\S]*?)(?:"|,\s*")/);
        if (rationaleMatch) {
          extractedRationale = rationaleMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          console.log('Found design rationale by matching JSON key');
        } else {
          // As a last resort, use any substantial text after the SVG as the rationale
          const remainingContent = sanitizedJsonContent.split(extractedSvg)[1];
          if (remainingContent && remainingContent.length > 50) {
            // Take up to 500 chars of remaining content as a fallback rationale
            extractedRationale = remainingContent.substring(0, 500);
            console.log('Using fallback method for design rationale');
          }
        }
        
        if (extractedSvg && extractedSvg.includes('<svg')) {
          // Construct a manual object if we were able to extract the SVG content
          svgData = {
            svg: extractedSvg,
            designRationale: extractedRationale || 'Design rationale not available due to parsing error.'
          };
          console.log('Recovered SVG data through alternative extraction');
        } else {
          // If still not able to extract SVG, rethrow the error
          console.error('Failed to extract SVG content with fallback methods');
          throw parseError;
        }
      }
      
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
      
      // Basic validation and sanitization of SVG content
      let svgContent = svgData.svg;
      
      // If the SVG doesn't have proper tags, try to find them
      if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
        // Try to extract SVG tags from the content if they're embedded
        const embeddedSvgMatch = svgContent.match(/<svg[\s\S]*<\/svg>/);
        if (embeddedSvgMatch) {
          svgContent = embeddedSvgMatch[0];
          console.log('Extracted embedded SVG tags from content');
        } else {
          return {
            success: false,
            error: {
              message: 'Invalid SVG: missing SVG tags',
              details: { svgPreview: svgContent.substring(0, 100) + '...' }
            }
          };
        }
      }
      
      // Ensure the SVG has proper XML declaration and namespace
      if (!svgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
        // Add the SVG namespace if it's missing
        svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        console.log('Added missing SVG namespace');
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
      
      // If everything is valid, return the processed result with the sanitized SVG
      return {
        success: true,
        result: {
          svg: svgContent,
          designRationale: svgData.designRationale
        }
      };
    } catch (error) {
      console.error('Failed to process SVG generation agent response:', error);
      
      // Check if this is a JSON parsing error with control characters
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('control character')) {
        // Provide more specific error details for control character issues
        return {
          success: false,
          error: {
            message: 'Failed to parse SVG generation output due to invalid control characters',
            details: {
              originalError: errorMessage,
              suggestion: 'SVG generation failed due to control characters in the response. This is usually a temporary issue with the Claude API. Please try again.'
            }
          }
        };
      }
      
      return {
        success: false,
        error: {
          message: 'Failed to parse SVG generation output',
          details: errorMessage
        }
      };
    }
  }
}