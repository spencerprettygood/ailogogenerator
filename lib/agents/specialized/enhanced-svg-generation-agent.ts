/**
 * @file enhanced-svg-generation-agent.ts
 * @module lib/agents/specialized/enhanced-svg-generation-agent
 * @description Enhanced SVG logo generation agent with advanced design principles
 * 
 * This agent extends the basic SVG generation agent with sophisticated design theory:
 * - Color theory and harmonization
 * - Golden ratio and rule of thirds composition
 * - Visual weight balancing
 * - Typography optimization
 * - Negative space utilization
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 * @copyright 2024
 */

import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SVGGenerationAgentInput, 
  SVGGenerationAgentOutput,
  DesignPrinciple
} from '../../types-agents';

/**
 * @class EnhancedSVGGenerationAgent
 * @description Creates production-ready SVG logos using advanced design principles
 * 
 * @extends BaseAgent
 */
export class EnhancedSVGGenerationAgent extends BaseAgent {
  /**
   * @constructor
   * @param {Partial<AgentConfig>} [config] - Optional configuration overrides
   */
  constructor(config?: Partial<AgentConfig>) {
    super(
      'enhanced-svg-generation', 
      ['svg-generation', 'design-theory'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use full model for detailed SVG generation
        temperature: 0.5, // Balanced temperature for creativity with consistency
        maxTokens: 4000, // Larger token limit for SVG generation
        ...config
      }
    );
    
    // Set the system prompt for this agent with enhanced design theory
    this.systemPrompt = `You are an expert SVG logo generation agent with advanced training in design theory.
    
Your task is to generate a professional, production-ready SVG logo based on the selected design concept and specifications, applying sophisticated design principles to create truly exceptional results.

IMPORTANT TECHNICAL REQUIREMENTS:
1. Create ONLY valid, optimized SVG code that follows best practices
2. Use a viewBox of "0 0 300 300" for consistent scaling
3. Keep the SVG code under 15KB
4. Use ONLY the following SVG elements: svg, g, path, circle, rect, polygon, text, defs, linearGradient, radialGradient, stop
5. Do NOT use: script, image, foreignObject, use, or any event handlers
6. SVG must be valid, well-formed XML that works in all modern browsers

ADVANCED DESIGN PRINCIPLES:

COLOR THEORY:
- Use harmonious color combinations: monochromatic, analogous, complementary, split-complementary, triadic or tetradic
- Consider color psychology appropriate to the brand's industry and values
- Ensure sufficient contrast for accessibility (4.5:1 for text elements)
- Implement intentional color hierarchy to guide visual flow
- Use color to create depth, emphasis, and visual interest

COMPOSITION:
- Apply the golden ratio (1:1.618) to create naturally pleasing proportions
- Utilize rule of thirds for balanced element placement
- Create clear visual hierarchy with primary, secondary, and tertiary elements
- Use deliberate negative space as an active design element
- Ensure optical balance (not just symmetrical balance)
- Design for optimal figure-ground relationship

VISUAL WEIGHT:
- Balance dark/light elements across the composition
- Consider size, color, and complexity when distributing elements
- Create appropriate emphasis on the most important brand elements
- Use selective detail to direct attention
- Ensure the logo can maintain balance in multiple contexts

TYPOGRAPHY (WHEN APPLICABLE):
- Select or create typography that reinforces brand personality
- Apply proper kerning, tracking, and letter spacing
- Maintain appropriate contrast between font weight and surrounding elements
- Ensure letterforms work harmoniously with graphic elements
- Consider legibility at various sizes

LOGO VERSATILITY:
- Design for scalability from favicon to billboard size
- Ensure the logo works effectively in monochrome
- Consider how design elements will translate across media
- Create a logo that remains effective in multiple contexts
- Design with implementation flexibility in mind

You MUST return your response in the following JSON format:
{
  "svg": "<!-- full SVG code here -->",
  "designRationale": "explanation of your design decisions",
  "designPrinciples": {
    "colorTheory": "explanation of color choices and harmony",
    "composition": "explanation of layout and golden ratio application",
    "visualWeight": "explanation of balance and emphasis",
    "typography": "explanation of type choices and treatment",
    "negativeSpace": "explanation of figure-ground relationship"
  }
}

The SVG code should be a complete, valid SVG with proper syntax and optimization.
It must work when pasted directly into an HTML file or opened in a browser.
Do NOT include any text before or after the JSON object.`;
  }
  
  /**
   * @method generatePrompt
   * @description Generate the prompt for enhanced SVG generation with advanced design principles
   * @param {SVGGenerationAgentInput} input - Input containing design specs and selected concept
   * @returns {Promise<string>} The generated prompt
   * @protected
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;
    
    // Extract industry for industry-specific guidance
    const industry = designSpec.industry || this.detectIndustry(designSpec.brand_description);
    
    // Determine appropriate design principles based on industry and brand personality
    const designPrinciples = this.getDesignPrinciplesForIndustry(industry, designSpec, selectedConcept);
    
    return `Please generate a professional SVG logo based on the following design specifications and selected concept, applying advanced design principles:

BRAND DETAILS:
Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Target Audience: ${designSpec.target_audience}
Industry: ${industry}

SELECTED CONCEPT:
Name: ${selectedConcept.name}
Description: ${selectedConcept.description}
Style: ${selectedConcept.style}
Colors: ${selectedConcept.colors}
Imagery: ${selectedConcept.imagery}

ADVANCED DESIGN GUIDANCE:

COLOR THEORY:
${designPrinciples.colorTheory}

COMPOSITION:
${designPrinciples.composition}

VISUAL WEIGHT:
${designPrinciples.visualWeight}

TYPOGRAPHY:
${designPrinciples.typography}

NEGATIVE SPACE:
${designPrinciples.negativeSpace}

TECHNICAL REQUIREMENTS:
- Use the viewBox "0 0 300 300"
- Optimize the SVG code for file size and rendering performance
- Ensure the logo is accessible with appropriate contrast
- The SVG must be valid and work in all modern browsers
- Include title and desc elements for screen readers
- Limit file size to under 15KB

Please generate a complete, production-ready SVG logo applying these advanced design principles, along with a detailed design rationale explaining your decisions.`;
  }
  
  /**
   * @method processResponse
   * @description Process the response from Claude
   * @param {string} responseContent - Raw response from the AI
   * @param {AgentInput} originalInput - The original input to the agent
   * @returns {Promise<SVGGenerationAgentOutput>} Processed output
   * @protected
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
      
      // Extract design principles if available
      const designPrinciples = svgData.designPrinciples || {
        colorTheory: '',
        composition: '',
        visualWeight: '',
        typography: '',
        negativeSpace: ''
      };
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          svg: svgContent,
          designRationale: svgData.designRationale,
          designPrinciples
        }
      };
    } catch (error) {
      console.error('Failed to process Enhanced SVG generation agent response:', error);
      return {
        success: false,
        error: {
          message: 'Failed to parse SVG generation output',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * @method detectIndustry
   * @description Attempt to detect the industry from the brand description
   * @param {string} description - The brand description
   * @returns {string} The detected industry or "general"
   * @private
   */
  private detectIndustry(description: string): string {
    const lowerDescription = description.toLowerCase();
    
    // Simple keyword matching for industries
    const industryKeywords: Record<string, string[]> = {
      'technology': ['tech', 'software', 'app', 'digital', 'computer', 'ai', 'data', 'automation'],
      'finance': ['finance', 'bank', 'investment', 'insurance', 'wealth', 'capital', 'financial'],
      'healthcare': ['health', 'medical', 'doctor', 'hospital', 'wellness', 'pharmacy', 'clinic'],
      'food': ['food', 'restaurant', 'cafe', 'bakery', 'catering', 'cuisine', 'chef'],
      'retail': ['retail', 'shop', 'store', 'boutique', 'fashion', 'clothing', 'merchandise'],
      'education': ['education', 'school', 'university', 'academy', 'learning', 'teaching', 'tutoring'],
      'creative': ['creative', 'design', 'art', 'studio', 'agency', 'photography', 'film', 'media'],
      'hospitality': ['hotel', 'resort', 'travel', 'tourism', 'vacation', 'hospitality', 'lodging'],
      'manufacturing': ['manufacturing', 'industry', 'factory', 'production', 'industrial', 'machinery'],
      'energy': ['energy', 'power', 'utility', 'electricity', 'oil', 'gas', 'solar', 'renewable'],
      'real-estate': ['real estate', 'property', 'housing', 'construction', 'realty', 'building'],
      'legal': ['legal', 'law', 'attorney', 'advocate', 'justice', 'lawyer', 'firm'],
      'transportation': ['transport', 'logistics', 'shipping', 'delivery', 'freight', 'aviation']
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      for (const keyword of keywords) {
        if (lowerDescription.includes(keyword)) {
          return industry;
        }
      }
    }
    
    return 'general';
  }
  
  /**
   * @method getDesignPrinciplesForIndustry
   * @description Generate industry-specific design principles guidance
   * @param {string} industry - The detected industry
   * @param {any} designSpec - The design specifications
   * @param {any} selectedConcept - The selected concept
   * @returns {DesignPrinciple} Industry-appropriate design principles
   * @private
   */
  private getDesignPrinciplesForIndustry(
    industry: string, 
    designSpec: any, 
    selectedConcept: any
  ): DesignPrinciple {
    // Base principles that apply to all industries
    const basePrinciples: DesignPrinciple = {
      colorTheory: `
- Apply color harmony theory to create a cohesive palette
- Consider psychological impact of colors on viewers
- Ensure sufficient contrast for accessibility (4.5:1 minimum for text)
- Create clear color hierarchy with primary and secondary colors
- Use the selected concept's colors as a foundation, but refine as needed for harmony`,
      
      composition: `
- Apply the golden ratio (1:1.618) to key elements and overall composition
- Use the rule of thirds grid to place important elements at intersection points
- Create clear visual hierarchy with primary focus on the brand name or key symbol
- Ensure balanced composition through even distribution of visual weight
- Use negative space intentionally as an active design element`,
      
      visualWeight: `
- Balance visual elements across the composition, considering color, size, and detail
- Create appropriate emphasis on the most important brand elements
- Use size, color, and position to establish hierarchy
- Consider how the eye will flow through the design
- Ensure the logo maintains visual balance when scaled to different sizes`,
      
      typography: `
- Select typography that reinforces the brand personality
- Apply proper kerning and letter spacing for legibility
- Create harmony between typographic and graphic elements
- Ensure readability at various sizes
- Consider how typography contributes to the overall visual weight`,
      
      negativeSpace: `
- Use negative space intentionally to create clean, memorable forms
- Consider how negative space can create secondary meanings or imagery
- Ensure sufficient breathing room around key elements
- Balance positive and negative space for optimal figure-ground relationship
- Use negative space to enhance simplicity and recognizability`
    };
    
    // Industry-specific enhancements
    const industryEnhancements: Record<string, Partial<DesignPrinciple>> = {
      'technology': {
        colorTheory: `
- Consider using blues, purples, and teals that convey innovation and trust
- Explore gradients that suggest advancement and digital fluidity
- Use high contrast for a modern, digital feel
- Consider how colors will appear on digital screens primarily
- Aim for a forward-looking, clean color palette`,
        
        composition: `
- Create a sense of movement or forward momentum
- Consider geometric precision and mathematical relationships
- Use clean lines and shapes that suggest technological precision
- Apply asymmetrical balance for a more dynamic, innovative feel
- Consider modular design elements that suggest scalability and connectivity`,
        
        typography: `
- Select modern, clean sans-serif typography
- Consider custom letterforms with unique technological elements
- Explore geometric or modular type styles
- Maintain excellent legibility across digital environments
- Consider letter spacing that creates a sense of precision`
      },
      
      'finance': {
        colorTheory: `
- Use blues and greens to convey trust, stability, and growth
- Consider gold or silver accents to suggest value and premium quality
- Apply color consistently with restrained palette (2-3 colors maximum)
- Ensure high contrast for clarity and professionalism
- Use color to suggest stability and reliability`,
        
        composition: `
- Create balanced, stable compositions that suggest security
- Use symmetry or structured asymmetry to convey reliability
- Apply golden ratio for proportions that feel naturally balanced
- Consider upward movement to suggest growth and prosperity
- Use clean, precise geometric forms`,
        
        typography: `
- Select serif or high-quality sans-serif fonts that convey tradition and stability
- Apply consistent, moderate letter spacing
- Consider small caps or mixed case for sophistication
- Ensure excellent legibility and clarity
- Balance tradition with modernity depending on target audience`
      },
      
      'healthcare': {
        colorTheory: `
- Use blues and greens that convey calm, cleanliness, and care
- Consider pastel tones for gentleness and approachability
- Ensure colors meet accessibility standards (especially important in healthcare)
- Use color temperature to convey appropriate warmth or clinical precision
- Consider calming, trustworthy color harmonies`,
        
        composition: `
- Create balanced, stable compositions that suggest reliability
- Use rounded forms and organic shapes for a human-centered feel
- Apply symmetry for stability with subtle dynamic elements
- Consider flowing lines that suggest care and continuity
- Balance clinical precision with human warmth`,
        
        typography: `
- Select clean, highly legible typography
- Consider humanist sans-serif fonts that balance professionalism with approachability
- Apply generous letter spacing for clarity
- Ensure excellent legibility at all sizes
- Use type weight to create appropriate emphasis without appearing harsh`
      }
    };
    
    // Merge base principles with industry-specific enhancements
    const specificPrinciples = industryEnhancements[industry] || {};
    
    return {
      colorTheory: specificPrinciples.colorTheory || basePrinciples.colorTheory,
      composition: specificPrinciples.composition || basePrinciples.composition,
      visualWeight: specificPrinciples.visualWeight || basePrinciples.visualWeight,
      typography: specificPrinciples.typography || basePrinciples.typography,
      negativeSpace: specificPrinciples.negativeSpace || basePrinciples.negativeSpace
    };
  }
}