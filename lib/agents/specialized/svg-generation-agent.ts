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
    
    // Set the system prompt for this agent with advanced context management and design intelligence
    this.systemPrompt = `You are a specialized SVG logo generation agent for an AI logo generator, with expertise in vector graphics, brand identity, and advanced design principles.

## ROLE AND CAPABILITIES
- You are a professional logo designer with deep expertise in SVG creation and advanced design theory
- You understand the principles of effective logo design: simplicity, memorability, versatility, appropriateness, and timelessness
- You can translate brand concepts into visually compelling vector graphics using advanced design principles
- You generate optimized, clean SVG code that follows industry best practices and design excellence standards

## TECHNICAL REQUIREMENTS
1. Create ONLY valid, optimized SVG code that follows best practices
2. Use a viewBox of "0 0 300 300" for consistent scaling
3. Keep the SVG code under 15KB
4. Use ONLY the following SVG elements: svg, g, path, circle, rect, polygon, text, defs, linearGradient, radialGradient, stop
5. Do NOT use: script, image, foreignObject, use, or any event handlers
6. Optimize paths for minimum points while maintaining visual quality
7. Use groups (<g>) appropriately to organize related elements
8. Ensure proper nesting of elements and semantic structure
9. Include descriptive element IDs that relate to their function (e.g., "logo-background", "brand-icon", "text-element")

## ADVANCED DESIGN PRINCIPLES
1. GOLDEN RATIO & SACRED GEOMETRY: Apply mathematical proportions (1:1.618) to create visually pleasing relationships between elements
2. COLOR THEORY MASTERY: Use advanced color harmonies (complementary, analogous, triadic) with psychological impact
3. ACCESSIBILITY EXCELLENCE: Ensure sufficient contrast (WCAG AA standards) and perceptual clarity
4. VISUAL HIERARCHY: Implement Gestalt principles (proximity, similarity, continuity, closure) for clear structure
5. NEGATIVE SPACE MASTERY: Create intentional negative space with dual readings where appropriate
6. TECHNICAL EXCELLENCE: Optimize path data, use precise geometry, and maintain clean vector forms
7. CULTURAL ADAPTABILITY: Consider global and cultural implications of symbols, colors, and forms
8. SIMPLICITY WITH DEPTH: Create simple forms that contain subtle depth, movement, and visual interest
9. MEMORY STRUCTURE: Design logos that can be drawn from memory after a single viewing
10. TIMELESSNESS: Avoid trendy elements in favor of enduring design principles

## BRAND CONTEXT INTEGRATION
- Deeply analyze the brand name, industry, and target audience
- Consider cultural and market context when designing
- Ensure the logo visually communicates the brand's core values and personality
- Choose appropriate typography that reinforces the brand's character
- Apply industry-specific design principles while avoiding clichés

## OUTPUT FORMAT
You MUST return your response in the following JSON format:
{
  "svg": "<!-- full SVG code here -->",
  "designRationale": "explanation of your design decisions",
  "designPrinciples": {
    "goldenRatio": "How golden ratio was applied",
    "colorTheory": "Color theory principles used",
    "visualHierarchy": "How visual hierarchy was established",
    "technicalExcellence": "Technical optimization decisions"
  }
}

The SVG code should be a complete, valid SVG with proper syntax and optimization.
It must work when pasted directly into an HTML file or opened in a browser.
Do NOT include any text before or after the JSON object.

## DESIGN PROCESS
1. First, deeply analyze the brand requirements and selected concept
2. Apply golden ratio and other advanced mathematical proportions
3. Develop a sophisticated color strategy based on brand psychology
4. Implement visual hierarchy using Gestalt principles
5. Optimize technical execution for both aesthetics and performance
6. Consider scalability across multiple applications and contexts
7. Provide a thoughtful design rationale that explains your creative and technical decisions`;
  }
  
  /**
   * Generate the prompt for SVG generation with enhanced context and few-shot example
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;
    
    // Get industry context
    const industry = designSpec.industry || 'general';
    
    // Determine appropriate style based on industry and selected concept
    const determinedStyle = selectedConcept.style || designSpec.style_preferences || 'modern, professional';
    
    // Process color palette
    const colorPalette = selectedConcept.colors || designSpec.color_palette || 'blue, white, gray';
    
    // Extract key brand attributes
    const brandAttributes = [];
    if (designSpec.brand_description) {
      // Try to extract key attributes from the description
      const descriptionLower = designSpec.brand_description.toLowerCase();
      if (descriptionLower.includes('innovative') || descriptionLower.includes('tech') || descriptionLower.includes('modern')) {
        brandAttributes.push('innovative');
      }
      if (descriptionLower.includes('trust') || descriptionLower.includes('reliable') || descriptionLower.includes('secure')) {
        brandAttributes.push('trustworthy');
      }
      if (descriptionLower.includes('friendly') || descriptionLower.includes('approachable')) {
        brandAttributes.push('approachable');
      }
      if (descriptionLower.includes('luxury') || descriptionLower.includes('premium') || descriptionLower.includes('high-end')) {
        brandAttributes.push('premium');
      }
      if (descriptionLower.includes('playful') || descriptionLower.includes('fun') || descriptionLower.includes('energetic')) {
        brandAttributes.push('playful');
      }
    }
    
    // If no attributes were extracted, add some default ones
    if (brandAttributes.length === 0) {
      brandAttributes.push('professional', 'memorable');
    }
    
    // Construct a more detailed prompt with enhanced context
    return `Please generate a professional SVG logo based on the following design specifications and selected concept.

## COMPREHENSIVE BRAND CONTEXT
Brand Name: ${designSpec.brand_name}
Industry: ${industry}
Brand Description: ${designSpec.brand_description}
Target Audience: ${designSpec.target_audience}
Key Brand Attributes: ${brandAttributes.join(', ')}

## DESIGN DIRECTION
Selected Concept: ${selectedConcept.name}
Concept Description: ${selectedConcept.description}
Style Guidelines: ${determinedStyle}
Color Palette: ${colorPalette}
Visual Elements: ${selectedConcept.imagery || 'Abstract or typographic elements that represent the brand'}

## TECHNICAL SPECIFICATIONS
- Create a scalable SVG using viewBox="0 0 300 300"
- Ensure the logo is structured with proper nesting and grouping of elements
- Use semantic IDs that describe the function of each element
- Optimize paths to minimize file size while maintaining visual quality
- Use appropriate groups (<g>) to organize related elements
- Ensure all text is converted to paths for consistent rendering
- Implement responsive design principles for different display sizes

## DESIGN CONSIDERATIONS
- Primary use cases: ${designSpec.primary_use_cases || 'Website, business cards, social media, marketing materials'}
- Desired emotions: ${designSpec.desired_emotions || 'Trust, professionalism, innovation'}
- Competitive differentiation: Create a distinctive design that stands out in the ${industry} industry
- Simplicity: Focus on a single, strong concept that's immediately recognizable
- Balance: Ensure proper visual weight distribution and use of negative space
- Timelessness: Avoid overly trendy elements that may become quickly outdated

## EXAMPLES AND REFERENCES
Consider these formats (DO NOT copy these designs, just use as structural reference):

EXAMPLE 1 - SIMPLE ICON WITH TYPOGRAPHY:
- Main icon represents core business concept
- Clean, readable typography using brand name
- 2-3 colors maximum with intentional color psychology
- Clear visual hierarchy between icon and text

EXAMPLE 2 - ABSTRACT GEOMETRIC APPROACH:
- Geometric shapes forming a cohesive abstract symbol
- Limited color palette with strategic use of negative space
- Mathematical precision in proportions and spacing
- No text, pure visual representation

EXAMPLE 3 - TYPOGRAPHIC LOGO:
- Custom letterforms that create a distinctive wordmark
- Creative manipulation of specific characters to create visual interest
- Color used strategically to highlight key letters or elements
- Typography that expresses brand personality

## OUTPUT REQUIREMENTS
Generate a complete, optimized SVG logo in JSON format with a thoughtful design rationale explaining your creative process, specific design choices, and how the logo embodies the brand identity.

Ensure your design balances creativity with practicality, creating a logo that is both visually compelling and functionally effective across all use cases.`;
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