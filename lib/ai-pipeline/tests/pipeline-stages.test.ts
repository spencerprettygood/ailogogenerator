import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesignSpec, distillRequirements } from '../stages/stage-a-distillation';
import { generateMoodboard, MoodboardConcept } from '../stages/stage-b-moodboard';
import { selectDirection } from '../stages/stage-c-selection';
import { generateSvgLogo } from '../stages/stage-d-generation';
import { validateAndRepairSvg } from '../stages/stage-e-validation';
import { generateVariants, StageFInput } from '../stages/stage-f-variants';

// Define proper types for mock
interface MockAnthropicOptions {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string;
  messages: Array<{ role: string; content: string }>;
}

// Mock Anthropic client
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      apiKey: string;

      constructor({ apiKey }: { apiKey: string }) {
        this.apiKey = apiKey;
      }

      messages = {
        create: vi.fn().mockImplementation(async (options: MockAnthropicOptions) => {
          // Different mock responses based on model
          if (options.model.includes('haiku')) {
            if (options.system.includes('logo design expert evaluating concept options')) {
              // Stage C mock
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      selected_concept_index: 0,
                      selection_rationale: "This concept best aligns with the brand's modern and technological focus while appealing to the target audience.",
                      score: 85
                    })
                  }
                ],
                usage: { input_tokens: 300, output_tokens: 100 }
              };
            } else {
              // Stage A mock
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      brand_name: "TechCorp",
                      brand_description: "A modern technology company",
                      style_preferences: "Modern, clean, professional",
                      color_palette: "Blue, gray, white",
                      imagery: "Abstract, geometric",
                      target_audience: "Tech professionals",
                      additional_requests: "Simple and memorable"
                    })
                  }
                ],
                usage: { input_tokens: 200, output_tokens: 150 }
              };
            }
          } else if (options.model.includes('sonnet')) {
            if (options.system.includes('creating SVG logos')) {
              // Stage D mock
              return {
                content: [
                  {
                    type: 'text',
                    text: '```svg\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">\n  <title>TechCorp Logo</title>\n  <desc>A modern logo for TechCorp</desc>\n  <rect x="50" y="50" width="200" height="200" fill="#007BFF" />\n</svg>\n```\n\n```json\n{"colors":["#007BFF"],"design_notes":"Simple blue square logo"}\n```'
                  }
                ],
                usage: { input_tokens: 500, output_tokens: 300 }
              };
            } else {
              // Stage B mock
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      concepts: [
                        {
                          name: "Modern Geometric",
                          description: "A clean, geometric logo featuring sharp lines and angular shapes that embody the precision and innovation of modern technology. The design incorporates abstract geometric elements that create a sense of structure and reliability while maintaining visual interest through carefully balanced proportions and negative space.",
                          style_approach: "Minimalist",
                          primary_colors: ["#007BFF", "#E0E0E0"],
                          typography_style: "Sans-serif, modern with clean letterforms",
                          imagery_elements: "Abstract geometric shapes, angular lines, structured composition",
                          rationale: "This concept represents technology and innovation through geometric precision, appealing to professionals who value clarity and efficiency in their business solutions."
                        },
                        {
                          name: "Tech Wave",
                          description: "A dynamic flowing wave design that represents the continuous flow of data and digital connectivity in the modern technological landscape. The design features smooth, curved lines that suggest movement and progress, creating a sense of energy and forward momentum that reflects the company's innovative approach to technology solutions.",
                          style_approach: "Dynamic",
                          primary_colors: ["#0055A4", "#00C9FF"],
                          typography_style: "Bold sans-serif with subtle curves",
                          imagery_elements: "Wave patterns, flowing lines, gradient transitions",
                          rationale: "This concept symbolizes data flow and connectivity, emphasizing the company's role in enabling seamless digital communication and technological advancement."
                        },
                        {
                          name: "Digital Cube",
                          description: "A sophisticated 3D cube design integrated with digital circuit patterns and technological elements that convey depth, dimension, and technical expertise. The cube structure represents stability and foundation, while the digital elements suggest innovation and cutting-edge technology, creating a perfect balance between reliability and progress.",
                          style_approach: "3D Modern",
                          primary_colors: ["#333333", "#00AAFF"],
                          typography_style: "Techy, angular sans-serif with digital aesthetics",
                          imagery_elements: "3D cube structure, digital circuits, technological patterns",
                          rationale: "This concept represents digital transformation and technology infrastructure, appealing to clients who seek robust, enterprise-level technological solutions."
                        }
                      ]
                    })
                  }
                ],
                usage: { input_tokens: 400, output_tokens: 600 }
              };
            }
          }
        })
      };
    }
  };
});

// Mock environment
vi.stubEnv('ANTHROPIC_API_KEY', 'mock-api-key');

describe('AI Pipeline Stages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stage A - Requirement Distillation', () => {
    it('should extract design requirements from brief', async () => {
      const brief = "Create a modern logo for TechCorp, a technology company focusing on software development";
      const result = await distillRequirements(brief);
      
      expect(result.success).toBe(true);
      expect(result.designSpec).toBeDefined();
      expect(result.designSpec?.brand_name).toBe('TechCorp');
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('Stage B - Moodboard Generation', () => {
    it('should generate concept options based on design spec', async () => {
      const designSpec: DesignSpec = {
        brand_name: "TechCorp",
        brand_description: "A modern technology company",
        style_preferences: "Modern, clean, professional",
        color_palette: "Blue, gray, white",
        imagery: "Abstract, geometric",
        target_audience: "Tech professionals",
        additional_requests: "Simple and memorable"
      };
      
      const result = await generateMoodboard(designSpec);
      
      expect(result.success).toBe(true);
      expect(result.moodboard).toBeDefined();
      expect(result.moodboard?.concepts.length).toBe(3);
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('Stage C - Direction Selection', () => {
    it('should select the best concept based on requirements', async () => {
      const designSpec: DesignSpec = {
        brand_name: "TechCorp",
        brand_description: "A modern technology company",
        style_preferences: "Modern, clean, professional",
        color_palette: "Blue, gray, white",
        imagery: "Abstract, geometric",
        target_audience: "Tech professionals",
        additional_requests: "Simple and memorable"
      };
      
      const concepts: MoodboardConcept[] = [
        {
          name: "Modern Geometric",
          description: "A clean, geometric logo with sharp lines and angles",
          style_approach: "Minimalist",
          primary_colors: ["#007BFF", "#E0E0E0"],
          typography_style: "Sans-serif, modern",
          imagery_elements: "Abstract geometric shapes",
          rationale: "Represents technology and innovation"
        },
        {
          name: "Tech Wave",
          description: "A flowing wave design representing data and connectivity",
          style_approach: "Dynamic",
          primary_colors: ["#0055A4", "#00C9FF"],
          typography_style: "Bold sans-serif",
          imagery_elements: "Wave pattern, flowing lines",
          rationale: "Symbolizes data flow and connectivity"
        },
        {
          name: "Digital Cube",
          description: "A 3D cube design with digital elements",
          style_approach: "3D Modern",
          primary_colors: ["#333333", "#00AAFF"],
          typography_style: "Techy, angular sans-serif",
          imagery_elements: "Cube, digital circuits",
          rationale: "Represents digital transformation and technology"
        }
      ];
      
      const result = await selectDirection({ designSpec, concepts });
      
      expect(result.success).toBe(true);
      expect(result.selection).toBeDefined();
      expect(result.selection?.selectedConcept).toEqual(concepts[0]);
      expect(result.selection?.score).toBe(85);
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('Stage D - SVG Logo Generation', () => {
    it('should generate SVG logo based on selected concept', async () => {
      const designSpec: DesignSpec = {
        brand_name: "TechCorp",
        brand_description: "A modern technology company",
        style_preferences: "Modern, clean, professional",
        color_palette: "Blue, gray, white",
        imagery: "Abstract, geometric",
        target_audience: "Tech professionals",
        additional_requests: "Simple and memorable"
      };
      
      const selectedConcept: MoodboardConcept = {
        name: "Modern Geometric",
        description: "A clean, geometric logo with sharp lines and angles",
        style_approach: "Minimalist",
        primary_colors: ["#007BFF", "#E0E0E0"],
        typography_style: "Sans-serif, modern",
        imagery_elements: "Abstract geometric shapes",
        rationale: "Represents technology and innovation"
      };
      
      const result = await generateSvgLogo({ designSpec, selectedConcept });
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.svg).toContain('<svg');
      expect(result.result?.svg).toContain('TechCorp Logo');
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('Stage E - SVG Validation & Repair', () => {
    it('should validate and repair SVG', async () => {
      const svg = '<svg width="300" height="300"><rect x="50" y="50" width="200" height="200" fill="#007BFF" /></svg>';
      const brandName = "TechCorp";
      
      const result = await validateAndRepairSvg({ svg, brandName, repair: true, optimize: true });
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.isValid).toBe(true);
      expect(result.result?.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.result?.svg).toContain('<title>TechCorp Logo</title>');
      expect(result.result?.optimized).toBe(true);
    });
  });

  describe('Stage F - Variant Generation', () => {
    const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect x="50" y="50" width="200" height="200" fill="#007BFF" /></svg>';
    const designSpec: DesignSpec = {
      brand_name: "TechCorp",
      brand_description: "A modern technology company",
      style_preferences: "Modern, clean, professional",
      color_palette: "Blue, gray, white",
      imagery: "Abstract, geometric",
      target_audience: "Tech professionals",
      additional_requests: "Simple and memorable"
    };
    const input: StageFInput = {
      svg: validSvg,
      designSpec,
      brandName: "TechCorp"
    };

    it('should generate all logo variants successfully', async () => {
      const result = await generateVariants(input);
      expect(result.success).toBe(true);
      expect(result.variants).toBeDefined();
      expect(result.variants?.monochrome.black).toContain('<svg');
      expect(result.variants?.monochrome.white).toContain('<svg');
      expect(result.variants?.favicon.svg).toContain('<svg');
      expect(result.variants?.favicon.png32).toBeInstanceOf(Buffer);
      expect(result.variants?.favicon.ico).toBeInstanceOf(Buffer);
      expect(result.variants?.pngVariants.png256).toBeInstanceOf(Buffer);
      expect(result.variants?.pngVariants.png512).toBeInstanceOf(Buffer);
      expect(result.variants?.pngVariants.png1024).toBeInstanceOf(Buffer);
      expect(result.tokensUsed).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle invalid SVG input with error', async () => {
      const badInput = { ...input, svg: 'not-an-svg' };
      const result = await generateVariants(badInput);
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation_error');
    });

    it('should use fallback logic if AI fails', async () => {
      // Simulate missing API key to force fallback
      const oldKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const result = await generateVariants(input);
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('system_error');
      if (oldKey) process.env.ANTHROPIC_API_KEY = oldKey;
    });
  });
});