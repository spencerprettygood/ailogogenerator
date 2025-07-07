/**
 * @file industry-template-svg-agent.ts
 * @module lib/agents/specialized/industry-template-svg-agent
 * @description SVG logo generation agent with industry-specific templates
 *
 * This agent extends the enhanced SVG generation agent with industry-specific
 * design templates and styling guidance, applying best practices for each
 * industry category.
 */

import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  SVGGenerationAgentInput,
  IndustryTemplateSVGAgentOutput,
} from '../../types-agents';
import {
  detectIndustry,
  getIndustryTemplate,
  getDesignPrinciplesForIndustry,
} from '../../industry-templates';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { safeJsonParse } from '../../utils/json-utils';
import { SVGValidator } from '../../utils/svg-validator';

/**
 * IndustryTemplateSVGAgent - Creates production-ready SVG logos using industry-specific design templates
 */
export class IndustryTemplateSVGAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('industry-template-svg', ['svg-generation'], {
      model: 'claude-3-5-sonnet-20240620', // Use full model for detailed SVG generation
      temperature: 0.5, // Balanced temperature for creativity with consistency
      maxTokens: 4096, // Increased token limit for industry-specific generation
      ...config,
    });

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

You MUST return your response as a single, valid JSON object enclosed in \`\`\`json tags:
\`\`\`json
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
\`\`\`

The SVG code should be a complete, valid SVG with proper syntax and optimization.
It must work when pasted directly into an HTML file or opened in a browser.`;
  }

  /**
   * Generate the prompt for industry-specific SVG generation
   */
  protected async generatePrompt(input: SVGGenerationAgentInput): Promise<string> {
    const { designSpec, selectedConcept } = input;

    // Detect industry if not already specified
    let industry = designSpec.industry || '';
    let industryConfidence = (designSpec as any).industry_confidence || 0;

    if (!industry) {
      const detectionResult = detectIndustry(designSpec.brand_description);
      industry = detectionResult.primaryIndustry;
      industryConfidence = detectionResult.confidenceScore;
    }

    // Get industry template and design principles
    const industryTemplate = getIndustryTemplate(industry) || {
      name: 'General',
      description: 'General business industry',
      commonColors: [],
      commonStyles: [],
    };
    const designPrinciples = getDesignPrinciplesForIndustry(industry) || {
      colorTheory: 'Use harmonious color combinations appropriate for the brand',
      composition: 'Apply balanced layout principles',
      visualWeight: 'Balance elements for visual stability',
      typography: 'Use appropriate typography for the brand',
      negativeSpace: 'Use negative space effectively',
    };

    // Build industry-specific recommendations
    const colorRecommendations =
      industryTemplate.commonColors.length > 0
        ? `Common colors for ${industryTemplate.name} include: ${industryTemplate.commonColors.join(', ')}`
        : '';

    const styleRecommendations =
      industryTemplate.commonStyles.length > 0
        ? `Common styles for ${industryTemplate.name} include: ${industryTemplate.commonStyles.join(', ')}`
        : '';

    return `Please generate a professional SVG logo based on the following design specifications and selected concept, applying industry-specific design templates:

# Brand Details
- **Brand Name:** ${designSpec.brand_name}
- **Brand Description:** ${designSpec.brand_description}
- **Target Audience:** ${designSpec.target_audience}
- **Industry:** ${industryTemplate.name} (${industryConfidence.toFixed(2)} confidence)
- **Industry Description:** ${industryTemplate.description}

# Selected Concept
- **Name:** ${selectedConcept.name}
- **Description:** ${selectedConcept.description}
- **Style:** ${selectedConcept.style}
- **Colors:** ${selectedConcept.colors}
- **Imagery:** ${selectedConcept.imagery}

# Industry-Specific Design Template
- **Industry:** ${industryTemplate.name}
- **Color Recommendations:** ${colorRecommendations}
- **Style Recommendations:** ${styleRecommendations}

# Design Principles for ${industryTemplate.name.toUpperCase()}
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

Please generate a complete, production-ready SVG logo applying these industry-specific design principles, along with a detailed design rationale explaining your decisions. Be sure to incorporate appropriate industry-specific design elements and best practices for ${industryTemplate.name}. Respond with your JSON object inside \`\`\`json tags.`;
  }

  /**
   * Process the response from the AI
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput
  ): Promise<IndustryTemplateSVGAgentOutput> {
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
    const requiredFields = ['svg', 'designRationale', 'industryTemplate', 'designPrinciples'];
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
    if (!svgContent || typeof svgContent !== 'string') {
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
            svgContent: svgContent.substring(0, 200) + '...',
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

    this.log('Successfully generated and validated industry-specific SVG logo.');
    return {
      success: true,
      result: {
        svg: svgContent,
        designRationale: parsed.designRationale,
        designPrinciples: designPrinciples,
        industryTemplate: parsed.industryTemplate || 'general',
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}
