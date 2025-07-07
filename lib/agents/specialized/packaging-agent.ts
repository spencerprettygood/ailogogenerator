import { BaseAgent } from '../base/base-agent';
import {
  AgentConfig,
  AgentInput,
  PackagingAgentInput,
  PackagingAgentOutput,
} from '../../types-agents';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';

// Conditional import for Vercel Blob - only in production
let put: any = null;
if (process.env.NODE_ENV === 'production' && process.env.BLOB_READ_WRITE_TOKEN) {
  try {
    const vercelBlob = require('@vercel/blob');
    put = vercelBlob.put;
  } catch (error) {
    console.warn('Vercel Blob not available:', error);
  }
}

/**
 * PackagingAgent - Packages all assets for delivery to the user
 */
export class PackagingAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('packaging', ['asset-packaging'], {
      model: 'claude-3-haiku-20240307', // This agent doesn't primarily use Claude
      fallbackModels: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229'], // Fallback models if primary fails
      temperature: 0.1,
      maxTokens: 500,
      ...config,
    });

    // This agent doesn't primarily use Claude - it handles asset packaging directly

    // Set a system prompt - required to avoid "text content blocks must be non-empty" error
    this.systemPrompt = `You are a specialized asset packaging agent for an AI logo generator.
    
Your task is to create helpful documentation and organize logo assets for delivery to users.

IMPORTANT REQUIREMENTS:
1. Create clear, professional README files explaining the logo package contents
2. Ensure documentation is concise, well-formatted, and user-friendly
3. Focus on explaining file structure, usage instructions, and proper logo application
4. Include appropriate credits for the AI Logo Generator
5. Format your response as proper markdown`;
  }

  /**
   * Generate the prompt for packaging
   * This agent doesn't primarily use prompts, but can generate README content
   */
  protected async generatePrompt(input: PackagingAgentInput): Promise<string> {
    const { brandName } = input;

    // Only used for generating README content
    return `Please create a brief README.md file for a logo package for "${brandName}".

The package contains:
- Primary logo in SVG format
- PNG exports in various sizes (256x256, 512x512, 1024x1024)
- Monochrome variants (black and white)
- Favicon (ICO and SVG formats)
- Brand guidelines (HTML)

Include:
- A brief introduction
- File structure explanation
- Usage instructions
- Credits for the AI Logo Generator

Keep it concise but professional. Format as proper markdown.`;
  }

  /**
   * Process packaging operation
   * This is primarily a direct asset packaging operation, not an AI response processing
   */
  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput
  ): Promise<PackagingAgentOutput> {
    const input = originalInput as PackagingAgentInput;
    const { brandName, svg, pngVariants, monochrome, favicon, guidelines } = input;

    try {
      this.log(`Starting packaging process for ${brandName}...`);

      const zip = new JSZip();

      // Add assets to the zip file
      zip.file('logo.svg', svg);
      zip.file('guidelines.html', guidelines.html);

      const pngFolder = zip.folder('png');
      for (const [size, dataUrl] of Object.entries(pngVariants)) {
        if (dataUrl && typeof dataUrl === 'string') {
          const base64Data = dataUrl.split(',')[1];
          if (base64Data) {
            pngFolder?.file(`${size}.png`, base64Data, { base64: true });
          }
        }
      }

      const monochromeFolder = zip.folder('monochrome');
      monochromeFolder?.file('black.svg', monochrome.black);
      monochromeFolder?.file('white.svg', monochrome.white);

      const faviconFolder = zip.folder('favicon');
      faviconFolder?.file('favicon.svg', favicon.svg);
      if (favicon.ico) {
        const base64Data = favicon.ico.split(',')[1];
        if (base64Data) {
          faviconFolder?.file('favicon.ico', base64Data, { base64: true });
        }
      }

      const readmeContent = responseContent || this.generateFallbackReadme(brandName);
      zip.file('README.md', readmeContent);

      const sanitizedBrandName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueId = nanoid(6);
      const fileName = `${sanitizedBrandName}-logo-package-${uniqueId}.zip`;

      this.log(`Generating zip file: ${fileName}`);
      // Generate ZIP as Buffer for Node.js environment
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      // In development mode, create a data URL for the ZIP file
      if (process.env.NODE_ENV === 'development' || !put) {
        this.log(`Development mode: Creating data URL for package`);
        const base64Zip = zipBuffer.toString('base64');
        const downloadUrl = `data:application/zip;base64,${base64Zip}`;

        this.log(`Package prepared successfully (development mode)`);

        return {
          success: true,
          result: {
            fileName,
            fileSize: zipBuffer.length,
            downloadUrl,
          },
          tokensUsed: this.metrics.tokenUsage.total,
          processingTime: this.metrics.executionTime,
        };
      }

      this.log(`Uploading package to Vercel Blob...`);
      // Upload the ZIP buffer (production mode)
      const { url: downloadUrl } = await put(fileName, zipBuffer, {
        access: 'public',
        contentType: 'application/zip',
      });
      this.log(`Package uploaded successfully: ${downloadUrl}`);

      this.log(`Uploading guidelines to Vercel Blob...`);
      const guidelinesFileName = `${sanitizedBrandName}-guidelines-${uniqueId}.html`;
      const { url: guidelinesUrl } = await put(guidelinesFileName, guidelines.html, {
        access: 'public',
        contentType: 'text/html',
      });
      this.log(`Guidelines uploaded successfully: ${guidelinesUrl}`);

      return {
        success: true,
        result: {
          fileName,
          fileSize: zipBuffer.length,
          downloadUrl,
          // Note: guidelinesUrl not included in result type, but logged above for reference
        },
        tokensUsed: this.metrics.tokenUsage.total,
        processingTime: this.metrics.executionTime,
      };
    } catch (error) {
      // Log full error details for debugging
      const errMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
      this.log(`PackagingAgent encountered an error: ${errMsg}`, 'error');
      this.log(`Error stack: ${errorStack}`, 'error');

      return {
        success: false,
        error: handleError({
          error: errMsg,
          category: ErrorCategory.EXTERNAL,
          details: { brandName, error: errMsg, stack: errorStack },
          retryable: true,
        }),
      };
    }
  }

  private generateFallbackReadme(brandName: string): string {
    return `# ${brandName} Logo Package\n\nThis package contains the logo assets for ${brandName}, generated by AI Logo Generator.\n\n## Contents\n\n- Primary logo (SVG)\n- PNG exports (256px, 512px, 1024px)\n- Monochrome variants\n- Favicon\n- Brand guidelines\n\n## Usage\n\nRefer to the brand guidelines.html for detailed usage instructions.\n\n## Generated with AI Logo Generator\n\n© ${new Date().getFullYear()} AI Logo Generator`;
  }
}
