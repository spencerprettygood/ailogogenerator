/**
 * @file uniqueness-verification-agent.ts
 * @description Specialized agent for verifying logo uniqueness against existing designs
 */

import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput,
  UniquenessVerificationAgentInput,
  UniquenessVerificationAgentOutput,
  UniquenessVerificationResult
} from '../../types-agents';
import { handleError, ErrorCategory } from '../../utils/error-handler';
import { safeJsonParse } from '../../utils/json-utils';

/**
 * Agent that verifies logo uniqueness against existing designs
 */
export class UniquenessVerificationAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'uniqueness-verification', 
      ['uniqueness-verification'],
      {
        model: 'claude-3-5-sonnet-20240620',
        temperature: 0.2,
        maxTokens: 2000,
        ...config
      }
    );
    
    this.systemPrompt = `
# Logo Uniqueness Verification Task

## Your Task
Analyze the provided logo design and verify its uniqueness, ensuring it doesn't closely resemble existing designs or violate design principles that could lead to trademark conflicts.

1. Examine the logo's distinctive visual elements including:
   - Basic shapes and their arrangement
   - Color palette
   - Typography and letter styling
   - Negative space usage
   - Conceptual approach

2. Identify potential similarity issues with:
   - Common logo patterns in this industry
   - Generic or overused design elements
   - Recognizable logos from major brands
   - Design clichés specific to this industry
   
3. Provide a detailed assessment of uniqueness:
   - Assign a uniqueness score (0-100)
   - Identify specific similarity concerns if any
   - Rate the severity of any issues
   - Recommend specific modifications to increase uniqueness

## Output Format
Provide your analysis in JSON format with the following structure:
\`\`\`json
{
  "isUnique": boolean,
  "uniquenessScore": number, // 0-100
  "similarityIssues": [
    {
      "description": "string",
      "severity": "low" | "medium" | "high",
      "elementType": "shape" | "color" | "typography" | "composition" | "concept",
      "recommendations": ["string"]
    }
  ],
  "recommendations": ["string"]
}
\`\`\`

## Guidelines for Assessment
- Score 90-100: Highly unique, distinctive, and unlikely to have conflicts
- Score 70-89: Mostly unique with some common elements but still distinctive
- Score 50-69: Moderately unique but uses several common design approaches
- Score 30-49: Limited uniqueness with many industry clichés
- Score 0-29: Highly generic or too similar to existing designs

## Important Notes
- Focus on objective visual and conceptual similarities
- Prioritize trademark and brand recognition concerns
- Consider industry context when evaluating uniqueness
- Be specific about which elements reduce uniqueness
- Provide actionable recommendations for improvement
`;
  }

  protected async generatePrompt(input: UniquenessVerificationAgentInput): Promise<string> {
    const { logo, industry, brandName, existingLogos } = input;
    
    // Extract logo SVG code for analysis
    const svgCode = logo.svgCode;
    
    // Prepare existing logos for comparison if available
    let existingLogosSection = '';
    if (existingLogos && existingLogos.length > 0) {
      existingLogosSection = `
## Existing Logos for Comparison
${existingLogos.map((existing: { svgCode: string }, index: number) => `
### Logo ${index + 1}
\`\`\`svg
${existing.svgCode.substring(0, 500)}... (truncated)
\`\`\`
`).join('\n')}
`;
    }

    const prompt = `
## Context
- Brand Name: "${brandName}"
- Industry: "${industry || 'Not specified'}"
- Logo SVG: 
\`\`\`svg
${svgCode}
\`\`\`

${existingLogosSection}

Please perform the uniqueness verification task based on the instructions in the system prompt.
`;

    return prompt;
  }

  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<UniquenessVerificationAgentOutput> {
    const parsedResult = safeJsonParse(responseContent);

    if (!parsedResult || typeof parsedResult !== 'object') {
      return {
        success: false,
        error: handleError({
          error: 'Invalid JSON response from AI. The response was not a valid object.',
          category: ErrorCategory.API,
          details: { responseContent },
          retryable: true,
        }),
      };
    }

    // Validate required fields
    if (typeof parsedResult.isUnique !== 'boolean' || 
        typeof parsedResult.uniquenessScore !== 'number' ||
        !Array.isArray(parsedResult.similarityIssues) ||
        !Array.isArray(parsedResult.recommendations)) {
      return {
        success: false,
        error: handleError({
          error: 'AI response has invalid structure. Missing or incorrect type for required fields.',
          category: ErrorCategory.API,
          details: { parsedResult },
          retryable: true,
        }),
      };
    }

    // Validate uniqueness score range
    if (parsedResult.uniquenessScore < 0 || parsedResult.uniquenessScore > 100) {
      return {
        success: false,
        error: handleError({
          error: 'Invalid uniqueness score. Score must be between 0 and 100.',
          category: ErrorCategory.API,
          details: { uniquenessScore: parsedResult.uniquenessScore },
          retryable: true,
        }),
      };
    }

    this.log('Successfully processed uniqueness verification result.');
    return {
      success: true,
      result: parsedResult as UniquenessVerificationResult,
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}