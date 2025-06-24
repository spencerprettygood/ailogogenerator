import { BaseAgent } from '../base/base-agent';
import { withRetry } from '../../retry';
import { 
  AgentCapability, 
  AgentConfig, 
  AgentContext, 
  AgentInput, 
  IndustryAnalysisAgentInput, 
  IndustryAnalysisAgentOutput,
  CompetitorLogo,
  IndustryTrend
} from '../../types-agents';
import { DesignSpec } from '../../types';
import { WebSearchService } from '../../services/web-search-service';
import { ErrorCategory, handleError } from '../../utils/error-handler';

/**
 * Specialized agent for analyzing logos within a specific industry
 * to determine uniqueness and adherence to industry conventions.
 */
export class IndustryAnalysisAgent extends BaseAgent {
  private webSearchService: WebSearchService | null = null;
  
  constructor(config?: AgentConfig) {
    super({
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.3,
      maxTokens: 1000,
      ...config
    });

    this.type = 'industry-analysis';
    this.capabilities = ['industry-analysis'];
    
    // Initialize web search service if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        this.webSearchService = new WebSearchService();
      } catch (error) {
        handleError(error, {
          category: ErrorCategory.EXTERNAL,
          context: {
            component: 'IndustryAnalysisAgent',
            operation: 'constructor'
          },
          logLevel: 'warn'
        });
      }
    }
  }

  protected async preparePrompt(input: IndustryAnalysisAgentInput): Promise<string> {
    const { brandName, industry, designSpec, svg } = input;
    
    // Try to enhance analysis with web search if available
    let industryResearch = '';
    let awardWinningLogos = '';
    
    if (this.webSearchService) {
      try {
        // Search for industry design trends
        const designTrends = await this.webSearchService.searchDesignTrends(industry || 'general');
        
        if (designTrends.success && designTrends.results.length > 0) {
          industryResearch = `
## Current Industry Design Research
${designTrends.results.slice(0, 5).map(result => `
### ${result.title}
Source: ${result.domain}
${result.snippet || 'No preview available.'}
`).join('\n')}
`;
        }
        
        // Search for award-winning logos in this industry
        const awardLogos = await this.webSearchService.searchAwardWinningLogos(industry || 'general');
        
        if (awardLogos.success && awardLogos.results.length > 0) {
          awardWinningLogos = `
## Award-Winning Logo Examples
${awardLogos.results.slice(0, 5).map(result => `
### ${result.title}
Source: ${result.domain}
${result.snippet || 'No preview available.'}
`).join('\n')}
`;
        }
      } catch (error) {
        handleError(error, {
          category: ErrorCategory.EXTERNAL,
          context: {
            component: 'IndustryAnalysisAgent',
            operation: 'preparePrompt',
            industry
          },
          logLevel: 'warn'
        });
      }
    }

    const prompt = `
# Industry Logo Analysis Task

## Context
- Brand Name: "${brandName}"
- Industry: "${industry}"
- Design Specifications: ${JSON.stringify(designSpec, null, 2)}
${svg ? `- Existing Logo SVG: ${svg.substring(0, 500)}... (truncated)` : ''}

${industryResearch}

${awardWinningLogos}

## Your Task
1. Analyze the most common logo design trends in the ${industry} industry
2. Identify key competitors in this space and describe their logo designs
3. Extract common visual elements, color schemes, and style patterns
4. Evaluate how unique vs. conventional the proposed design would be
5. Provide specific recommendations to balance uniqueness with industry recognition

## Output Format
Provide your analysis in JSON format with the following structure:
\`\`\`json
{
  "industryName": "string",
  "confidence": number, // 0-1 confidence in industry classification
  "competitorLogos": [
    {
      "companyName": "string",
      "logoDescription": "string",
      "dominantColors": ["string"],
      "styleCategory": "string",
      "visualElements": ["string"]
    }
  ],
  "industryTrends": [
    {
      "name": "string",
      "description": "string",
      "prevalence": number, // 0-100 indicating how common this trend is
      "examples": ["string"],
      "relevance": number // 0-100 how relevant for this brief
    }
  ],
  "designRecommendations": ["string"],
  "uniquenessScore": number, // 0-100 score of how unique the logo would be
  "conventionScore": number, // 0-100 score of how well it follows industry conventions
  "balanceAnalysis": "string" // Analysis of uniqueness vs. convention balance
}
\`\`\`

## Notes
- For competitor logos, focus on 5-7 major players in the industry
- Consider both global and regional competitors when relevant
- For color analysis, use common color names and hex codes when possible
- For style categorization, use standard design terminology (minimalist, 3D, vintage, etc.)
- Balance your recommendations between standing out and fitting in with industry expectations
- Incorporate insights from the design research and award-winning examples provided
`;

    return prompt;
  }

  async execute(input: AgentInput): Promise<IndustryAnalysisAgentOutput> {
    const typedInput = input as IndustryAnalysisAgentInput;
    
    if (!typedInput.brandName || !typedInput.industry) {
      return {
        success: false,
        error: {
          message: 'Missing required input: brandName and industry are required'
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
      const parsedResult = JSON.parse(jsonString);

      // Validate the result has the required fields
      if (!this.validateResult(parsedResult)) {
        throw new Error('Industry analysis result is missing required fields');
      }

      this.status = 'completed';
      
      return {
        success: true,
        result: parsedResult,
        tokensUsed: this.metrics.tokenUsage.total
      };
    } catch (error) {
      this.status = 'failed';
      
      return {
        success: false,
        error: {
          message: `Industry analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        }
      };
    }
  }

  private validateResult(result: any): boolean {
    const requiredFields = [
      'industryName',
      'competitorLogos',
      'industryTrends',
      'designRecommendations',
      'uniquenessScore',
      'conventionScore'
    ];

    return requiredFields.every(field => field in result);
  }
}