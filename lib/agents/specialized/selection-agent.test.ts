/**
 * Test file for SelectionAgent JSON parsing and sanitization
 * This file tests the robustness of our JSON parsing fixes
 */

import { SelectionAgent } from './selection-agent';

describe('SelectionAgent JSON Sanitization', () => {
  let agent: SelectionAgent;

  beforeEach(() => {
    agent = new SelectionAgent();
  });

  // Test cases for various malformed JSON scenarios
  const testCases = [
    {
      name: 'JSON with control characters',
      input: `{
  "selection": {
    "selectedConcept": {
      "name": "Modern\x08Logo",
      "description": "A clean\x00modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept\x0Bworks well",
    "score": 85
  }
}`,
      shouldWork: true
    },
    {
      name: 'JSON with unescaped newlines',
      input: `{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean
modern design with
multiple lines",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept
works well for the brand",
    "score": 85
  }
}`,
      shouldWork: true
    },
    {
      name: 'JSON with markdown code blocks',
      input: `\`\`\`json
{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept works well",
    "score": 85
  }
}
\`\`\``,
      shouldWork: true
    },
    {
      name: 'JSON with trailing commas',
      input: `{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract",
    },
    "selectionRationale": "This concept works well",
    "score": 85,
  },
}`,
      shouldWork: true
    },
    {
      name: 'JSON with extra text before and after',
      input: `Here is my analysis of the concepts:

{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept works well",
    "score": 85
  }
}

This is the best choice for the brand.`,
      shouldWork: true
    },
    {
      name: 'Completely malformed text',
      input: `I think the best concept is the modern one because it has good colors and style. The description says it's clean and minimal which works well for the target audience. I would score this about 85 out of 100.`,
      shouldWork: false // This should trigger fallback parsing
    }
  ];

  testCases.forEach(testCase => {
    test(`should handle: ${testCase.name}`, async () => {
      // Access the private method for testing
      const sanitizeMethod = (agent as any).sanitizeJsonString.bind(agent);
      
      if (testCase.shouldWork) {
        // Should not throw an error
        expect(() => {
          const sanitized = sanitizeMethod(testCase.input);
          JSON.parse(sanitized); // Should parse successfully
        }).not.toThrow();
      } else {
        // Should throw an error, triggering fallback
        expect(() => {
          const sanitized = sanitizeMethod(testCase.input);
          JSON.parse(sanitized);
        }).toThrow();
      }
    });
  });

  test('should extract data using fallback parsing', async () => {
    const fallbackInput = `I analyzed the concepts and selected concept 1 which is called "Modern Logo" with a clean, minimal design. The colors are blue (#0066CC) and the style is modern. This was selected because it best matches the brand requirements and target audience. I would rate this selection at 85 out of 100.`;
    
    // Access the private method for testing
    const fallbackMethod = (agent as any).extractSelectionDataFallback.bind(agent);
    const result = fallbackMethod(fallbackInput);
    
    expect(result).toBeDefined();
    expect(result.selection).toBeDefined();
    expect(result.selection.selectedConcept).toBeDefined();
    expect(result.selection.selectionRationale).toBeDefined();
    expect(result.selection.score).toBeDefined();
  });

  test('should handle completely empty response', async () => {
    const mockInput = {
      designSpec: {
        brand_name: 'Test Brand',
        brand_description: 'Test Description',
        style_preferences: 'modern',
        color_palette: 'blue',
        imagery: 'abstract',
        target_audience: 'professionals',
        additional_requests: 'none',
        industry: 'tech'
      },
      concepts: [
        {
          name: 'Test Concept',
          description: 'Test Description',
          style: 'modern',
          colors: ['#0066CC'],
          imagery: 'abstract'
        }
      ]
    };

    // Access the private method for testing
    const processMethod = (agent as any).processResponse.bind(agent);
    
    // Should not throw but should return a fallback response
    const result = await processMethod('', mockInput);
    
    expect(result).toBeDefined();
    expect(result.result).toBeDefined();
    expect(result.result.selection).toBeDefined();
    expect(result.result.selection.selectedConcept).toBeDefined();
  });
});
