/**
 * @file uniqueness-verification-agent.ts
 * @description Specialized agent for verifying logo uniqueness against existing designs
 */

import { BaseAgent } from '../base/base-agent';
import { withRetry } from '../../retry';
import { 
  AgentCapability, 
  AgentConfig, 
  AgentInput
} from '../../types-agents';
import { SVGLogo } from '../../types';
import { ErrorCategory, handleError } from '../../utils/error-handler';

/**
 * Interface for uniqueness verification input
 */
export interface UniquenessVerificationInput extends AgentInput {
  logo: SVGLogo;
  industry?: string;
  brandName: string;
  existingLogos?: SVGLogo[];
}

/**
 * Interface for uniqueness verification results
 */
export interface UniquenessVerificationResult {
  isUnique: boolean;
  uniquenessScore: number; // 0-100
  similarityIssues: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    elementType: 'shape' | 'color' | 'typography' | 'composition' | 'concept';
    recommendations: string[];
  }[];
  recommendations: string[];
}

/**
 * Interface for uniqueness verification output
 */
export interface UniquenessVerificationOutput {
  success: boolean;
  result?: UniquenessVerificationResult;
  error?: {
    message: string;
    details?: any;
  };
  tokensUsed?: number;
}

/**
 * Agent that verifies logo uniqueness against existing designs
 */
export class UniquenessVerificationAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super({
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.2,
      maxTokens: 2000,
      ...config
    });

    this.type = 'uniqueness-verification';
    this.capabilities = ['uniqueness-verification'];
  }

  protected async preparePrompt(input: UniquenessVerificationInput): Promise<string> {
    const { logo, industry, brandName, existingLogos } = input;
    
    // Extract logo SVG code for analysis
    const svgCode = logo.svgCode;
    
    // Prepare existing logos for comparison if available
    let existingLogosSection = '';
    if (existingLogos && existingLogos.length > 0) {
      existingLogosSection = `
## Existing Logos for Comparison
${existingLogos.map((existing, index) => `
### Logo ${index + 1}
\`\`\`svg
${existing.svgCode.substring(0, 500)}... (truncated)
\`\`\`
`).join('\n')}
`;
    }

    const prompt = `
# Logo Uniqueness Verification Task

## Context
- Brand Name: "${brandName}"
- Industry: "${industry || 'Not specified'}"
- Logo SVG: 
\`\`\`svg
${svgCode}
\`\`\`

${existingLogosSection}

## Your Task
Analyze the provided logo design and verify its uniqueness, ensuring it doesn't closely resemble existing logos or violate design principles that could lead to trademark conflicts.

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

    return prompt;
  }

  async execute(input: AgentInput): Promise<UniquenessVerificationOutput> {
    const typedInput = input as UniquenessVerificationInput;
    
    // Validate input
    if (!typedInput.logo || !typedInput.logo.svgCode) {
      return {
        success: false,
        error: {
          message: 'Missing required input: logo SVG is required'
        }
      };
    }

    try {
      this.status = 'working';
      
      const prompt = await this.preparePrompt(typedInput);
      
      const response = await withRetry(
        () => this.executePrompt(prompt),
        {
          maxAttempts: this.config.retryConfig?.maxAttempts || 3,
          baseDelay: this.config.retryConfig?.baseDelay || 1000,
          backoffFactor: this.config.retryConfig?.backoffFactor || 1.5,
          maxDelay: this.config.retryConfig?.maxDelay || 5000
        }
      );

      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/{[\s\S]*}/) ||
                        null;
                        
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON response from model');
      }

      const jsonString = jsonMatch[1] || jsonMatch[0];
      const parsedResult = JSON.parse(jsonString) as UniquenessVerificationResult;

      // Validate the result has the required fields
      if (!this.validateResult(parsedResult)) {
        throw new Error('Uniqueness verification result is missing required fields');
      }

      this.status = 'completed';
      
      return {
        success: true,
        result: parsedResult,
        tokensUsed: this.metrics.tokenUsage.total
      };
    } catch (error) {
      this.status = 'failed';
      
      handleError(error, {
        category: ErrorCategory.AI,
        context: {
          agent: 'UniquenessVerificationAgent',
          operation: 'execute',
          brandName: typedInput.brandName
        }
      });
      
      return {
        success: false,
        error: {
          message: `Uniqueness verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        }
      };
    }
  }

  private validateResult(result: any): boolean {
    // Check for required fields
    const requiredFields = [
      'isUnique',
      'uniquenessScore',
      'similarityIssues',
      'recommendations'
    ];

    const hasRequiredFields = requiredFields.every(field => field in result);
    
    // Validate types
    const typesValid = 
      typeof result.isUnique === 'boolean' &&
      typeof result.uniquenessScore === 'number' &&
      Array.isArray(result.similarityIssues) &&
      Array.isArray(result.recommendations);
      
    // Validate score range
    const scoreValid = result.uniquenessScore >= 0 && result.uniquenessScore <= 100;
    
    return hasRequiredFields && typesValid && scoreValid;
  }
}