import Anthropic from '@anthropic-ai/sdk';
import { DesignSpec } from './stage-a-distillation';
import { MoodboardConcept } from './stage-b-moodboard';

// Types for Stage D
export interface SvgGenerationResult {
  svg: string;
  width: number;
  height: number;
  elementCount: number;
  hasGradients: boolean;
  designNotes: string;
}

export interface StageDInput {
  designSpec: DesignSpec;
  selectedConcept: MoodboardConcept;
}

export interface StageDOutput {
  success: boolean;
  result?: SvgGenerationResult;
  error?: {
    type: 'validation_error' | 'ai_error' | 'system_error' | 'svg_error';
    message: string;
    details?: unknown;
  };
  tokensUsed?: number;
  processingTime?: number;
}

// Configuration
const STAGE_D_CONFIG = {
  model: 'claude-3-5-sonnet-20240620' as const, // Sonnet for complex generation
  temperature: 0.4, // Balance of creativity and consistency
  max_tokens: 2000, // Allow for complex SVG generation
  timeout: 60_000, // 60 seconds
  max_retries: 3,
  retry_delay: 3000, // 3 seconds
  max_svg_size: 15 * 1024, // 15KB maximum size
  viewBox: '0 0 300 300',
  allowed_elements: [
    'svg', 'g', 'path', 'circle', 'rect', 'polygon', 'polyline',
    'line', 'text', 'tspan', 'defs', 'linearGradient', 'radialGradient',
    'stop', 'ellipse', 'mask', 'clipPath', 'use', 'title', 'desc'
  ],
  forbidden_elements: [
    'script', 'foreignObject', 'iframe', 'image', 'embed', 'video',
    'audio', 'canvas', 'object', 'animate', 'set', 'animateMotion',
    'animateTransform', 'animateColor', 'a'
  ],
  max_colors: 5
};

// System prompt for SVG logo generation
const STAGE_D_SYSTEM_PROMPT = `
You are a professional logo designer with expertise in creating SVG logos. Generate a high-quality, production-ready SVG logo based on the provided design concept.

OUTPUT FORMAT:
1. First, output ONLY the complete SVG code enclosed in \`\`\`svg and \`\`\` tags.
2. After the SVG code, output a JSON object with design notes in \`\`\`json and \`\`\` tags.

SVG TECHNICAL REQUIREMENTS:
- Use viewBox="${STAGE_D_CONFIG.viewBox}"
- Keep file size under ${STAGE_D_CONFIG.max_svg_size / 1024}KB
- Use only the following elements: ${STAGE_D_CONFIG.allowed_elements.join(', ')}
- NEVER use these elements: ${STAGE_D_CONFIG.forbidden_elements.join(', ')}
- Avoid complex filters and effects
- Ensure all paths are properly closed
- Use appropriate grouping with <g> elements
- Include essential attributes only
- Add title and desc elements for accessibility
- Use consistent spacing and organization

DESIGN PRINCIPLES:
- Focus on simplicity and memorability
- Ensure the logo works at small sizes
- Limit colors to ${STAGE_D_CONFIG.max_colors} or fewer
- Create clean, scalable vector paths
- Match the concept's style and color palette
- Make text legible and properly spaced
- Balance all elements in the composition
- Maintain white space appropriately

SVG OPTIMIZATIONS:
- Round path coordinates to 1 decimal place
- Minimize path commands and points
- Use compact but readable attribute values
- Remove unnecessary whitespace
- Combine paths when possible for efficiency
- Use descriptive ids for important elements
- Ensure the SVG is valid XML

SECURITY CONSTRAINTS:
- Do not include any scripts or executable code
- Avoid external references and links
- Use only inline styles, no external CSS
- No event handlers of any kind

The JSON design notes should include:
- Key design decisions made
- Color codes used
- Typography notes
- Potential applications
- Technical considerations

EXTREMELY IMPORTANT: Return ONLY the SVG code in \`\`\`svg \`\`\` tags followed by the JSON notes in \`\`\`json \`\`\` tags. No other text or explanations.
`;

// Input validation class
class StageDValidator {
  static validateInput(input: StageDInput): void {
    if (!input.designSpec) {
      throw new Error('Design specification is required');
    }

    if (!input.selectedConcept) {
      throw new Error('Selected concept is required');
    }

    // Verify designSpec has required fields
    const requiredDesignFields: Array<keyof DesignSpec> = [
      'brand_name',
      'brand_description'
    ];

    for (const field of requiredDesignFields) {
      if (!input.designSpec[field] || typeof input.designSpec[field] !== 'string') {
        throw new Error(`Invalid design spec: ${field} is missing or invalid`);
      }
    }

    // Verify concept has required fields
    const requiredConceptFields: Array<keyof MoodboardConcept> = [
      'name',
      'description',
      'primary_colors'
    ];

    for (const field of requiredConceptFields) {
      if (!(field in input.selectedConcept)) {
        throw new Error(`Selected concept missing required field: ${field}`);
      }
    }

    if (!Array.isArray(input.selectedConcept.primary_colors) || input.selectedConcept.primary_colors.length === 0) {
      throw new Error('Selected concept must have at least one primary color');
    }
  }

  static validateSvg(svgString: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if it's empty
    if (!svgString || typeof svgString !== 'string' || svgString.trim().length === 0) {
      return { isValid: false, issues: ['SVG is empty or not a string'] };
    }

    // Check size
    if (svgString.length > STAGE_D_CONFIG.max_svg_size) {
      issues.push(`SVG exceeds maximum size of ${STAGE_D_CONFIG.max_svg_size / 1024}KB`);
    }

    // Basic structure checks
    if (!svgString.includes('<svg')) {
      issues.push('Missing <svg> element');
    }

    if (!svgString.includes('viewBox')) {
      issues.push('Missing viewBox attribute');
    }

    // Check for forbidden elements
    for (const element of STAGE_D_CONFIG.forbidden_elements) {
      if (svgString.includes(`<${element}`)) {
        issues.push(`Contains forbidden element: ${element}`);
      }
    }

    // Check for potential security issues
    const securityPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /on\w+=/i, // Event handlers like onclick, onload, etc.
      /href\s*=\s*['"]?https?:/i, // External links
      /<\s*iframe/i,
      /<\s*embed/i,
      /<\s*object/i
    ];

    for (const pattern of securityPatterns) {
      if (pattern.test(svgString)) {
        issues.push('Contains potential security vulnerability');
        break;
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  static extractSvgAndNotes(content: string): { svg: string | null; notes: string | null; } {
    // Extract SVG code
    const svgMatch = content.match(/```svg\s*([\s\S]*?)\s*```/);
    const svg = svgMatch ? svgMatch[1].trim() : null;
    
    // Extract JSON notes
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const notes = jsonMatch ? jsonMatch[1].trim() : null;
    
    return { svg, notes };
  }

  static parseSvgMetadata(svg: string): { width: number; height: number; elementCount: number; hasGradients: boolean } {
    // Default values
    let width = 300;
    let height = 300;
    let elementCount = 0;
    let hasGradients = false;
    
    try {
      // Count elements (approximate method without DOM parsing)
      const elementTypes = ['path', 'circle', 'rect', 'polygon', 'text', 'g', 'line', 'ellipse'];
      elementCount = elementTypes.reduce((count, type) => {
        const matches = svg.match(new RegExp(`<${type}[\\s>]`, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
      
      // Check for gradients
      hasGradients = svg.includes('linearGradient') || svg.includes('radialGradient');
      
      // Try to extract width and height
      const viewBoxMatch = svg.match(/viewBox=["']([^"']*)["']/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        const parts = viewBoxMatch[1].split(/\s+/).map(Number);
        if (parts.length === 4) {
          width = parts[2];
          height = parts[3];
        }
      }
      
      // Fallback to width and height attributes if viewBox not found
      if (!viewBoxMatch) {
        const widthMatch = svg.match(/width=["']([^"']*)["']/);
        const heightMatch = svg.match(/height=["']([^"']*)["']/);
        
        if (widthMatch && widthMatch[1]) {
          const w = widthMatch[1];
          width = parseInt(w);
        }
        
        if (heightMatch && heightMatch[1]) {
          const h = heightMatch[1];
          height = parseInt(h);
        }
      }
    } catch (error) {
      console.error('Error parsing SVG metadata:', error);
    }
    
    return { width, height, elementCount, hasGradients };
  }
}

// Retry utility
class StageDRetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = STAGE_D_CONFIG.max_retries,
    baseDelay: number = STAGE_D_CONFIG.retry_delay
  ): Promise<T> {
    let lastError: Error = new Error('Retry operation failed.');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors
        if (error instanceof Error && (
          error.message.includes('Design specification') || 
          error.message.includes('Selected concept')
        )) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
        }
      }
    }

    throw new Error(`Stage D: All attempts failed. Last error: ${lastError.message}`);
  }
}

// Main SVG generation function
export async function generateSvgLogo(
  input: StageDInput
): Promise<StageDOutput> {
  const startTime = Date.now();
  
  try {
    // Validate input
    StageDValidator.validateInput(input);

    // Initialize Anthropic client
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Construct user message with design requirements and selected concept
    const userMessage = `
LOGO DESIGN TASK:

Create a production-ready SVG logo for:

Brand Name: ${input.designSpec.brand_name}
Brand Description: ${input.designSpec.brand_description}

SELECTED CONCEPT:
Name: ${input.selectedConcept.name}
Description: ${input.selectedConcept.description}
Style Approach: ${input.selectedConcept.style_approach}
Primary Colors: ${input.selectedConcept.primary_colors.join(', ')}
Typography Style: ${input.selectedConcept.typography_style}
Imagery Elements: ${input.selectedConcept.imagery_elements}

Additional Requirements:
- Create a clean, professional SVG logo that follows the selected concept
- Ensure the design is simple enough to be recognizable at small sizes
- Use the specified color palette
- Follow the style approach described
- Incorporate the key imagery elements in a balanced composition
- Create a logo that will work well in both digital and print applications
- Focus on creating a visually appealing, modern, and professional logo

Please generate the complete SVG code for this logo followed by design notes in JSON format.
`;

    // Call Claude API with retry logic
    const completion = await StageDRetryHandler.withRetry(async () => {
      const response = await anthropic.messages.create({
        model: STAGE_D_CONFIG.model,
        max_tokens: STAGE_D_CONFIG.max_tokens,
        temperature: STAGE_D_CONFIG.temperature,
        system: STAGE_D_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });

      if (!response.content || response.content.length === 0) {
        throw new Error('Empty response from AI model');
      }

      const textContent = response.content.find(
        (contentBlock): contentBlock is Anthropic.TextBlock => contentBlock.type === 'text'
      );

      if (!textContent || !textContent.text.trim()) {
        throw new Error('No text content in AI response');
      }

      return {
        content: textContent.text,
        usage: response.usage,
      };
    });

    // Extract SVG and notes from the response
    const { svg, notes } = StageDValidator.extractSvgAndNotes(completion.content);
    
    if (!svg) {
      throw new Error('No SVG code found in AI response');
    }

    // Validate the SVG
    const validation = StageDValidator.validateSvg(svg);
    if (!validation.isValid) {
      throw new Error(`Invalid SVG generated: ${validation.issues.join(', ')}`);
    }

    // Parse SVG metadata
    const metadata = StageDValidator.parseSvgMetadata(svg);
    
    // Parse design notes if available
    let designNotes = "No design notes provided.";
    if (notes) {
      try {
        const parsedNotes = JSON.parse(notes);
        if (typeof parsedNotes === 'object' && parsedNotes !== null) {
          // Convert notes object to string if it's an object
          designNotes = typeof parsedNotes === 'string' 
            ? parsedNotes 
            : JSON.stringify(parsedNotes, null, 2);
        }
      } catch (error) {
        console.warn('Could not parse design notes JSON:', error);
        designNotes = notes; // Use raw notes if parsing fails
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      result: {
        svg,
        width: metadata.width,
        height: metadata.height,
        elementCount: metadata.elementCount,
        hasGradients: metadata.hasGradients,
        designNotes
      },
      tokensUsed: (completion.usage.input_tokens || 0) + (completion.usage.output_tokens || 0),
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    let errorType: 'validation_error' | 'ai_error' | 'system_error' | 'svg_error' = 'system_error';
    let errorMessage = 'Unknown error occurred during SVG generation';
    let errorDetails: unknown = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (process.env.NODE_ENV === 'development') {
        errorDetails = error.stack;
      }

      if (error.message.includes('Design specification') || 
          error.message.includes('Selected concept')) {
        errorType = 'validation_error';
      } else if (error.message.includes('AI model') || 
                 error.message.includes('AI response')) {
        errorType = 'ai_error';
      } else if (error.message.includes('SVG') || 
                 error.message.includes('Invalid SVG')) {
        errorType = 'svg_error';
      } else if (error.message.includes('ANTHROPIC_API_KEY')) {
        errorType = 'system_error';
      }
    }

    return {
      success: false,
      error: { type: errorType, message: errorMessage, details: errorDetails },
      processingTime,
    };
  }
}

// Utility function for validation
export function validateStageDOutput(output: StageDOutput): string {
  if (!output) return "Output is undefined or null";
  
  if (output.success) {
    if (!output.result) return "Successful output missing result";
    if (!output.result.svg) return "Result missing SVG content";
    if (output.result.svg.length === 0) return "SVG content is empty";
    if (!output.result.svg.includes('<svg')) return "Invalid SVG: missing <svg> element";
    
    if (!output.tokensUsed || output.tokensUsed <= 0) return "Missing or invalid tokensUsed";
    if (!output.processingTime || output.processingTime < 0) return "Missing or invalid processingTime";
    
    return "valid";
  } else {
    if (!output.error) return "Failed output missing error object";
    if (!output.error.type || !output.error.message) return "Error object missing type or message";
    if (!output.processingTime || output.processingTime < 0) return "Missing or invalid processingTime on error";
    
    return "valid_error";
  }
}

// Export configuration and metadata
export const STAGE_D_METADATA = {
  name: 'Stage D - SVG Logo Generation',
  model: STAGE_D_CONFIG.model,
  expected_tokens_budget: 800, // From claude.md
  timeout_ms: STAGE_D_CONFIG.timeout,
  max_retries: STAGE_D_CONFIG.max_retries,
  max_svg_size: STAGE_D_CONFIG.max_svg_size,
};