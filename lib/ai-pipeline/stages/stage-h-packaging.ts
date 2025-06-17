import { createLogoPackage, PackageData } from '../../packaging/zip-generator';
import { storeFile } from '../../utils/file-storage';

// Types for Stage H
export interface PackagedAssets {
  zipBuffer: Buffer;
  fileName: string;
  fileSize: number;
  contents: string[]; // List of files included in the package
}

export interface StageHInput {
  brandName: string;
  svg: string; // Original SVG
  pngVariants: {
    png256: Buffer;
    png512: Buffer;
    png1024: Buffer;
  };
  monochrome: {
    black: string; // SVG content
    white: string; // SVG content
  };
  favicon: {
    svg: string; // SVG content
    ico: Buffer;
  };
  guidelines: {
    html: string;
    plainText: string;
  };
}

export interface StageHOutput {
  success: boolean;
  packageUrl?: string; // Changed from package to packageUrl
  fileName?: string;
  error?: {
    type: 'validation_error' | 'packaging_error' | 'system_error';
    message: string;
    details?: unknown;
  };
  processingTime?: number;
}

// Configuration
const STAGE_H_CONFIG = {
  timeout: 15_000, // 15 seconds
  max_retries: 2,
  retry_delay: 1000, // 1 second
  readme_template: `# {BRAND_NAME} Logo Package

This package contains the complete brand assets for {BRAND_NAME}, generated with AI Logo Generator.

## Contents

### SVG Files
- \`logo.svg\` - Primary logo in vector format
- \`logo-black.svg\` - Monochrome black version
- \`logo-white.svg\` - Monochrome white version
- \`favicon.svg\` - Simplified favicon version

### PNG Files
- \`logo-256.png\` - 256x256 pixel raster version
- \`logo-512.png\` - 512x512 pixel raster version
- \`logo-1024.png\` - 1024x1024 pixel raster version

### Favicon
- \`favicon.ico\` - ICO format for website favicon

### Documentation
- \`brand-guidelines.html\` - Complete brand guidelines document
- \`brand-guidelines.txt\` - Plain text version of guidelines

## Usage

The SVG files are vector graphics that can be scaled to any size without loss of quality. They are ideal for print and high-resolution digital use.

The PNG files are raster images suitable for web and digital use where vector formats are not supported.

The favicon files are optimized for use as website favicons and app icons.

## License

These assets are owned by {BRAND_NAME} and are subject to their terms of use.

Generated on: {DATE}
`,
};

// Input validation class
class StageHValidator {
  static validateInput(input: StageHInput): void {
    if (!input.brandName || typeof input.brandName !== 'string') {
      throw new Error('Brand name is required');
    }
    
    if (!input.svg || typeof input.svg !== 'string') {
      throw new Error('SVG is required and must be a string');
    }
    
    if (!input.pngVariants) {
      throw new Error('PNG variants are required');
    }
    
    if (!input.pngVariants.png256 || !Buffer.isBuffer(input.pngVariants.png256)) {
      throw new Error('PNG 256x256 variant is required and must be a Buffer');
    }
    
    if (!input.pngVariants.png512 || !Buffer.isBuffer(input.pngVariants.png512)) {
      throw new Error('PNG 512x512 variant is required and must be a Buffer');
    }
    
    if (!input.pngVariants.png1024 || !Buffer.isBuffer(input.pngVariants.png1024)) {
      throw new Error('PNG 1024x1024 variant is required and must be a Buffer');
    }
    
    if (!input.monochrome) {
      throw new Error('Monochrome variants are required');
    }
    
    if (!input.monochrome.black || typeof input.monochrome.black !== 'string') {
      throw new Error('Monochrome black variant is required and must be a string');
    }
    
    if (!input.monochrome.white || typeof input.monochrome.white !== 'string') {
      throw new Error('Monochrome white variant is required and must be a string');
    }
    
    if (!input.favicon) {
      throw new Error('Favicon is required');
    }
    
    if (!input.favicon.svg || typeof input.favicon.svg !== 'string') {
      throw new Error('Favicon SVG is required and must be a string');
    }
    
    if (!input.favicon.ico || !Buffer.isBuffer(input.favicon.ico)) {
      throw new Error('Favicon ICO is required and must be a Buffer');
    }
    
    if (!input.guidelines) {
      throw new Error('Guidelines are required');
    }
    
    if (!input.guidelines.html || typeof input.guidelines.html !== 'string') {
      throw new Error('Guidelines HTML is required and must be a string');
    }
    
    if (!input.guidelines.plainText || typeof input.guidelines.plainText !== 'string') {
      throw new Error('Guidelines plain text is required and must be a string');
    }
  }
}

// Main packaging function
export async function packageAssets(
  input: StageHInput
): Promise<StageHOutput> {
  const startTime = Date.now();
  try {
    StageHValidator.validateInput(input);

    const packageData: PackageData = {
      brandName: input.brandName,
      originalSvg: input.svg,
      monochrome: {
        lightSvg: input.monochrome.white,
        darkSvg: input.monochrome.black,
      },
      faviconSvg: input.favicon.svg,
      pngExports: {
        png256: input.pngVariants.png256,
        png512: input.pngVariants.png512,
        png1024: input.pngVariants.png1024,
      },
      faviconIco: input.favicon.ico,
      guidelinesHtml: input.guidelines.html,
    };

    const zipBuffer = await createLogoPackage(packageData);
    
    const fileName = `${input.brandName.toLowerCase().replace(/\s+/g, '-')}-logo-package.zip`;
    
    // Store the file and get a file ID (which will be part of the URL)
    const fileId = storeFile(fileName, zipBuffer);

    // Construct the download URL
    // Assuming the download endpoint is at /api/download
    // The actual base URL should come from an environment variable in a real app
    const packageUrl = `/api/download?file=${fileId}`;

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      packageUrl,
      fileName,
      processingTime,
    };
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[Stage H Error]', error);
    return {
      success: false,
      error: {
        type: error instanceof Error && error.message.includes('required') ? 'validation_error' : 'packaging_error',
        message: error instanceof Error ? error.message : 'Failed to package assets',
        details: error instanceof Error ? error.stack : String(error),
      },
      processingTime,
    };
  }
}

// Export configuration and metadata
export const STAGE_H_METADATA = {
  name: 'Stage H - Packaging & Delivery',
  expected_processing_time_ms: 2000, // Expected processing time
  timeout_ms: STAGE_H_CONFIG.timeout,
  max_retries: STAGE_H_CONFIG.max_retries,
};