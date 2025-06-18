import { IndustryAnalysisAgent } from '../agents/specialized/industry-analysis-agent';
import { DesignSpec } from '../types';
import { IndustryAnalysisAgentInput, IndustryAnalysisAgentOutput } from '../types-agents';
import { retry } from '../retry';

/**
 * Service for handling industry analysis operations
 */
export class IndustryAnalysisService {
  private agent: IndustryAnalysisAgent;

  constructor() {
    this.agent = new IndustryAnalysisAgent({
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.3,
      maxTokens: 1000,
      retryConfig: {
        maxRetries: 2,
        initialDelay: 1000,
        backoffMultiplier: 1.5,
        maxDelay: 5000
      }
    });
  }

  /**
   * Analyze a logo design within its industry context
   * 
   * @param brandName - The name of the brand
   * @param industry - The industry the logo belongs to
   * @param designSpec - The design specification for the logo
   * @param svg - Optional SVG code for existing logo to analyze
   * @returns Industry analysis results
   */
  async analyzeIndustryContext(
    brandName: string,
    industry: string,
    designSpec: DesignSpec,
    svg?: string
  ): Promise<IndustryAnalysisAgentOutput> {
    if (!brandName || !industry) {
      return {
        success: false,
        error: {
          message: 'Brand name and industry are required for analysis'
        }
      };
    }

    try {
      const input: IndustryAnalysisAgentInput = {
        id: `industry-analysis-${Date.now()}`,
        brandName,
        industry,
        designSpec,
        svg
      };

      // Initialize the agent if not already
      if (!this.agent) {
        this.agent = new IndustryAnalysisAgent();
      }

      // Execute the analysis with retry logic
      const executeWithRetry = retry(this.agent.execute.bind(this.agent), {
        maxRetries: 2,
        initialDelay: 1000,
        backoffMultiplier: 1.5,
        maxDelay: 5000
      });

      const result = await executeWithRetry(input);
      
      return result;
    } catch (error) {
      console.error('Industry analysis failed:', error);
      
      return {
        success: false,
        error: {
          message: 'Failed to complete industry analysis',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Detect the likely industry for a brand based on its description and requirements
   * 
   * @param designSpec - The design specification containing brand details
   * @returns Detected industry and confidence score
   */
  async detectIndustry(designSpec: DesignSpec): Promise<{ industry: string; confidence: number }> {
    try {
      // Use a smaller model for fast industry detection
      const detectionAgent = new IndustryAnalysisAgent({
        model: 'claude-3-5-haiku-20240307',
        temperature: 0.1,
        maxTokens: 150
      });

      const input: IndustryAnalysisAgentInput = {
        id: `industry-detection-${Date.now()}`,
        brandName: designSpec.brand_name,
        industry: '', // We're trying to detect this
        designSpec
      };

      const result = await detectionAgent.execute(input);

      if (result.success && result.result) {
        return {
          industry: result.result.industryName,
          confidence: result.result.confidence || 0.7 // Default to moderate confidence
        };
      }

      // Fallback to generic industry if detection fails
      return {
        industry: 'General Business',
        confidence: 0.5
      };
    } catch (error) {
      console.error('Industry detection failed:', error);
      
      // Fallback to generic industry on error
      return {
        industry: 'General Business',
        confidence: 0.5
      };
    }
  }
}