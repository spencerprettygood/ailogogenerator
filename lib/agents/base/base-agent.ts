import { nanoid } from 'nanoid';
import { 
  Agent, 
  AgentCapability, 
  AgentConfig, 
  AgentContext, 
  AgentInput, 
  AgentMetrics, 
  AgentOutput, 
  AgentStatus 
} from '../../types-agents';
import { claudeService } from '../../services/claude-service';
import { withRetry } from '../../retry';

/**
 * Abstract base agent class that provides common functionality for all agents
 */
export abstract class BaseAgent implements Agent {
  id: string;
  type: string;
  capabilities: AgentCapability[];
  status: AgentStatus = 'idle';
  metrics: AgentMetrics = {
    tokenUsage: {
      input: 0,
      output: 0,
      total: 0
    },
    executionTime: 0,
    retryCount: 0,
    startTime: 0,
    endTime: 0
  };
  config: AgentConfig;
  protected context?: AgentContext;
  protected systemPrompt: string = '';
  private progressCallback?: (percent: number, message: string) => void;
  
  constructor(type: string, capabilities: AgentCapability[] = [], config?: Partial<AgentConfig>) {
    this.id = `${type}-${nanoid(6)}`;
    this.type = type;
    this.capabilities = capabilities;
    
    // Default configuration
    this.config = {
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.7,
      maxTokens: 1024,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000
      },
      ...config
    };
  }
  
  /**
   * Initialize the agent with context data
   */
  async initialize(context: AgentContext): Promise<void> {
    this.context = context;
    this.status = 'idle';
    this.metrics = {
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      },
      executionTime: 0,
      retryCount: 0,
      startTime: 0,
      endTime: 0
    };
    
    // Set progress callback if provided in context
    if (context.progressCallback) {
      this.progressCallback = context.progressCallback;
    }
    
    // Allow derived classes to perform additional initialization
    await this.onInitialize();
  }
  
  /**
   * Hook for derived classes to perform additional initialization
   */
  protected async onInitialize(): Promise<void> {
    // To be implemented by derived classes
  }
  
  /**
   * Set a progress callback function to report progress updates
   */
  setProgressCallback(callback: (percent: number, message: string) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Log a message and optionally a status
   * This will also be sent to the progress callback if available
   */
  protected log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    const logMessage = `[${this.type}] ${message}`;
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
        break;
    }

    if (this.progressCallback) {
      // Using a convention: -1 for log messages without a specific percentage
      this.progressCallback(-1, message);
    }
  }
  
  /**
   * Report progress of the agent's execution
   * 
   * @param percent - Percentage of completion (0-100)
   * @param message - Status message describing current progress
   */
  protected reportProgress(percent: number, message: string): void {
    // Update agent status based on progress
    if (percent === 100) {
      this.status = 'completed';
    } else if (percent === 0 && message.toLowerCase().includes('fail')) {
      this.status = 'failed';
    } else {
      this.status = 'working';
    }
    
    // Log progress for debugging
    console.log(`[${this.type}] Progress: ${percent}% - ${message}`);
    
    // Call progress callback if available
    if (this.progressCallback) {
      try {
        this.progressCallback(percent, message);
      } catch (error) {
        console.error(`Error in progress callback: ${error}`);
      }
    }
  }
  
  /**
   * Execute the agent's core functionality
   */
  async execute(input: AgentInput): Promise<AgentOutput> {
    this.status = 'working';
    this.metrics.startTime = Date.now();
    
    try {
      // Report initial progress
      this.reportProgress(5, 'Starting execution...');
      
      // Generate the prompt for this specific task
      this.reportProgress(10, 'Generating prompt...');
      const prompt = await this.generatePrompt(input);
      
      let result = {
        content: '',
        tokensUsed: { input: 0, output: 0, total: 0 }
      };

      // If a prompt is generated, call the AI model. Otherwise, skip to processing.
      if (prompt) {
        this.reportProgress(15, 'Generated prompt, preparing AI call...');
        // Determine which system prompt to use
        const systemPrompt = this.config.systemPromptOverride || this.systemPrompt;
        
        // Call Claude API with retry logic
        this.reportProgress(20, 'Calling AI model...');
        result = await this.callWithRetry(prompt, systemPrompt);
        this.reportProgress(60, 'Received response from AI model...');
      } else {
        this.reportProgress(60, 'Skipping AI model call, proceeding with local processing...');
      }
      
      // Process the response
      this.reportProgress(70, 'Processing response...');
      const output = await this.processResponse(result.content, input);
      
      // Update metrics
      this.metrics.tokenUsage.input += result.tokensUsed.input;
      this.metrics.tokenUsage.output += result.tokensUsed.output;
      this.metrics.tokenUsage.total += result.tokensUsed.total;
      this.metrics.executionTime = Date.now() - this.metrics.startTime;
      this.metrics.endTime = Date.now();
      
      // Update status and report completion
      this.status = 'completed';
      this.reportProgress(100, 'Execution completed successfully');
      
      // Return the processed output along with metrics
      return {
        ...output,
        tokensUsed: result.tokensUsed.total,
        processingTime: this.metrics.executionTime
      };
    } catch (error) {
      this.status = 'failed';
      this.metrics.endTime = Date.now();
      this.metrics.executionTime = this.metrics.endTime - this.metrics.startTime;
      
      // Log the error and report failure
      console.error(`Agent ${this.id} execution failed:`, error);
      this.reportProgress(0, `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Return error output
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        tokensUsed: this.metrics.tokenUsage.total,
        processingTime: this.metrics.executionTime
      };
    }
  }
  
  /**
   * Call the Claude API with retry logic
   */
  private async callWithRetry(prompt: string, systemPrompt: string) {
    const { maxRetries, initialDelay, backoffMultiplier, maxDelay } = this.config.retryConfig || {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    };
    
    // Setup retry configuration
    const retryConfig = {
      maxAttempts: maxRetries,
      baseDelay: initialDelay,
      backoffFactor: backoffMultiplier,
      maxDelay: maxDelay
    };
    
    // Use the withRetry utility
    try {
      return await withRetry(async () => {
        // Create request options with fallback models
        const requestOptions = {
          systemPrompt,
          model: this.config.model,
          fallbackModels: this.config.fallbackModels,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          stopSequences: this.config.stopSequences
        };
      
        // Use specialized API call based on agent capabilities
        if (this.capabilities.includes('svg-generation')) {
          return await claudeService.generateSVG(prompt, systemPrompt, requestOptions);
        } else if (
          this.capabilities.includes('requirements-analysis') || 
          this.capabilities.includes('selection')
        ) {
          return await claudeService.analyze(prompt, systemPrompt, requestOptions);
        } else {
          return await claudeService.generateResponse(prompt, requestOptions);
        }
      }, retryConfig);
    } catch (error) {
      // Increment retry count in metrics
      this.metrics.retryCount = retryConfig.maxAttempts - 1;
      throw error;
    }
  }
  
  /**
   * Record token usage metrics
   * 
   * @param inputTokens - Number of input tokens used
   * @param outputTokens - Number of output tokens used
   * @param totalTokens - Total number of tokens used (if not provided, calculated as inputTokens + outputTokens)
   */
  protected recordTokenUsage(inputTokens: number, outputTokens: number, totalTokens?: number): void {
    this.metrics.tokenUsage.input += inputTokens;
    this.metrics.tokenUsage.output += outputTokens;
    this.metrics.tokenUsage.total += totalTokens || (inputTokens + outputTokens);
  }
  
  /**
   * Get the current status of the agent
   */
  getStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * Get the metrics for this agent's execution
   */
  getMetrics(): AgentMetrics {
    return this.metrics;
  }
  
  /**
   * Abstract methods to be implemented by derived agent classes
   */
  protected abstract generatePrompt(input: AgentInput): Promise<string>;
  protected abstract processResponse(responseContent: string, originalInput: AgentInput): Promise<AgentOutput>;
}