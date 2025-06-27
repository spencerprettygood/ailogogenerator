import { IndustryAnalysisAgent } from '../agents/specialized/industry-analysis-agent';
import { DesignSpec } from '../types';
import { IndustryAnalysisAgentInput, IndustryAnalysisAgentOutput } from '../types-agents';
import { withRetry } from '../retry';
import { Logger } from '../utils/logger';

/**
 * Service for handling industry analysis operations
 */
export class IndustryAnalysisService {
  private agent: IndustryAnalysisAgent;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('IndustryAnalysisService');
    
    this.agent = new IndustryAnalysisAgent({
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.3,
      maxTokens: 1000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000
      }
    });
    
    this.logger.info('IndustryAnalysisService initialized');
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
    this.logger.info('Starting industry context analysis', { brandName, industry });
    
    if (!brandName || !industry) {
      this.logger.warn('Analysis rejected: Missing required parameters', { brandName, industry });
      return {
        success: false,
        error: {
          message: 'Brand name and industry are required for analysis',
          code: 'MISSING_PARAMETERS'
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
        this.logger.info('Initializing IndustryAnalysisAgent');
        this.agent = new IndustryAnalysisAgent();
      }

      // Execute the analysis with retry logic
      this.logger.debug('Executing industry analysis with retry logic');
      
      const result = await withRetry(
        () => this.agent.execute(input),
        {
          maxRetries: 3,
          initialDelay: 1000,
          backoffMultiplier: 2,
          maxDelay: 10000
        }
      );
      
      this.logger.info('Industry analysis completed successfully', { 
        brandName, 
        industry, 
        success: result.success 
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Industry analysis failed', { 
        brandName, 
        industry, 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: {
          message: 'Failed to complete industry analysis',
          details: errorMessage,
          code: 'ANALYSIS_FAILURE'
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
    this.logger.info('Starting industry detection', { brandName: designSpec.brand_name });
    
    try {
      const input: IndustryAnalysisAgentInput = {
        id: 'industry-detection',
        brandName: designSpec.brand_name,
        industry: designSpec.industry || '',
        designSpec: designSpec,
      };

      const agent = new IndustryAnalysisAgent();

      const output = await agent.execute(input);

      if (output.success && output.result) {
        return {
          industry: output.result.industryName,
          confidence: output.result.confidence,
        };
      }

      this.logger.warn('Industry detection failed, returning default.');
      return { industry: 'Unknown', confidence: 0 };

    } catch (error) {
      this.logger.error('Error in detectIndustry', { error });
      return { industry: 'Unknown', confidence: 0 };
    }
  }
}