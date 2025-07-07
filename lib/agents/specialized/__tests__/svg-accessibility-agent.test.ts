import { SVGAccessibilityAgent } from '../svg-accessibility-agent';
import { AgentContext, SVGValidationAgentInput } from '../../../types-agents';

// Sample SVG with poor accessibility
const poorAccessibilitySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="#cccccc" />
  <text x="50" y="55" font-size="10" fill="#dddddd">TC</text>
</svg>`;

// Mock for Claude service response
jest.mock('../../../services/claude-service', () => ({
  claudeService: {
    generateResponse: jest.fn().mockResolvedValue({
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Test Company Logo">
        <title>Test Company Logo</title>
        <desc>A circular logo for Test Company with improved contrast</desc>
        <circle cx="50" cy="50" r="40" fill="#0066cc" />
        <text x="50" y="55" font-size="1.2em" fill="#ffffff" text-anchor="middle">TC</text>
      </svg>`,
      tokensUsed: {
        input: 100,
        output: 200,
        total: 300,
      },
    }),
  },
}));

describe('SVGAccessibilityAgent', () => {
  let agent: SVGAccessibilityAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new SVGAccessibilityAgent();
    mockContext = {
      sessionId: 'test-session',
      brief: {
        brief: 'Create a logo for Test Company',
        brandName: 'Test Company',
        industry: 'Technology',
      },
      sharedMemory: new Map(),
    };
  });

  it('should initialize correctly', async () => {
    await agent.initialize(mockContext);
    expect(agent.getStatus()).toBe('idle');
  });

  it('should execute and improve SVG accessibility', async () => {
    await agent.initialize(mockContext);

    const input: SVGValidationAgentInput = {
      id: 'test-input',
      svg: poorAccessibilitySVG,
      brandName: 'Test Company',
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(true);
    expect(result.result?.svg).toBeDefined();
    expect(result.result?.accessibilityScore).toBeDefined();
    expect(result.result?.designFeedback).toBeDefined();
    expect(result.result?.accessibilityAssessment).toBeDefined();
  });

  it('should return meaningful accessibility feedback', async () => {
    await agent.initialize(mockContext);

    const input: SVGValidationAgentInput = {
      id: 'test-input',
      svg: poorAccessibilitySVG,
      brandName: 'Test Company',
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(true);
    expect(result.result?.designFeedback).toContain('accessibility');
    expect(result.result?.accessibilityAssessment?.accessibilitySuggestions.length).toBeGreaterThan(
      0
    );
  });

  it('should apply automated improvements when Claude does not improve the SVG', async () => {
    // Override mock to return the same SVG without improvements
    require('../../../services/claude-service').claudeService.generateResponse.mockResolvedValueOnce(
      {
        content: poorAccessibilitySVG,
        tokensUsed: {
          input: 100,
          output: 200,
          total: 300,
        },
      }
    );

    await agent.initialize(mockContext);

    const input: SVGValidationAgentInput = {
      id: 'test-input',
      svg: poorAccessibilitySVG,
      brandName: 'Test Company',
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(true);
    expect(result.result?.svg).not.toBe(poorAccessibilitySVG);
    expect(result.result?.svg).toContain('<title>');
    expect(result.result?.svg).toContain('role="img"');
  });

  it('should handle errors gracefully', async () => {
    // Override mock to throw an error
    require('../../../services/claude-service').claudeService.generateResponse.mockRejectedValueOnce(
      new Error('API Error')
    );

    await agent.initialize(mockContext);

    const input: SVGValidationAgentInput = {
      id: 'test-input',
      svg: 'invalid-svg',
      brandName: 'Test Company',
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
