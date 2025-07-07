import { SVGDesignValidationAgent } from '../svg-design-validation-agent';
import { SVGDesignValidator } from '../../../utils/svg-design-validator';

// Mock the SVGDesignValidator
jest.mock('../../../utils/svg-design-validator', () => ({
  SVGDesignValidator: {
    validateDesignQuality: jest.fn(),
    processWithDesignAssessment: jest.fn(),
    validate: jest.fn(),
    process: jest.fn(),
  },
}));

describe('SVGDesignValidationAgent', () => {
  let agent: SVGDesignValidationAgent;

  // Sample SVG for testing
  const testSVG = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <title>Test Logo</title>
    <desc>A test logo for design validation</desc>
    <rect x="50" y="50" width="200" height="200" fill="#3498db" rx="20" />
    <circle cx="150" cy="150" r="80" fill="#ffffff" />
    <path d="M120,120 L180,120 L150,180 Z" fill="#e74c3c" />
  </svg>`;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up default mock returns
    (SVGDesignValidator.validateDesignQuality as jest.Mock).mockReturnValue({
      isValid: true,
      securityScore: 90,
      accessibilityScore: 85,
      optimizationScore: 80,
      designQualityScore: {
        colorHarmony: 85,
        composition: 80,
        visualWeight: 75,
        typography: 90,
        negativeSpace: 85,
        overallAesthetic: 83,
        technicalQuality: 85,
        designSuggestions: ['Suggestion 1', 'Suggestion 2'],
      },
    });

    (SVGDesignValidator.processWithDesignAssessment as jest.Mock).mockReturnValue({
      svg: testSVG,
      success: true,
      designQuality: {
        colorHarmony: 85,
        composition: 80,
        visualWeight: 75,
        typography: 90,
        negativeSpace: 85,
        overallAesthetic: 83,
        technicalQuality: 85,
        designSuggestions: ['Suggestion 1', 'Suggestion 2'],
      },
    });

    // Create agent instance
    agent = new SVGDesignValidationAgent();
  });

  test('should be initialized with correct properties', () => {
    expect(agent.id).toBeDefined();
    expect(agent.type).toBe('svg-design-validation');
    expect(agent.capabilities).toContain('svg-validation');
    expect(agent.capabilities).toContain('design-theory');
  });

  test('should process validation with design assessment', async () => {
    const input = {
      id: '123',
      svg: testSVG,
      brandName: 'Test Brand',
      assessDesign: true,
    };

    // Mock Claude's response
    const mockResponseContent = `
      Design quality assessment:
      The logo has good color harmony with a pleasing blue and red contrast.
      The composition is well-balanced with centered elements.
      
      Here's the repaired SVG:
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <title>Test Logo</title>
        <desc>A test logo for design validation</desc>
        <rect x="50" y="50" width="200" height="200" fill="#3498db" rx="20" />
        <circle cx="150" cy="150" r="80" fill="#ffffff" />
        <path d="M120,120 L180,120 L150,180 Z" fill="#e74c3c" />
      </svg>
    `;

    const result = await agent['processResponse'](mockResponseContent, input);

    // Verify SVGDesignValidator was called with design assessment
    expect(SVGDesignValidator.validateDesignQuality).toHaveBeenCalledWith(testSVG);

    // Check result structure
    expect(result.success).toBe(true);
    expect(result.result?.svg).toBe(testSVG);
    expect(result.result?.isValid).toBe(true);
    expect(result.result?.designQualityScore).toBeDefined();
    expect(result.result?.designFeedback).toContain('The logo has good color harmony');
  });

  test('should handle validation failures', async () => {
    // Mock a validation failure
    (SVGDesignValidator.validateDesignQuality as jest.Mock).mockReturnValue({
      isValid: false,
      errors: ['Invalid SVG structure'],
      designQualityScore: {
        colorHarmony: 0,
        composition: 0,
        visualWeight: 0,
        typography: 0,
        negativeSpace: 0,
        overallAesthetic: 0,
        technicalQuality: 0,
        designSuggestions: ['Fix validation errors before assessing design quality'],
      },
    });

    const input = {
      id: '123',
      svg: 'invalid svg',
      brandName: 'Test Brand',
      repair: false,
    };

    const result = await agent['processResponse']('', input);

    // Check error handling
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('SVG validation failed');
  });

  test('should use Claude-assisted repair when automated repair fails', async () => {
    // Mock an unsuccessful repair
    (SVGDesignValidator.processWithDesignAssessment as jest.Mock).mockReturnValue({
      success: false,
    });

    const input = {
      id: '123',
      svg: 'broken svg',
      brandName: 'Test Brand',
      repair: true,
    };

    // Mock Claude providing a fixed SVG
    const mockResponseContent = `
      The SVG has several issues:
      1. Missing closing tag
      2. Invalid attributes
      
      Here's the repaired SVG:
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <title>Fixed Logo</title>
        <rect x="50" y="50" width="200" height="200" fill="#3498db" />
      </svg>
    `;

    // Mock that Claude's repair is valid
    (SVGDesignValidator.validateDesignQuality as jest.Mock)
      .mockReturnValueOnce({ isValid: false }) // First call for original SVG
      .mockReturnValueOnce({
        // Second call for Claude's fixed SVG
        isValid: true,
        securityScore: 90,
        accessibilityScore: 85,
        optimizationScore: 80,
        designQualityScore: {
          colorHarmony: 85,
          composition: 80,
          visualWeight: 75,
          typography: 90,
          negativeSpace: 85,
          overallAesthetic: 83,
          technicalQuality: 85,
          designSuggestions: ['Suggestion 1', 'Suggestion 2'],
        },
      });

    const result = await agent['processResponse'](mockResponseContent, input);

    // Check if Claude's repair was used
    expect(result.success).toBe(true);
    expect(result.result?.svg).toContain('<title>Fixed Logo</title>');
    expect(result.result?.modifications).toContain(
      'Applied Claude-assisted repair with design enhancements'
    );
  });
});
