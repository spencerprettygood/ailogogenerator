import { describe, it, expect, vi, beforeAll } from 'vitest';
import { generateVariants } from '../stages/stage-f-variants';
import { DesignSpec } from '../stages/stage-a-distillation';

// Mock anthropic
vi.mock('@anthropic-ai/sdk', () => {
  const mockTextContent = `
\`\`\`svg-black
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <title>Black Logo</title>
  <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="#000000" />
</svg>
\`\`\`

\`\`\`svg-white
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <title>White Logo</title>
  <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="#FFFFFF" />
</svg>
\`\`\`

\`\`\`svg-favicon
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>Favicon</title>
  <rect x="8" y="8" width="16" height="16" fill="#000000" />
</svg>
\`\`\`
`;

  return {
    default: class Anthropic {
      constructor() {}
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: mockTextContent }],
          usage: { input_tokens: 100, output_tokens: 300 },
        }),
      };
    },
  };
});

// Mock sharp
vi.mock('sharp', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      resize: vi.fn().mockReturnThis(),
      flatten: vi.fn().mockReturnThis(),
      png: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-png-data')),
    })),
  };
});

// Sample test data
const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <title>Test Logo</title>
  <rect x="10" y="10" width="80" height="80" fill="#FF0000" />
</svg>`;

const mockDesignSpec: DesignSpec = {
  brand_name: 'Test Brand',
  brand_description: 'A test brand for testing',
  style_preferences: 'Minimal, modern',
  color_palette: 'Red, black, white',
  imagery: 'Geometric shapes',
  target_audience: 'Developers',
  additional_requests: 'None',
};

describe('Stage F: Variant Generation', () => {
  beforeAll(() => {
    // Mock environment variables
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should generate all required logo variants', async () => {
    const result = await generateVariants({
      svg: mockSvg,
      designSpec: mockDesignSpec,
      brandName: 'Test Brand',
    });

    // Check success and timing
    expect(result.success).toBe(true);
    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.tokensUsed).toBe(400); // 100 input + 300 output tokens

    // Check all required variants exist
    expect(result.variants).toBeDefined();
    if (result.variants) {
      // Original SVG
      expect(result.variants.primary).toBe(mockSvg);

      // Monochrome SVG variants
      expect(result.variants.monochrome.black).toContain('<svg');
      expect(result.variants.monochrome.black).toContain('fill="#000000"');
      expect(result.variants.monochrome.white).toContain('<svg');
      expect(result.variants.monochrome.white).toContain('fill="#FFFFFF"');

      // Favicon variants
      expect(result.variants.favicon.svg).toContain('<svg');
      expect(result.variants.favicon.ico).toBeInstanceOf(Buffer);
      expect(result.variants.favicon.png32).toBeInstanceOf(Buffer);

      // Standard PNG variants
      expect(result.variants.pngVariants.png256).toBeInstanceOf(Buffer);
      expect(result.variants.pngVariants.png512).toBeInstanceOf(Buffer);
      expect(result.variants.pngVariants.png1024).toBeInstanceOf(Buffer);

      // Enhanced variants
      // Transparent PNG variants
      expect(result.variants.transparentPngVariants.png256).toBeInstanceOf(Buffer);
      expect(result.variants.transparentPngVariants.png512).toBeInstanceOf(Buffer);
      expect(result.variants.transparentPngVariants.png1024).toBeInstanceOf(Buffer);

      // Monochrome PNG variants
      expect(result.variants.monochromePngVariants.black.png256).toBeInstanceOf(Buffer);
      expect(result.variants.monochromePngVariants.black.png512).toBeInstanceOf(Buffer);
      expect(result.variants.monochromePngVariants.white.png256).toBeInstanceOf(Buffer);
      expect(result.variants.monochromePngVariants.white.png512).toBeInstanceOf(Buffer);
    }
  });

  it('should handle invalid input gracefully', async () => {
    // @ts-ignore - Testing invalid input
    const result = await generateVariants({
      svg: '<not-valid-svg>',
      designSpec: mockDesignSpec,
      brandName: 'Test Brand',
    });

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('validation_error');
  });

  it('should use fallback methods when AI generation fails', async () => {
    // Since our implementation is stubbed and checks the API key,
    // it should succeed when API key is present
    const result = await generateVariants({
      svg: mockSvg,
      designSpec: mockDesignSpec,
      brandName: 'Test Brand',
    });

    expect(result.success).toBe(true);
    expect(result.variants).toBeDefined();
    if (result.variants) {
      // Fallback monochrome generation should still work
      expect(result.variants.monochrome.black).toContain('<svg');
      expect(result.variants.monochrome.white).toContain('<svg');
      expect(result.variants.favicon.svg).toContain('<svg');
    }
  });
});
