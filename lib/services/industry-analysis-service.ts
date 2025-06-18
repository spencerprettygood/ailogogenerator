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
        maxAttempts: 3,
        baseDelay: 1000,
        backoffFactor: 1.5,
        maxDelay: 5000
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
          maxAttempts: 3,
          baseDelay: 1000,
          backoffFactor: 1.5,
          maxDelay: 5000
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
      // Use a smaller model for fast industry detection
      this.logger.debug('Initializing detection agent with Haiku model');
      
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

      this.logger.debug('Executing industry detection');
      
      const result = await withRetry(
        () => detectionAgent.execute(input),
        {
          maxAttempts: 2,
          baseDelay: 500,
          backoffFactor: 1.5,
          maxDelay: 2000
        }
      );

      if (result.success && result.result) {
        this.logger.info('Industry detection successful', { 
          brandName: designSpec.brand_name,
          detectedIndustry: result.result.industryName,
          confidence: result.result.confidence || 0.7
        });
        
        return {
          industry: result.result.industryName,
          confidence: result.result.confidence || 0.7 // Default to moderate confidence
        };
      }

      // Fallback to generic industry if detection fails
      this.logger.warn('Industry detection failed to produce valid result, using fallback', {
        brandName: designSpec.brand_name
      });
      
      return {
        industry: 'General Business',
        confidence: 0.5
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Industry detection failed with error', { 
        brandName: designSpec.brand_name,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback to generic industry on error
      return {
        industry: 'General Business',
        confidence: 0.5
      };
    }
  }
}