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
  
  constructor(type: string, capabilities: AgentCapability[], config?: Partial<AgentConfig>) {
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
   * Execute the agent's core functionality
   */
  async execute(input: AgentInput): Promise<AgentOutput> {
    this.status = 'working';
    this.metrics.startTime = Date.now();
    
    try {
      // Generate the prompt for this specific task
      const prompt = await this.generatePrompt(input);
      
      // Determine which system prompt to use
      const systemPrompt = this.config.systemPromptOverride || this.systemPrompt;
      
      // Call Claude API with retry logic
      const result = await this.callWithRetry(prompt, systemPrompt);
      
      // Process the response
      const output = await this.processResponse(result.content, input);
      
      // Update metrics
      this.metrics.tokenUsage.input += result.tokensUsed.input;
      this.metrics.tokenUsage.output += result.tokensUsed.output;
      this.metrics.tokenUsage.total += result.tokensUsed.total;
      this.metrics.executionTime = Date.now() - this.metrics.startTime;
      this.metrics.endTime = Date.now();
      
      // Update status
      this.status = 'completed';
      
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
      
      // Log the error
      console.error(`Agent ${this.id} execution failed:`, error);
      
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
    let lastError: Error | null = null;
    const { maxRetries, initialDelay, backoffMultiplier, maxDelay } = this.config.retryConfig || {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    };
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Use specialized API call based on agent capabilities
        if (this.capabilities.includes('svg-generation')) {
          return await claudeService.generateSVG(prompt, systemPrompt);
        } else if (
          this.capabilities.includes('requirements-analysis') || 
          this.capabilities.includes('selection')
        ) {
          return await claudeService.analyze(prompt, systemPrompt);
        } else {
          return await claudeService.generateResponse(prompt, {
            systemPrompt,
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            stopSequences: this.config.stopSequences
          });
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.metrics.retryCount++;
        
        // If we've exhausted our retries, throw the last error
        if (attempt === maxRetries) throw lastError;
        
        // Calculate backoff delay
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw new Error('Retry attempts exhausted');
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