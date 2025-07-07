import { StageDInput, StageDOutput } from '../../ai-pipeline/stages/stage-d-generation';
import { claudeClient } from '../../services/claude-service';

/**
 * Enhanced SVG generation approach that uses a different prompt strategy
 * This is an example of a variant implementation for A/B testing
 */
export async function enhancedSvgGeneration(input: StageDInput): Promise<StageDOutput> {
  const startTime = Date.now();

  try {
    // Enhanced prompt approach focusing on design principles and execution quality
    const systemPrompt = `You are a professional logo designer specializing in creating SVG vector graphics. 
You will create a high-quality, professional SVG logo based on the provided design concept and specifications.

GUIDELINES FOR EXCEPTIONAL SVG LOGO CREATION:
1. Create valid, optimized SVG code that follows best practices
2. Focus on simplicity, memorability, and scalability
3. Ensure the design communicates the brand's values
4. Use appropriate color psychology for the industry
5. Follow accessibility guidelines for good contrast
6. Balance whitespace and positive/negative space
7. Create proper visual hierarchy
8. Ensure the logo works in both color and monochrome
9. Optimize paths and shapes for clean rendering

TECHNICAL REQUIREMENTS:
- Use a viewBox of "0 0 300 300" for consistent scaling
- Keep file size under 15KB
- Use only the following elements: svg, g, path, circle, rect, polygon, text, defs, linearGradient
- No scripts, external references, or embedded images
- All text must be converted to paths
- Use relative coordinates where possible
- Include appropriate metadata

OUTPUT FORMAT:
Provide ONLY the complete SVG code, starting with <?xml version="1.0" encoding="UTF-8"?> and ending with </svg>.
Do not include any explanation, commentary, or markdown formatting.`;

    const userPrompt = `Design a professional logo for ${input.designSpec.brand_name} based on this concept:

${input.selectedConcept.description}

Brand Description: ${input.designSpec.brand_description}
Industry: ${input.designSpec.industry || 'Not specified'}
Style Preferences: ${input.designSpec.style_preferences}
Color Palette: ${input.designSpec.color_palette}
Imagery Elements: ${input.designSpec.imagery}
Target Audience: ${input.designSpec.target_audience}
Additional Requirements: ${input.designSpec.additional_requests}`;

    // Request SVG generation with enhanced prompting
    const response = await claudeClient.sendMessage({
      model: 'claude-3-5-sonnet-20240620',
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Process response
    const svgCode = response.content[0].text;
    const tokenUsage = {
      input: response.usage?.input_tokens || 0,
      output: response.usage?.output_tokens || 0,
      total: response.usage?.input_tokens + response.usage?.output_tokens || 0,
    };

    // Clean and validate SVG
    const cleanedSvg = cleanSvgCode(svgCode);

    return {
      success: true,
      result: {
        svg: cleanedSvg,
        width: 300,
        height: 300,
      },
      tokensUsed: tokenUsage.total,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Enhanced SVG Generation failed:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error in SVG generation',
        details: error,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Clean SVG code to ensure it meets requirements
 */
function cleanSvgCode(svgCode: string): string {
  // Extract SVG content if wrapped in code blocks or other text
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/i;
  const match = svgCode.match(svgRegex);

  if (match) {
    svgCode = match[0];
  }

  // Ensure proper XML declaration
  if (!svgCode.includes('<?xml version="1.0"')) {
    svgCode = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgCode;
  }

  // Ensure viewBox is set correctly
  if (!svgCode.includes('viewBox="0 0 300 300"')) {
    svgCode = svgCode.replace(/<svg[^>]*>/i, match => {
      if (match.includes('viewBox')) {
        return match.replace(/viewBox="[^"]*"/i, 'viewBox="0 0 300 300"');
      } else {
        return match.replace(/<svg/i, '<svg viewBox="0 0 300 300"');
      }
    });
  }

  return svgCode;
}
