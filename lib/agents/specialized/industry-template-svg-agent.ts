/**
 * @file industry-template-svg-agent.ts
 * @module lib/agents/specialized/industry-template-svg-agent
 * @description SVG logo generation agent with industry-specific templates
 * 
 * This agent extends the enhanced SVG generation agent with industry-specific
 * design templates and styling guidance, applying best practices for each
 * industry category.
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
import { 
  detectIndustry, 
  getIndustryTemplate, 
  IndustryCategory,
  getDesignPrinciplesForIndustry
} from '../../industry-templates';

/**
 * @class IndustryTemplateSVGAgent
 * @description Creates production-ready SVG logos using industry-specific design templates
 * 
 * @extends BaseAgent
 */
export class IndustryTemplateSVGAgent extends BaseAgent {
  /**
   * @constructor
   * @param {Partial<AgentConfig>} [config] - Optional configuration overrides
   */
  constructor(config?: Partial<AgentConfig>) {
    super(
      'industry-template-svg', 
      ['svg-generation', 'design-theory', 'industry-templates'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use full model for detailed SVG generation
        temperature: 0.5, // Balanced temperature for creativity with consistency
        maxTokens: 4000, // Larger token limit for SVG generation
        ...config
      }
    );
    
    // Set the system prompt for this agent with industry templates focus
    this.systemPrompt = `You are an expert SVG logo generation agent with specialized knowledge of industry-specific design best practices.
    
Your task is to generate a professional, production-ready SVG logo based on the selected design concept and specifications, applying industry-appropriate design templates and principles to create truly exceptional results.

IMPORTANT TECHNICAL REQUIREMENTS:
1. Create ONLY valid, optimized SVG code that follows best practices
2. Use a viewBox of "0 0 300 300" for consistent scaling
3. Keep the SVG code under 15KB
4. Use ONLY the following SVG elements: svg, g, path, circle, rect, polygon, text, defs, linearGradient, radialGradient, stop
5. Do NOT use: script, image, foreignObject, use, or any event handlers
6. SVG must be valid, well-formed XML that works in all modern browsers

INDUSTRY-SPECIFIC DESIGN GUIDANCE:
1. Technology: Modern, clean designs with geometric precision, forward movement, and innovation cues
2. Finance: Stable, trustworthy designs with balanced proportions, upward trends, and security symbols
3. Healthcare: Approachable, caring designs with human elements, flowing lines, and cleanliness
4. Food: Appetizing, warm designs with organic elements, vibrancy, and cultural authenticity
5. Retail: Contemporary, stylish designs with brand positioning cues and consumer appeal
6. Education: Authoritative yet accessible designs with knowledge symbols and appropriate tradition
7. Creative: Expressive, distinctive designs with artistic flair and visual sophistication
8. Hospitality: Welcoming, service-oriented designs with comfort and experience cues
9. Manufacturing: Solid, reliable designs with precision, strength, and technical excellence
10. Energy: Dynamic, forward-looking designs with power symbols and appropriate sustainability cues
11. Real Estate: Stable, quality-focused designs with architectural elements and appropriate positioning
12. Legal: Authoritative, trustworthy designs with balance, tradition, and precision
13. Transportation: Dynamic, efficient designs with movement cues and appropriate service positioning

Apply the industry-specific template that best matches the brand's industry, using appropriate color schemes, composition techniques, typography, and symbolic elements.

You MUST return your response in the following JSON format:
{
  "svg": "<!-- full SVG code here -->",
  "designRationale": "explanation of your design decisions",
  "industryTemplate": "name of the industry template applied",
  "designPrinciples": {
    "colorTheory": "explanation of color choices and harmony",
    "composition": "explanation of layout and golden ratio application",
    "visualWeight": "explanation of balance and emphasis",
    "typography": "explanation of type choices and treatment",
    "negativeSpace": "explanation of figure-ground relationship",
    "industrySpecific": "explanation of industry-specific elements applied"
  }
}

The SVG code should be a complete, valid SVG with proper syntax and optimization.
It must work when pasted directly into an HTML file or opened in a browser.
Do NOT include any text before or after the JSON object.`;
  }
  
  /**
   * @method generatePrompt
   * @description Generate the prompt for industry-specific SVG generation
   * @param {SVGGenerationAgentInput} input - Input containing design specs and selected concept
   * @returns {Promise<string>} The generated prompt
   * @protected
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;
    
    // Detect industry if not already specified
    let industry = designSpec.industry || '';
    let industryConfidence = designSpec.industry_confidence || 0;
    
    if (!industry) {
      const detectionResult = detectIndustry(designSpec.brand_description);
      industry = detectionResult.primaryIndustry;
      industryConfidence = detectionResult.confidenceScore;
    }
    
    // Get industry template
    const industryTemplate = getIndustryTemplate(industry);
    
    // Get design principles for the industry
    const designPrinciples = getDesignPrinciplesForIndustry(industry);
    
    // Build industry-specific recommendations
    const colorRecommendations = industryTemplate.commonColors.length > 0 
      ? `Common colors for ${industryTemplate.name} include: ${industryTemplate.commonColors.join(', ')}`
      : '';
    
    const styleRecommendations = industryTemplate.commonStyles.length > 0
      ? `Common styles for ${industryTemplate.name} include: ${industryTemplate.commonStyles.join(', ')}`
      : '';
    
    return `Please generate a professional SVG logo based on the following design specifications and selected concept, applying industry-specific design templates:

BRAND DETAILS:
Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Target Audience: ${designSpec.target_audience}
Industry: ${industryTemplate.name} (${industryConfidence.toFixed(2)} confidence)
Industry Description: ${industryTemplate.description}

SELECTED CONCEPT:
Name: ${selectedConcept.name}
Description: ${selectedConcept.description}
Style: ${selectedConcept.style}
Colors: ${selectedConcept.colors}
Imagery: ${selectedConcept.imagery}

INDUSTRY-SPECIFIC DESIGN TEMPLATE:
Industry: ${industryTemplate.name}
${colorRecommendations}
${styleRecommendations}

DESIGN PRINCIPLES FOR ${industryTemplate.name.toUpperCase()}:

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

Please generate a complete, production-ready SVG logo applying these industry-specific design principles, along with a detailed design rationale explaining your decisions. Be sure to incorporate appropriate industry-specific design elements and best practices for ${industryTemplate.name}.`;
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
        negativeSpace: '',
        industrySpecific: ''
      };
      
      // If everything is valid, return the processed result
      return {
        success: true,
        result: {
          svg: svgContent,
          designRationale: svgData.designRationale,
          designPrinciples,
          industryTemplate: svgData.industryTemplate || 'general'
        }
      };
    } catch (error) {
      console.error('Failed to process Industry Template SVG agent response:', error);
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