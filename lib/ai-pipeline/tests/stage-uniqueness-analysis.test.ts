import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeLogoUniqueness, UniquenessAnalysisInput } from '../stages/stage-uniqueness-analysis';

// Mock the AI service calls
vi.mock('@/lib/retry', () => ({
  callAIWithRetry: vi.fn().mockResolvedValue({
    content: [{ text: JSON.stringify({
      uniquenessScore: 82,
      analysis: {
        overallAssessment: "The logo is sufficiently unique for the technology industry.",
        uniqueElements: ["Custom typography", "Distinctive color palette"],
        potentialIssues: [],
        industryConventions: ["Use of blue color", "Modern minimalism"],
        differentiators: ["Unique icon design", "Custom letterform"]
      },
      similarLogos: [
        {
          companyName: "TechCorp",
          similarityScore: 30,
          similarElements: ["Similar color palette"]
        }
      ],
      recommendations: [
        {
          text: "Your logo is unique and should stand out in the industry.",
          severity: "info"
        }
      ]
    }) }],
    usage: {
      input_tokens: 300,
      output_tokens: 500
    }
  })
}));

describe('Stage: Uniqueness Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should analyze logo uniqueness successfully', async () => {
    // Test input
    const input: UniquenessAnalysisInput = {
      svg: '<svg>...</svg>',
      designSpec: {
        brand_name: 'TechStart',
        brand_description: 'A modern tech startup',
        style_preferences: 'Minimalist, modern',
        color_palette: 'Blue, gray',
        imagery: 'Abstract, geometric',
        target_audience: 'Tech professionals',
        additional_requests: 'Make it unique',
        industry: 'Technology'
      }
    };
    
    // Execute the function
    const result = await analyzeLogoUniqueness(input);
    
    // Verify results
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result?.uniquenessScore).toBe(82);
    expect(result.result?.analysis.overallAssessment).toBeDefined();
    expect(result.result?.similarLogos).toHaveLength(1);
    expect(result.result?.recommendations).toHaveLength(1);
    expect(result.tokensUsed).toBeDefined();
  });
});