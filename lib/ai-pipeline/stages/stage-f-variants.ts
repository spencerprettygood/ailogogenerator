import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { DesignSpec } from './stage-a-distillation';

// Types for Stage F
export interface LogoVariants {
  primary: string; // Original SVG content
  monochrome: {
    black: string; // SVG content
    white: string; // SVG content
  };
  favicon: {
    svg: string; // Simplified SVG for favicon
    png32: Buffer; // 32x32 PNG
    ico: Buffer; // ICO format with multiple sizes
  };
  pngVariants: {
    png256: Buffer; // 256x256 PNG
    png512: Buffer; // 512x512 PNG
    png1024: Buffer; // 1024x1024 PNG
  };
}

export interface StageFInput {
  svg: string; // Original SVG
  designSpec: DesignSpec;
  brandName: string;
}

export interface StageFOutput {
  success: boolean;
  variants?: LogoVariants;
  error?: {
    type: 'validation_error' | 'ai_error' | 'system_error' | 'conversion_error';
    message: string;
    details?: unknown;
  };
  tokensUsed?: number;
  processingTime?: number;
}

// Configuration
const STAGE_F_CONFIG = {
  model: 'claude-3-5-haiku-20240620' as const, // Haiku for fast transformation
  temperature: 0.1, // Low for deterministic results
  max_tokens: 1000, // For SVG generation
  timeout: 30_000, // 30 seconds
  max_retries: 3,
  retry_delay: 2000, // 2 seconds
  png_quality: 95,
  png_sizes: [32, 256, 512, 1024]
};

// System prompt for monochrome variant generation
const STAGE_F_SYSTEM_PROMPT = `
You are a professional logo designer creating monochrome variants of an SVG logo. Convert the provided color SVG logo into clean black and white versions.

OUTPUT FORMAT:
1. First, output a BLACK monochrome version (pure black #000000 on transparent background) enclosed in \`\`\`svg-black and \`\`\` tags.
2. Then, output a WHITE monochrome version (pure white #FFFFFF on transparent background) enclosed in \`\`\`svg-white and \`\`\` tags.
3. Finally, output a simplified FAVICON version (optimized for small sizes) enclosed in \`\`\`svg-favicon and \`\`\` tags.

MONOCHROME CONVERSION RULES:
- Preserve the exact shape and proportions of the original
- Remove all colors and gradients
- Use only #000000 for black version and #FFFFFF for white version
- Convert all fills and strokes to solid colors
- Maintain the same viewBox and dimensions
- Keep the structure as similar as possible to the original
- Preserve all important visual elements
- Ensure paths are properly closed and defined
- Maintain the accessibility elements (title, desc)

FAVICON REQUIREMENTS:
- Create a simplified version optimized for 32x32 pixel display
- Remove fine details that won't render well at small sizes
- Keep only the most recognizable elements
- Increase stroke widths slightly if needed for visibility
- Ensure high contrast and readability
- Use the same viewBox proportions
- Simplify complex paths where possible
- Make sure it's recognizable as the same brand

TECHNICAL REQUIREMENTS:
- All SVGs must be valid XML
- Include necessary namespace attributes
- Keep accessibility elements (title, desc)
- Remove unnecessary comments or metadata
- Ensure clean, optimized path definitions
- Round coordinate values to 1 decimal place for efficiency

Return ONLY the three SVG variants as specified with no additional text or explanations.
`;

// Input validation class
class StageFValidator {
  static validateInput(input: StageFInput): void {
    if (!input.svg || typeof input.svg !== 'string') {
      throw new Error('SVG input is required and must be a string');
    }
    
    if (!input.svg.includes('<svg')) {
      throw new Error('Invalid SVG: missing svg element');
    }
    
    if (!input.brandName || typeof input.brandName !== 'string') {
      throw new Error('Brand name is required');
    }
    
    if (!input.designSpec) {
      throw new Error('Design specification is required');
    }
  }

  static extractVariants(content: string): { black: string | null; white: string | null; favicon: string | null } {
    // Extract black variant
    const blackMatch = content.match(/```svg-black\s*([\s\S]*?)\s*```/);
    const black = blackMatch ? blackMatch[1].trim() : null;
    
    // Extract white variant
    const whiteMatch = content.match(/```svg-white\s*([\s\S]*?)\s*```/);
    const white = whiteMatch ? whiteMatch[1].trim() : null;
    
    // Extract favicon variant
    const faviconMatch = content.match(/```svg-favicon\s*([\s\S]*?)\s*```/);
    const favicon = faviconMatch ? faviconMatch[1].trim() : null;
    
    return { black, white, favicon };
  }

  static validateSvgVariant(svg: string, variantName: string): boolean {
    if (!svg || typeof svg !== 'string') {
      console.error(`${variantName} variant is empty or not a string`);
      return false;
    }
    
    if (!svg.includes('<svg')) {
      console.error(`${variantName} variant is missing svg element`);
      return false;
    }
    
    return true;
  }
}

// SVG to PNG converter
class SvgConverter {
  static async svgToPng(svg: string, size: number): Promise<Buffer> {
    try {
      // Convert SVG to PNG using sharp
      return await sharp(Buffer.from(svg))
        .resize(size, size)
        .png({ quality: STAGE_F_CONFIG.png_quality })
        .toBuffer();
    } catch (error) {
      throw new Error(`Failed to convert SVG to PNG at size ${size}: ${(error as Error).message}`);
    }
  }

  static async createIco(favicon32Buffer: Buffer): Promise<Buffer> {
    try {
      // For ICO format we'll use the 32x32 PNG since most modern browsers support PNG-based ICOs
      // For a full implementation, we would create multiple sizes and package them into a proper ICO
      // This is a simplified version that works for most cases
      
      // In a production environment, you'd want to use a library like "ico-converter" 
      // to properly package multiple sizes into an ICO file
      
      // For this implementation, we'll just use the 32x32 PNG as is
      // A proper ICO would contain 16x16, 32x32, and 48x48 versions
      
      return favicon32Buffer;
      
      // In a full implementation with a proper ICO library:
      // const ico = require('ico-converter');
      // return await ico.fromPNG(favicon32Buffer, [16, 32, 48]);
    } catch (error) {
      throw new Error(`Failed to create ICO file: ${(error as Error).message}`);
    }
  }
}

// Retry utility
class StageFRetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = STAGE_F_CONFIG.max_retries,
    baseDelay: number = STAGE_F_CONFIG.retry_delay
  ): Promise<T> {
    let lastError: Error = new Error('Retry operation failed.');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors
        if (error instanceof Error && error.message.includes('is required')) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
        }
      }
    }

    throw new Error(`Stage F: All attempts failed. Last error: ${lastError.message}`);
  }
}

// Fallback monochrome generator
class MonochromeGenerator {
  static createBlackVersion(svg: string): string {
    // Simple regex-based color replacement
    // A more robust implementation would use a proper SVG parser
    
    try {
      // Add XML and SVG namespace if missing
      let result = svg;
      
      if (!result.includes('xmlns=')) {
        result = result.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      
      // Remove existing styles
      result = result.replace(/<style>[\s\S]*?<\/style>/gi, '');
      
      // Replace fill colors with black
      result = result.replace(/fill="[^"]*"/gi, 'fill="#000000"');
      result = result.replace(/fill='[^']*'/gi, "fill='#000000'");
      result = result.replace(/stroke="[^"]*"/gi, 'stroke="#000000"');
      result = result.replace(/stroke='[^']*'/gi, "stroke='#000000'");
      
      // Remove gradients and replace with black
      result = result.replace(/<linearGradient[\s\S]*?<\/linearGradient>/gi, '');
      result = result.replace(/<radialGradient[\s\S]*?<\/radialGradient>/gi, '');
      result = result.replace(/url\(#[^)]*\)/gi, '#000000');
      
      return result;
    } catch (error) {
      console.error('Error creating black version:', error);
      return svg; // Return original if conversion fails
    }
  }

  static createWhiteVersion(svg: string): string {
    try {
      // Start with the black version and change black to white
      let result = this.createBlackVersion(svg);
      
      // Replace black with white
      result = result.replace(/fill="#000000"/gi, 'fill="#FFFFFF"');
      result = result.replace(/fill='#000000'/gi, "fill='#FFFFFF'");
      result = result.replace(/stroke="#000000"/gi, 'stroke="#FFFFFF"');
      result = result.replace(/stroke='#000000'/gi, "stroke='#FFFFFF'");
      
      return result;
    } catch (error) {
      console.error('Error creating white version:', error);
      return svg; // Return original if conversion fails
    }
  }

  static createSimpleFavicon(svg: string): string {
    try {
      // Start with the black version for consistency
      let result = this.createBlackVersion(svg);
      
      // Ensure viewBox is set to a square for favicon
      const viewBoxMatch = result.match(/viewBox=["']([^"']*)["']/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        const parts = viewBoxMatch[1].split(/\s+/).map(Number);
        if (parts.length === 4) {
          // Make it square by using the larger dimension
          const size = Math.max(parts[2], parts[3]);
          result = result.replace(
            /viewBox=["'][^"']*["']/,
            `viewBox="0 0 ${size} ${size}"`
          );
        }
      }
      
      // Add title with brand name if missing
      if (!result.includes('<title>')) {
        result = result.replace(
          /<svg([^>]*)>/,
          `<svg$1>\n  <title>Favicon</title>`
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error creating favicon:', error);
      return svg; // Return original if conversion fails
    }
  }
}

// Main variant generation function
export async function generateVariants(
  input: StageFInput
): Promise<StageFOutput> {
  const startTime = Date.now();
  
  try {
    // Validate input
    StageFValidator.validateInput(input);

    // Initialize Anthropic client
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Construct user message with SVG
    const userMessage = `
LOGO VARIANT GENERATION TASK:

Brand Name: ${input.brandName}

Original SVG Logo:

\`\`\`svg
${input.svg}
\`\`\`

Create the following variants of this logo:
1. A BLACK monochrome version (all black, #000000, on transparent background)
2. A WHITE monochrome version (all white, #FFFFFF, on transparent background)
3. A simplified FAVICON version optimized for small displays (32x32 pixels)

Follow the requirements exactly as specified in your instructions.
`;

    // Call Claude API with retry logic
    let blackVariant: string;
    let whiteVariant: string;
    let faviconVariant: string;
    let tokensUsed = 0;
    
    try {
      const completion = await StageFRetryHandler.withRetry(async () => {
        const response = await anthropic.messages.create({
          model: STAGE_F_CONFIG.model,
          max_tokens: STAGE_F_CONFIG.max_tokens,
          temperature: STAGE_F_CONFIG.temperature,
          system: STAGE_F_SYSTEM_PROMPT,
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

      // Extract variants from the response
      const variants = StageFValidator.extractVariants(completion.content);
      tokensUsed = (completion.usage.input_tokens || 0) + (completion.usage.output_tokens || 0);
      
      // Validate each variant
      if (variants.black && StageFValidator.validateSvgVariant(variants.black, 'Black')) {
        blackVariant = variants.black;
      } else {
        console.warn('Using fallback black variant generation');
        blackVariant = MonochromeGenerator.createBlackVersion(input.svg);
      }
      
      if (variants.white && StageFValidator.validateSvgVariant(variants.white, 'White')) {
        whiteVariant = variants.white;
      } else {
        console.warn('Using fallback white variant generation');
        whiteVariant = MonochromeGenerator.createWhiteVersion(input.svg);
      }
      
      if (variants.favicon && StageFValidator.validateSvgVariant(variants.favicon, 'Favicon')) {
        faviconVariant = variants.favicon;
      } else {
        console.warn('Using fallback favicon generation');
        faviconVariant = MonochromeGenerator.createSimpleFavicon(input.svg);
      }
    } catch (error) {
      console.warn('AI-based variant generation failed, using fallbacks:', error);
      // If AI generation fails, use fallback methods
      blackVariant = MonochromeGenerator.createBlackVersion(input.svg);
      whiteVariant = MonochromeGenerator.createWhiteVersion(input.svg);
      faviconVariant = MonochromeGenerator.createSimpleFavicon(input.svg);
    }
    
    // Generate PNG variants
    const favicon32Buffer = await SvgConverter.svgToPng(faviconVariant, 32);
    const ico = await SvgConverter.createIco(favicon32Buffer);
    
    const png256 = await SvgConverter.svgToPng(input.svg, 256);
    const png512 = await SvgConverter.svgToPng(input.svg, 512);
    const png1024 = await SvgConverter.svgToPng(input.svg, 1024);
    
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      variants: {
        primary: input.svg, // Add the original SVG as the primary logo
        monochrome: {
          black: blackVariant,
          white: whiteVariant
        },
        favicon: {
          svg: faviconVariant,
          png32: favicon32Buffer,
          ico
        },
        pngVariants: {
          png256,
          png512,
          png1024
        }
      },
      tokensUsed,
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    let errorType: 'validation_error' | 'ai_error' | 'system_error' | 'conversion_error' = 'system_error';
    let errorMessage = 'Unknown error occurred during variant generation';
    let errorDetails: unknown = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (process.env.NODE_ENV === 'development') {
        errorDetails = error.stack;
      }

      if (error.message.includes('is required') || 
          error.message.includes('Invalid SVG')) {
        errorType = 'validation_error';
      } else if (error.message.includes('AI model') || 
                 error.message.includes('AI response')) {
        errorType = 'ai_error';
      } else if (error.message.includes('Failed to convert') || 
                 error.message.includes('Failed to create ICO')) {
        errorType = 'conversion_error';
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

// Export configuration and metadata
export const STAGE_F_METADATA = {
  name: 'Stage F - Variant Generation',
  model: STAGE_F_CONFIG.model,
  expected_tokens_budget: 400, // From claude.md
  timeout_ms: STAGE_F_CONFIG.timeout,
  max_retries: STAGE_F_CONFIG.max_retries,
  png_sizes: STAGE_F_CONFIG.png_sizes,
};