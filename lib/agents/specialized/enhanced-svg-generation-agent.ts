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
 */

import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  SVGGenerationAgentInput, 
  SVGGenerationAgentOutput
} from '../../types-agents';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { safeJsonParse } from '../../utils/json-utils';
import { SVGValidator } from '../../utils/svg-validator';

/**
 * EnhancedSVGGenerationAgent - Creates production-ready SVG logos using advanced design principles
 */
export class EnhancedSVGGenerationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'enhanced-svg-generation', 
      ['svg-generation'],
      {
        model: 'claude-3-5-sonnet-20240620', // Use full model for detailed SVG generation
        temperature: 0.5, // Balanced temperature for creativity with consistency
        maxTokens: 4096, // Increased token limit for complex SVG generation
        ...config
      }
    );
    
    this.systemPrompt = `You are an expert SVG logo generation agent with advanced training in design theory.
    
Your task is to generate a professional, production-ready SVG logo based on the selected design concept and specifications, applying sophisticated design principles to create truly exceptional results.

IMPORTANT TECHNICAL REQUIREMENTS:
1. Create ONLY valid, optimized SVG code that follows best practices
2. Use a viewBox="0 0 300 300" for consistent scaling
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

COMPOSITION:
- Apply the golden ratio (1:1.618) to create naturally pleasing proportions
- Utilize rule of thirds for balanced element placement
- Create clear visual hierarchy with primary, secondary, and tertiary elements
- Use deliberate negative space as an active design element
- Ensure optimal figure-ground relationship

VISUAL WEIGHT:
- Balance dark/light elements across the composition
- Consider size, color, and complexity when distributing elements
- Create appropriate emphasis on the most important brand elements
- Use selective detail to direct attention

TYPOGRAPHY (WHEN APPLICABLE):
- Select or create typography that reinforces brand personality
- Apply proper kerning, tracking, and letter spacing
- Maintain appropriate contrast between font weight and surrounding elements
- Ensure letterforms work harmoniously with graphic elements

LOGO VERSATILITY:
- Design for scalability from favicon to billboard size
- Ensure the logo works effectively in monochrome
- Consider how design elements will translate across media

You MUST return your response as a single, valid JSON object enclosed in \`\`\`json tags:
\`\`\`json
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
\`\`\`

The SVG code should be a complete, valid SVG with proper syntax and optimization.
It must work when pasted directly into an HTML file or opened in a browser.`;
  }
  
  /**
   * Generate the prompt for enhanced SVG generation with advanced design principles
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;
    
    const industry = designSpec.industry || this.detectIndustry(designSpec.brand_description);
    const designPrinciples = this.getDesignPrinciplesForIndustry(industry, designSpec, selectedConcept);
    
    return `Please generate a professional SVG logo based on the following design specifications and selected concept, applying advanced design principles:

# Brand Details
- **Brand Name:** ${designSpec.brand_name}
- **Brand Description:** ${designSpec.brand_description}
- **Target Audience:** ${designSpec.target_audience}
- **Industry:** ${industry}

# Selected Concept
- **Name:** ${selectedConcept.name}
- **Description:** ${selectedConcept.description}
- **Style:** ${selectedConcept.style}
- **Colors:** ${selectedConcept.colors}
- **Imagery:** ${selectedConcept.imagery}

# Advanced Design Guidance
- **Color Theory:** ${designPrinciples.colorTheory}
- **Composition:** ${designPrinciples.composition}
- **Visual Weight:** ${designPrinciples.visualWeight}
- **Typography:** ${designPrinciples.typography}
- **Negative Space:** ${designPrinciples.negativeSpace}

# Technical Requirements
- Use the viewBox "0 0 300 300"
- Optimize the SVG code for file size and rendering performance
- Ensure the logo is accessible with appropriate contrast
- The SVG must be valid and work in all modern browsers
- Include title and desc elements for screen readers
- Limit file size to under 15KB

Please generate a complete, production-ready SVG logo applying these advanced design principles, along with a detailed design rationale explaining your decisions. Respond with your JSON object inside \`\`\`json tags.`;
  }
  
  /**
   * Process the response from the AI
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SVGGenerationAgentOutput> {
    const parsed = safeJsonParse(responseContent);

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid JSON response from AI. The response was not a valid object.',
          category: ErrorCategory.API,
          details: { responseContent },
          retryable: true,
        }),
      };
    }

    // Validate required fields
    const requiredFields = ['svg', 'designRationale', 'designPrinciples'];
    const missingFields = requiredFields.filter(field => !(field in parsed) || !parsed[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: handleError({
          error: `AI response is missing required fields: ${missingFields.join(', ')}`,
          category: ErrorCategory.API,
          details: { parsedResponse: parsed, missingFields },
          retryable: true,
        }),
      };
    }

    // Validate SVG content
    const svgContent = parsed.svg;
    if (!svgContent || typeof svgContent !== 'string' || !svgContent.includes('<svg')) {
      return {
        success: false,
        error: handleError({
          error: 'Invalid SVG content in AI response',
          category: ErrorCategory.SVG,
          details: { svgContent },
          retryable: true,
        }),
      };
    }

    // Validate SVG structure and security
    const svgValidation = SVGValidator.validate(svgContent);
    if (!svgValidation.isValid) {
      return {
        success: false,
        error: handleError({
          error: 'Generated SVG failed validation',
          category: ErrorCategory.SVG,
          details: { 
            validationErrors: svgValidation.errors,
            svgContent 
          },
          retryable: true,
        }),
      };
    }

    // Validate design principles structure
    const designPrinciples = parsed.designPrinciples;
    if (!designPrinciples || typeof designPrinciples !== 'object') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid design principles structure in AI response',
          category: ErrorCategory.API,
          details: { designPrinciples },
          retryable: true,
        }),
      };
    }

    this.log('Successfully generated and validated enhanced SVG logo.');
    return {
      success: true,
      result: {
        svg: svgContent,
        designRationale: parsed.designRationale,
        designPrinciples: designPrinciples,
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }

  /**
   * Simple keyword-based industry detection from brand description
   */
  private detectIndustry(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('tech') || lowerDesc.includes('software')) return 'Technology';
    if (lowerDesc.includes('health') || lowerDesc.includes('wellness')) return 'Healthcare';
    if (lowerDesc.includes('food') || lowerDesc.includes('restaurant')) return 'Food & Beverage';
    if (lowerDesc.includes('fashion') || lowerDesc.includes('apparel')) return 'Fashion';
    if (lowerDesc.includes('real estate')) return 'Real Estate';
    return 'General';
  }

  /**
   * Provides tailored design principle guidance based on industry
   */
  private getDesignPrinciplesForIndustry(
    industry: string,
    designSpec: SVGGenerationAgentInput['designSpec'],
    selectedConcept: SVGGenerationAgentInput['selectedConcept']
  ): Record<string, string> {
    const basePrinciples = {
      colorTheory: `Use the palette (${selectedConcept.colors}) to create a harmonious and accessible design. Focus on a professional and trustworthy feel. `,
      composition: `Apply the rule of thirds and golden ratio for a balanced, visually pleasing layout. Ensure the composition is strong and scalable. `,
      visualWeight: `Balance elements to create a clear focal point. The visual weight should feel stable and intentional. `,
      typography: `If text is part of the logo, ensure it is legible, well-kerned, and integrated with the graphical elements. `,
      negativeSpace: `Use negative space intentionally to enhance the design and improve clarity. `,
    };

    switch (industry) {
      case 'Technology':
        basePrinciples.composition += 'Aim for a modern, clean, and innovative feel. Geometric shapes and symmetry often work well.';
        basePrinciples.colorTheory += 'Blues, grays, and greens are common, but a unique accent color can stand out.';
        break;
      case 'Healthcare':
        basePrinciples.composition += 'The design should evoke trust, care, and professionalism. Avoid overly complex or aggressive shapes.';
        basePrinciples.colorTheory += 'Greens and blues are typical. The palette should feel calming and reassuring.';
        break;
      case 'Food & Beverage':
        basePrinciples.composition += 'The design can be more playful and organic. It should look appetizing and inviting.';
        basePrinciples.colorTheory += 'Warm colors like reds, oranges, and yellows can stimulate appetite.';
        break;
      case 'Fashion':
        basePrinciples.composition += 'Elegance, minimalism, and sophistication are key. The logo should be chic and timeless.';
        basePrinciples.typography += 'Serif or clean sans-serif fonts are common. Typography is often the primary element.';
        break;
      default:
        basePrinciples.composition += `Tailor the composition to the brand's specific personality: ${designSpec.style_preferences}.`;
        break;
    }
    return basePrinciples;
  }
}