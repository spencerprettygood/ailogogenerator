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
import { safeJsonParse } from '../../utils/json-utils';

/**
 * Specialized agent for analyzing logos within a specific industry
 * to determine uniqueness and adherence to industry conventions.
 */
export class IndustryAnalysisAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super('industry-analysis', ['industry-analysis'], {
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.4, // Slightly higher for more creative analysis
      maxTokens: 2048, // Increased to handle detailed analysis
      ...config,
    });

    this.systemPrompt = `You are a senior brand strategist and design analyst.
Your task is to conduct a comprehensive analysis of a given industry's design landscape, evaluate competitor logos, and provide actionable recommendations for a new brand.
Your analysis must be thorough, data-driven, and presented in a structured JSON format.`;
  }

  protected async generatePrompt(input: IndustryAnalysisAgentInput): Promise<string> {
    const { brandName, industry, designSpec, context } = input;

    // Context can be used to provide external data, like web search results
    const externalDataContext = context?.externalData ? `
## External Context & Research
${JSON.stringify(context.externalData, null, 2)}
` : '';

    const prompt = `
# Industry Logo Analysis Task

## Primary Inputs
- **Brand Name:** "${brandName}"
- **Industry:** "${industry}"
- **Design Specifications:** ${JSON.stringify(designSpec, null, 2)}

${externalDataContext}

## Your Task
Based on the provided inputs and any external context, perform the following analysis:
1.  **Analyze Competitors:** Identify 5-7 key competitors. For each, describe their logo, dominant colors, style, and key visual elements.
2.  **Identify Trends:** Detail the most prevalent design trends in the "${industry}" sector. Assess their prevalence and relevance to this project.
3.  **Provide Recommendations:** Offer specific, actionable design recommendations to ensure the new logo is both unique and appropriate for the industry.
4.  **Score the Opportunity:** Provide a "uniqueness" score and a "convention" score (0-100) to quantify the design challenge. A high uniqueness score means there is a lot of room for differentiation. A high convention score means there are strong, established visual norms.
5.  **Synthesize:** Write a brief analysis of the balance between uniqueness and convention for this specific project.

## Output Format
Provide your complete analysis in a single, valid JSON object enclosed in \`\`\`json tags. The structure must be as follows:

\`\`\`json
{
  "industryName": "${industry}",
  "confidence": number, // 0-1 confidence in your understanding of the industry based on the input.
  "competitorLogos": [
    {
      "companyName": "string",
      "logoDescription": "string",
      "dominantColors": ["string"],
      "styleCategory": "string", // e.g., "Minimalist", "Geometric", "Organic", "Vintage"
      "visualElements": ["string"] // e.g., "Abstract mark", "Wordmark", "Emblem"
    }
  ],
  "industryTrends": [
    {
      "name": "string", // e.g., "Use of Negative Space", "Gradient Overlays"
      "description": "string",
      "prevalence": number, // 0-100, how common is this trend?
      "examples": ["string"], // Names of companies exemplifying this trend
      "relevance": number // 0-100, how relevant is this trend for the current brief?
    }
  ],
  "designRecommendations": [
    "string"
  ],
  "uniquenessScore": number, // 0-100: How much opportunity is there to be unique?
  "conventionScore": number, // 0-100: How strong are the industry conventions?
  "balanceAnalysis": "string" // A summary of the challenge, e.g., 'The industry is highly conventional, suggesting a strategy of subtle innovation...'
}
\`\`\`
`;

    return prompt;
  }

  protected async processResponse(
    responseContent: string,
    originalInput: AgentInput,
  ): Promise<IndustryAnalysisAgentOutput> {
    const parsed = safeJsonParse(responseContent);

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: {
          message: 'Invalid JSON response from AI. The response was not a valid object.',
          details: responseContent,
          retryable: true,
        },
      };
    }

    // Basic validation for key fields
    const requiredFields = [
      'industryName',
      'competitorLogos',
      'industryTrends',
      'designRecommendations',
      'uniquenessScore',
      'conventionScore',
      'balanceAnalysis',
    ];

    const missingFields = requiredFields.filter(field => !(field in parsed));

    if (missingFields.length > 0) {
      return {
        success: false,
        error: {
          message: `AI response is missing required fields: ${missingFields.join(', ')}`,
          details: parsed,
          retryable: true,
        },
      };
    }

    // Further validation can be added here (e.g., checking array types, score ranges)

    return {
      success: true,
      result: parsed as IndustryAnalysisAgentOutput['result'], // Type assertion after validation
      tokensUsed: this.metrics.tokenUsage.total,
      processingTime: this.metrics.executionTime,
    };
  }
}