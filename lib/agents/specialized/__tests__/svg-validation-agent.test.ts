import { SVGValidationAgent } from '../svg-validation-agent';
import { SVGValidator } from '../../../utils/svg-validator';
import { InputSanitizer } from '../../../utils/security-utils';

// Mock dependencies
jest.mock('../../../utils/svg-validator');
jest.mock('../../../utils/security-utils');

describe('SVGValidationAgent', () => {
  let agent: SVGValidationAgent;
  
  // Sample SVG for testing
  const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <title>Test Logo</title>
    <rect width="100" height="100" fill="blue" />
  </svg>`;
  
  const invalidSvg = `<svg width="300" height="300">
    <script>alert('XSS')</script>
    <rect width="100" height="100" fill="blue" />
  </svg>`;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Create agent instance for testing
    agent = new SVGValidationAgent({
      model: 'claude-3-5-haiku-20240307',
      temperature: 0.1,
      maxTokens: 1000
    });
    
    // Mock SVGValidator methods
    (SVGValidator.validate as jest.Mock).mockImplementation((svg) => {
      if (svg.includes('<script>')) {
        return {
          isValid: false,
          issues: [
            {
              type: 'security',
              severity: 'critical',
              message: 'Contains disallowed element: script',
              autoFixable: true
            }
          ],
          securityScore: 0,
          accessibilityScore: 50,
          optimizationScore: 70,
          fileSize: svg.length
        };
      } else {
        return {
          isValid: true,
          issues: [],
          securityScore: 100,
          accessibilityScore: 90,
          optimizationScore: 85,
          fileSize: svg.length
        };
      }
    });
    
    (SVGValidator.repair as jest.Mock).mockImplementation((svg) => {
      const repairedSvg = svg.replace(/<script>.*?<\/script>/g, '');
      return {
        original: svg,
        repaired: repairedSvg,
        fileSize: {
          before: svg.length,
          after: repairedSvg.length
        },
        issuesFixed: [
          {
            type: 'security',
            severity: 'critical',
            message: 'Removed disallowed element: script',
            autoFixable: true
          }
        ],
        issuesRemaining: []
      };
    });
    
    (SVGValidator.optimize as jest.Mock).mockImplementation((svg) => {
      const optimizedSvg = svg.replace(/\s+/g, ' ').trim();
      return {
        original: svg,
        optimized: optimizedSvg,
        fileSize: {
          before: svg.length,
          after: optimizedSvg.length,
          savings: 10
        },
        optimizations: ['Removed unnecessary whitespace']
      };
    });
    
    (SVGValidator.process as jest.Mock).mockImplementation((svg) => {
      const processed = svg
        .replace(/<script>.*?<\/script>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return {
        original: svg,
        processed,
        validation: SVGValidator.validate(svg),
        repair: SVGValidator.repair(svg),
        optimization: SVGValidator.optimize(svg.replace(/<script>.*?<\/script>/g, '')),
        overallScore: 85,
        success: !svg.includes('<script>')
      };
    });
    
    // Mock InputSanitizer methods for backward compatibility
    (InputSanitizer.validateSVG as jest.Mock).mockImplementation((svg) => {
      return {
        isValid: !svg.includes('<script>'),
        errors: svg.includes('<script>') ? ['Contains script tag'] : [],
        warnings: []
      };
    });
    
    (InputSanitizer.cleanSVG as jest.Mock).mockImplementation((svg) => {
      return svg.replace(/<script>.*?<\/script>/g, '');
    });
  });
  
  it('should successfully validate a valid SVG', async () => {
    const input = {
      id: 'test',
      svg: validSvg,
      brandName: 'TestBrand',
      repair: false,
      optimize: false
    };
    
    const output = await agent.execute(input);
    
    expect(output.success).toBe(true);
    expect(output.result?.isValid).toBe(true);
    expect(output.result?.securityScore).toBe(100);
    expect(output.result?.accessibilityScore).toBe(90);
    expect(output.result?.optimizationScore).toBe(85);
    expect(SVGValidator.validate).toHaveBeenCalledWith(validSvg);
  });
  
  it('should repair an invalid SVG', async () => {
    const input = {
      id: 'test',
      svg: invalidSvg,
      brandName: 'TestBrand',
      repair: true,
      optimize: false
    };
    
    const output = await agent.execute(input);
    
    expect(output.success).toBe(true);
    expect(output.result?.isValid).toBe(true);
    expect(output.result?.modifications).toContain('Fixed critical security issue: Removed disallowed element: script');
    expect(SVGValidator.repair).toHaveBeenCalledWith(invalidSvg);
  });
  
  it('should optimize an SVG when requested', async () => {
    const input = {
      id: 'test',
      svg: validSvg,
      brandName: 'TestBrand',
      repair: false,
      optimize: true
    };
    
    const output = await agent.execute(input);
    
    expect(output.success).toBe(true);
    expect(output.result?.optimizationResults).toBeDefined();
    expect(output.result?.modifications).toContain('Removed unnecessary whitespace');
    expect(SVGValidator.optimize).toHaveBeenCalled();
  });
  
  it('should process SVG with both repair and optimization', async () => {
    const input = {
      id: 'test',
      svg: invalidSvg,
      brandName: 'TestBrand',
      repair: true,
      optimize: true
    };
    
    const output = await agent.execute(input);
    
    expect(output.success).toBe(true);
    expect(output.result?.isValid).toBe(true);
    expect(output.result?.overallScore).toBe(85);
    expect(SVGValidator.process).toHaveBeenCalledWith(invalidSvg);
  });
  
  it('should return error for invalid SVG when repair is not requested', async () => {
    const input = {
      id: 'test',
      svg: invalidSvg,
      brandName: 'TestBrand',
      repair: false,
      optimize: false
    };
    
    const output = await agent.execute(input);
    
    expect(output.success).toBe(false);
    expect(output.error?.message).toBe('SVG validation failed');
    expect(output.error?.details).toContain('CRITICAL: Contains disallowed element: script');
  });
  
  it('should use Claude response for complex repairs when needed', async () => {
    // Mock the processResponse method to simulate Claude fixing an SVG
    const claudeResponse = `Here's the fixed SVG:
    
    \`\`\`svg
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <title>Test Logo</title>
      <desc>A blue rectangle logo</desc>
      <rect width="100" height="100" fill="blue" />
    </svg>
    \`\`\``;
    
    // Setup a special case where automatic repair fails
    (SVGValidator.process as jest.Mock).mockImplementationOnce((svg) => {
      return {
        original: svg,
        processed: svg, // Simulating no change
        validation: {
          isValid: false,
          issues: [
            {
              type: 'structure',
              severity: 'critical',
              message: 'Complex structural issue',
              autoFixable: false
            }
          ],
          securityScore: 50,
          accessibilityScore: 40,
          optimizationScore: 30,
          fileSize: svg.length
        },
        repair: {
          original: svg,
          repaired: svg, // No repair happened
          fileSize: {
            before: svg.length,
            after: svg.length
          },
          issuesFixed: [],
          issuesRemaining: [
            {
              type: 'structure',
              severity: 'critical',
              message: 'Complex structural issue',
              autoFixable: false
            }
          ]
        },
        overallScore: 40,
        success: false
      };
    });
    
    // Mock Claude's validation of the fixed SVG
    (SVGValidator.validate as jest.Mock).mockImplementationOnce(() => {
      return {
        isValid: false,
        issues: [
          {
            type: 'structure',
            severity: 'critical',
            message: 'Complex structural issue',
            autoFixable: false
          }
        ],
        securityScore: 50,
        accessibilityScore: 40,
        optimizationScore: 30,
        fileSize: invalidSvg.length
      };
    }).mockImplementationOnce(() => {
      return {
        isValid: true,
        issues: [],
        securityScore: 100,
        accessibilityScore: 100,
        optimizationScore: 90,
        fileSize: claudeResponse.length
      };
    });
    
    const input = {
      id: 'test',
      svg: invalidSvg,
      brandName: 'TestBrand',
      repair: true,
      optimize: true
    };
    
    // Mock the generatePrompt method to avoid actual API calls
    jest.spyOn(agent as any, 'generatePrompt').mockResolvedValue('mock prompt');
    jest.spyOn(agent as any, 'processResponse').mockImplementationOnce(
      async (response: string, originalInput: any) => {
        // Call the original method with our simulated Claude response
        return (agent as any).processResponse.bind(agent)(claudeResponse, originalInput);
      }
    );
    
    const output = await agent.execute(input);
    
    expect(output.success).toBe(true);
    expect(output.result?.modifications).toContain('Applied advanced Claude-based SVG repair');
  });
});