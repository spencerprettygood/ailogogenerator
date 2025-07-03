import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  GuidelineAgentInput,
  GuidelineAgentOutput
} from '../../types-agents';
import { handleError, ErrorCategory } from '../../utils/error-handler';

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

    const prompt = `
# Brand Guidelines Generation Task

## Design & Brand Context
Here is the core information for the brand:
\`\`\`json
${JSON.stringify(designSpec, null, 2)}
\`\`\`

## Logo Assets
Here are the final SVG assets. Embed these directly into the HTML document you create.

### Main Logo (for general use)
\`\`\`xml
${variants.monochrome.black}
\`\`\`

### White Variant (for dark backgrounds)
\`\`\`xml
${variants.monochrome.white}
\`\`\`

### Favicon
\`\`\`xml
${variants.favicon.svg}
\`\`\`

## Your Task
Based on all the provided information, generate a complete, professional, and self-contained HTML document for the brand guidelines. Follow all instructions from the system prompt precisely.
`;
    return prompt;
  }

  /**
   * Process the response from the AI model to extract the brand guidelines HTML
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput,
  ): Promise<GuidelineAgentOutput> {
    const htmlContent = this.extractHtml(responseContent);

    if (!htmlContent) {
      return {
        success: false,
        error: handleError({
          error: 'No valid HTML content found in the response. The model did not return a well-formed HTML document.',
          category: ErrorCategory.API,
          details: { responseSnippet: responseContent.substring(0, 200) },
          retryable: true,
        }),
      };
    }

    // Validate HTML structure
    if (!htmlContent.includes('</body') || !htmlContent.includes('</head')) {
      return {
        success: false,
        error: handleError({
          error: 'Extracted HTML appears to be incomplete. Missing required HTML structure tags.',
          category: ErrorCategory.API,
          details: { htmlSnippet: htmlContent.substring(0, 200) },
          retryable: true,
        }),
      };
    }

    this.log('Successfully extracted and validated brand guidelines HTML.');
    return {
      success: true,
      result: {
        html: htmlContent,
      },
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }

  /**
   * Extracts HTML content from a string, handling potential markdown code blocks.
   * @param content The raw string content from the model.
   * @returns The extracted HTML string, or null if not found.
   */
  private extractHtml(content: string): string | null {
    content = content.trim();

    // Case 1: Content is wrapped in markdown code block (e.g., ```html ... ```)
    const markdownMatch = content.match(/^`{3}(?:html)?\n([\s\S]*?)\n`{3}$/i);
    if (markdownMatch && markdownMatch[1]) {
      this.log('Extracted HTML from markdown code block.');
      return markdownMatch[1].trim();
    }

    // Case 2: Content starts directly with <!DOCTYPE html>
    if (content.toLowerCase().startsWith('<!doctype html>')) {
      this.log('Found direct HTML content.');
      return content;
    }

    // Case 3: Find the first occurrence of <!DOCTYPE html> anywhere in the string
    const doctypeIndex = content.toLowerCase().indexOf('<!doctype html>');
    if (doctypeIndex !== -1) {
        this.log('Found HTML content with leading text, extracting from <!DOCTYPE>.');
        return content.substring(doctypeIndex);
    }

    this.log('Could not find valid HTML structure in the response.', 'warn');
    return null;
  }
}