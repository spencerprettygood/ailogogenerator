import { nanoid } from 'nanoid';
import { 
  Agent, 
  AgentContext, 
  AgentExecutionPlan, 
  AgentMap, 
  AgentMessage, 
  OrchestratorContext, 
  OrchestratorOptions, 
  OrchestratorResult, 
  ProgressUpdateCallback,
  AgentExecutionStage,
  AgentExecutionError,
  AgentRetryStrategy,
  AgentOutput
} from '../../types-agents';
import { LogoBrief, GenerationResult } from '../../types';
import { CacheManager } from '../../utils/cache-manager';
import { 
  RequirementsAgent,
  MoodboardAgent,
  SelectionAgent,
  SVGGenerationAgent,
  SVGValidationAgent,
  VariantGenerationAgent,
  GuidelineAgent,
  PackagingAgent,
  AnimationAgent
} from '../specialized';

/**
 * MultiAgentOrchestrator - Coordinates the execution of multiple specialized agents
 * 
 * This orchestrator manages the execution of a pipeline of specialized agents
 * for logo generation, handling dependencies, parallel execution, progress tracking,
 * error handling, and retry logic.
 */
export class MultiAgentOrchestrator {
  private agents: AgentMap = {};
  private context: OrchestratorContext;
  private options: OrchestratorOptions;
  private progressCallback?: ProgressUpdateCallback;
  private executingAgents: Set<string> = new Set();
  private completedAgents: Set<string> = new Set();
  private failedAgents: Set<string> = new Set();
  private agentRetryCount: Record<string, number> = {};
  private logs: string[] = [];
  private globalAbortController: AbortController;
  private cacheManager: CacheManager;
  
  /**
   * Creates a new MultiAgentOrchestrator
   * 
   * @param brief - The logo brief containing prompt and reference images
   * @param options - Configuration options for the orchestrator
   * @param progressCallback - Optional callback for progress updates
   */
  constructor(brief: LogoBrief, options?: Partial<OrchestratorOptions>, progressCallback?: ProgressUpdateCallback) {
    // Set default options
    this.options = {
      maxConcurrentAgents: 2,
      timeoutMs: 5 * 60 * 1000, // 5 minutes
      retryFailedAgents: true,
      maxRetries: 2,
      debugMode: process.env.NODE_ENV === 'development',
      retryStrategy: 'exponential-backoff',
      initialRetryDelayMs: 1000,
      ...options
    };
    
    // Initialize context
    this.context = {
      sessionId: nanoid(),
      brief,
      startTime: Date.now(),
      sharedMemory: new Map(),
      messageQueue: [],
      executionPlan: this.createExecutionPlan()
    };
    
    this.progressCallback = progressCallback;
    this.globalAbortController = new AbortController();
    
    // Get cache manager instance
    this.cacheManager = CacheManager.getInstance();
    
    // Initialize agent instances
    this.initializeAgents();
    
    // Initialize retry count for each agent
    Object.keys(this.agents).forEach(agentId => {
      this.agentRetryCount[agentId] = 0;
    });
  }
  
  /**
   * Initialize all agent instances
   */
  private initializeAgents(): void {
    // Create agent instances
    this.agents = {
      requirements: new RequirementsAgent(),
      moodboard: new MoodboardAgent(),
      selection: new SelectionAgent(),
      svgGeneration: new SVGGenerationAgent(),
      svgValidation: new SVGValidationAgent(),
      variantGeneration: new VariantGenerationAgent(),
      guideline: new GuidelineAgent(),
      packaging: new PackagingAgent(),
      animation: new AnimationAgent()
    };
    
    this.log('Initialized all agent instances');
  }
  
  /**
   * Create the execution plan for the agents
   */
  private createExecutionPlan(): AgentExecutionPlan {
    return {
      stages: [
        {
          id: 'stage-a',
          name: 'Requirements Analysis',
          agents: ['requirements'],
          dependencies: [],
          parallel: false,
          // Critical stage - if this fails, the whole pipeline fails
          critical: true,
          // Don't allow fallback for this stage
          allowFallback: false
        },
        {
          id: 'stage-b',
          name: 'Moodboard Generation',
          agents: ['moodboard'],
          dependencies: ['requirements'],
          parallel: false,
          critical: true,
          allowFallback: false
        },
        {
          id: 'stage-c',
          name: 'Concept Selection',
          agents: ['selection'],
          dependencies: ['requirements', 'moodboard'],
          parallel: false,
          critical: true,
          allowFallback: false
        },
        {
          id: 'stage-d',
          name: 'SVG Generation',
          agents: ['svgGeneration'],
          dependencies: ['requirements', 'selection'],
          parallel: false,
          critical: true,
          allowFallback: false
        },
        {
          id: 'stage-e',
          name: 'SVG Validation',
          agents: ['svgValidation'],
          dependencies: ['requirements', 'svgGeneration'],
          parallel: false,
          critical: true,
          allowFallback: false
        },
        {
          id: 'stage-f',
          name: 'Variant Generation',
          agents: ['variantGeneration'],
          dependencies: ['requirements', 'svgValidation'],
          parallel: false,
          critical: true,
          allowFallback: true
        },
        {
          id: 'stage-g',
          name: 'Brand Guidelines',
          agents: ['guideline'],
          dependencies: ['requirements', 'variantGeneration'],
          parallel: true,
          critical: false,
          allowFallback: true
        },
        {
          id: 'stage-h',
          name: 'Packaging',
          agents: ['packaging'],
          dependencies: ['requirements', 'svgValidation', 'variantGeneration', 'guideline'],
          parallel: false,
          critical: true,
          allowFallback: false
        },
        {
          id: 'stage-i',
          name: 'Animation',
          agents: ['animation'],
          dependencies: ['requirements', 'svgValidation'],
          parallel: true,
          critical: false,
          allowFallback: true
        }
      ]
    };
  }
  
  /**
   * Execute the multi-agent pipeline
   * @returns Promise resolving to the orchestration result
   */
  public async execute(): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const errors: AgentExecutionError[] = [];
    
    // Set up global timeout
    const timeoutId = setTimeout(() => {
      this.globalAbortController.abort('Global timeout exceeded');
      this.log('Global timeout exceeded, aborting execution');
    }, this.options.timeoutMs);
    
    try {
      this.log(`Starting multi-agent execution for session ${this.context.sessionId}`);
      
      // Initialize all agents with context
      await this.initializeAgentContexts();
      
      // Process the execution plan stage by stage
      for (const stage of this.context.executionPlan.stages) {
        // Check if execution has been aborted
        if (this.globalAbortController.signal.aborted) {
          throw new Error(`Execution aborted: ${this.globalAbortController.signal.reason}`);
        }
        
        this.log(`Starting stage ${stage.id} (${stage.name}) with agents: ${stage.agents.join(', ')}`);
        
        try {
          // Check if all dependencies are completed
          const missingDependencies = stage.dependencies.filter(dep => 
            !this.completedAgents.has(dep) &&
            !stage.agents.includes(dep) // The agent itself is not a dependency
          );
          
          if (missingDependencies.length > 0) {
            throw new Error(`Cannot execute stage ${stage.id}: missing dependencies: ${missingDependencies.join(', ')}`);
          }
          
          // Execute all agents in this stage
          if (stage.parallel && stage.agents.length > 1) {
            // Execute agents in parallel
            await this.executeAgentsInParallel(stage);
          } else {
            // Execute agents sequentially
            for (const agentId of stage.agents) {
              // Check if execution has been aborted before each agent
              if (this.globalAbortController.signal.aborted) {
                throw new Error(`Execution aborted: ${this.globalAbortController.signal.reason}`);
              }
              
              await this.executeAgentWithRetry(agentId, stage);
            }
          }
          
          // Process any messages generated during this stage
          await this.processMessageQueue();
          
          this.log(`Completed stage ${stage.id}`);
        } catch (error) {
          // Handle stage-level error
          const stageError: AgentExecutionError = {
            agentId: 'orchestrator',
            stageId: stage.id,
            message: error instanceof Error ? error.message : 'Unknown error in stage',
            details: error
          };
          
          errors.push(stageError);
          this.log(`Error in stage ${stage.id}: ${stageError.message}`);
          
          // For critical stages, fail the entire pipeline
          if (stage.critical) {
            throw new Error(`Critical stage ${stage.id} failed: ${stageError.message}`);
          }
          
          // For non-critical stages, log the error and continue
          this.log(`Non-critical stage ${stage.id} failed, continuing with pipeline`);
        }
      }
      
      // Create the final result
      const result = this.createFinalResult();
      
      const totalExecutionTime = Date.now() - startTime;
      this.log(`Multi-agent execution completed in ${totalExecutionTime}ms`);
      
      return {
        success: true,
        result,
        metrics: {
          totalExecutionTime,
          totalTokensUsed: this.calculateTotalTokensUsed(),
          agentMetrics: this.getAgentMetrics()
        },
        logs: this.options.debugMode ? this.logs : undefined
      };
    } catch (error) {
      const totalExecutionTime = Date.now() - startTime;
      
      this.log(`Multi-agent execution failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        metrics: {
          totalExecutionTime,
          totalTokensUsed: this.calculateTotalTokensUsed(),
          agentMetrics: this.getAgentMetrics()
        },
        logs: this.logs,
        errors: errors.length > 0 ? errors : [{
          agentId: 'orchestrator',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }]
      };
    } finally {
      // Clear the timeout
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Initialize all agents with context
   */
  private async initializeAgentContexts(): Promise<void> {
    const agentContext: AgentContext = {
      sessionId: this.context.sessionId,
      brief: this.context.brief,
      sharedMemory: this.context.sharedMemory,
      debugMode: this.options.debugMode,
      abortSignal: this.globalAbortController.signal
    };
    
    // Initialize each agent with context
    for (const [agentId, agent] of Object.entries(this.agents)) {
      await agent.initialize(agentContext);
      this.log(`Initialized agent ${agentId}`);
    }
  }
  
  /**
   * Execute an agent with retry logic
   * 
   * @param agentId - The ID of the agent to execute
   * @param stage - The stage information
   */
  private async executeAgentWithRetry(agentId: string, stage: AgentExecutionStage): Promise<void> {
    const agent = this.agents[agentId];
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    let lastError: Error | null = null;
    const maxRetries = this.options.maxRetries || 2;
    
    // Try execution with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // If this is a retry, wait according to the retry strategy
      if (attempt > 0) {
        this.log(`Retry attempt ${attempt}/${maxRetries} for agent ${agentId}`);
        
        const delayMs = this.calculateRetryDelay(attempt);
        this.log(`Waiting ${delayMs}ms before retrying...`);
        
        // Update progress with retry information
        this.updateProgress(
          agentId,
          agent,
          'retrying',
          0,
          `Retrying ${agentId} (attempt ${attempt}/${maxRetries})...`
        );
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      try {
        // Mark agent as executing
        this.executingAgents.add(agentId);
        this.agentRetryCount[agentId] = attempt;
        
        this.log(`Executing agent ${agentId}${attempt > 0 ? ` (attempt ${attempt}/${maxRetries})` : ''}`);
        
        // Update progress
        this.updateProgress(
          agentId,
          agent,
          'working',
          0,
          `${agentId} starting execution${attempt > 0 ? ` (attempt ${attempt}/${maxRetries})` : ''}...`
        );
        
        // Prepare input for the agent based on its type
        const input = await this.prepareAgentInput(agentId);
        
        // Execute the agent
        const output = await this.executeAgentWithTimeout(agent, input);
        
        // If execution failed
        if (!output.success) {
          this.log(`Agent ${agentId} execution failed: ${output.error?.message}`);
          
          // Update progress
          this.updateProgress(
            agentId,
            agent,
            'failed',
            0,
            `${agentId} execution failed: ${output.error?.message}`
          );
          
          // Store the error for potential retry
          lastError = new Error(`Agent ${agentId} failed: ${output.error?.message}`);
          
          // If we've reached max retries or retrying is disabled, mark as failed and throw
          if (attempt === maxRetries || !this.options.retryFailedAgents) {
            this.failedAgents.add(agentId);
            this.executingAgents.delete(agentId);
            
            throw lastError;
          }
          
          // Otherwise, continue to next retry attempt
          this.executingAgents.delete(agentId);
          continue;
        }
        
        // Store the output in shared memory
        this.context.sharedMemory.set(`${agentId}_output`, output);
        
        // Cache the intermediate result
        if (output.success && output.result) {
          this.cacheManager.cacheIntermediateResult(this.context.sessionId, agentId, output.result);
          this.log(`Cached intermediate result for ${agentId}`);
        }
        
        // Process any messages to be sent to other agents
        this.generateAgentMessages(agentId, output);
        
        // Mark agent as completed
        this.completedAgents.add(agentId);
        this.executingAgents.delete(agentId);
        
        // Update progress
        this.updateProgress(
          agentId,
          agent,
          'completed',
          100,
          `${agentId} completed successfully${attempt > 0 ? ` after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}` : ''}`
        );
        
        this.log(`Agent ${agentId} executed successfully${attempt > 0 ? ` after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}` : ''}`);
        
        // Successful execution, break out of retry loop
        return;
      } catch (error) {
        // Store the error for potential retry
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this is the last attempt, mark as failed
        if (attempt === maxRetries || !this.options.retryFailedAgents) {
          // Mark agent as failed
          this.failedAgents.add(agentId);
          this.executingAgents.delete(agentId);
          
          // Update progress
          this.updateProgress(
            agentId,
            agent,
            'failed',
            0,
            `${agentId} execution error: ${lastError.message}`
          );
          
          this.log(`Agent ${agentId} execution error after ${attempt + 1} ${attempt === 0 ? 'attempt' : 'attempts'}: ${lastError.message}`);
          
          // Check if stage allows fallback
          if (stage.allowFallback) {
            try {
              this.log(`Attempting fallback for agent ${agentId}`);
              
              // Execute fallback
              const fallbackResult = await this.executeFallback(agentId, stage);
              
              if (fallbackResult.success) {
                // Store the fallback output
                this.context.sharedMemory.set(`${agentId}_output`, fallbackResult);
                
                // Mark agent as completed
                this.completedAgents.add(agentId);
                
                // Update progress
                this.updateProgress(
                  agentId,
                  agent,
                  'completed',
                  100,
                  `${agentId} completed with fallback`
                );
                
                this.log(`Agent ${agentId} fallback succeeded`);
                return;
              } else {
                this.log(`Agent ${agentId} fallback failed: ${fallbackResult.error?.message}`);
                throw new Error(`Agent ${agentId} fallback failed: ${fallbackResult.error?.message}`);
              }
            } catch (fallbackError) {
              this.log(`Error in fallback for agent ${agentId}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
              throw lastError; // Throw the original error
            }
          } else {
            // No fallback available, throw the error
            throw lastError;
          }
        }
      }
    }
    
    // This should never happen, but just in case
    if (lastError) {
      throw lastError;
    }
  }
  
  /**
   * Execute an agent with a timeout
   * 
   * @param agent - The agent to execute
   * @param input - Input for the agent
   * @returns Promise resolving to agent output
   */
  private async executeAgentWithTimeout(agent: Agent, input: any): Promise<AgentOutput> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${this.options.timeoutMs}ms`));
      }, this.options.timeoutMs);
    });
    
    // Execute the agent
    try {
      // Race the agent execution against the timeout
      return await Promise.race([
        agent.execute(input),
        timeoutPromise
      ]);
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          details: error
        }
      };
    }
  }
  
  /**
   * Execute a fallback for a failed agent
   * 
   * @param agentId - The ID of the failed agent
   * @param stage - The stage information
   * @returns Promise resolving to agent output
   */
  private async executeFallback(agentId: string, stage: AgentExecutionStage): Promise<AgentOutput> {
    // Implement stage-specific fallbacks
    switch (agentId) {
      case 'variantGeneration': {
        // Simplified fallback for variant generation - create basic monochrome variants
        const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        
        if (!svgValidationOutput?.result?.svg) {
          throw new Error('Cannot execute fallback: missing validated SVG');
        }
        
        // Create simple monochrome variants
        const simplifiedVariants = {
          monochrome: {
            black: this.createMonochromeVariant(svgValidationOutput.result.svg, 'black'),
            white: this.createMonochromeVariant(svgValidationOutput.result.svg, 'white')
          },
          // Placeholder URLs for PNG variants
          pngVariants: {
            size256: '/api/download?file=logo-256.png',
            size512: '/api/download?file=logo-512.png',
            size1024: '/api/download?file=logo-1024.png'
          },
          // Simple favicon reference
          favicon: '/api/download?file=favicon.ico'
        };
        
        return {
          success: true,
          result: {
            variants: simplifiedVariants
          }
        };
      }
        
      case 'guideline': {
        // Very basic fallback for guidelines
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot execute fallback: missing design spec');
        }
        
        const brandName = requirementsOutput.result.designSpec.brand_name;
        
        // Generate minimal HTML guidelines
        const basicGuidelines = `
          <html>
            <head>
              <title>${brandName} Brand Guidelines</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
                .section { margin-bottom: 30px; }
              </style>
            </head>
            <body>
              <h1>${brandName} Brand Guidelines</h1>
              <div class="section">
                <h2>Logo Usage</h2>
                <p>Please maintain proper spacing around the logo and do not distort the proportions.</p>
              </div>
              <div class="section">
                <h2>Color Palette</h2>
                <p>Use the primary colors as shown in the logo.</p>
              </div>
              <div class="section">
                <h2>Typography</h2>
                <p>For consistency, use sans-serif fonts in marketing materials.</p>
              </div>
              <div class="section">
                <h2>Generated with AI Logo Generator</h2>
                <p>This is a simplified guideline document generated as a fallback.</p>
              </div>
            </body>
          </html>
        `;
        
        return {
          success: true,
          result: {
            html: basicGuidelines
          }
        };
      }
        
      default:
        throw new Error(`No fallback available for agent ${agentId}`);
    }
  }
  
  /**
   * Create a simple monochrome variant of an SVG
   * 
   * @param svg - The original SVG
   * @param color - The color to use ('black' or 'white')
   * @returns Monochrome SVG
   */
  private createMonochromeVariant(svg: string, color: 'black' | 'white'): string {
    // Replace all fill and stroke attributes with the specified color
    const colorValue = color === 'black' ? '#000000' : '#FFFFFF';
    const replacedSvg = svg
      .replace(/fill="[^"]*"/g, `fill="${colorValue}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${colorValue}"`)
      .replace(/<stop\s+[^>]*>/g, `<stop offset="0%" stop-color="${colorValue}" />`);
    
    return replacedSvg;
  }
  
  /**
   * Calculate retry delay based on the configured strategy
   * 
   * @param attempt - The current retry attempt (1-based)
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number): number {
    const initialDelay = this.options.initialRetryDelayMs || 1000;
    
    switch (this.options.retryStrategy) {
      case 'fixed':
        return initialDelay;
        
      case 'linear':
        return initialDelay * attempt;
        
      case 'exponential-backoff':
      default:
        // Exponential backoff with jitter: 2^(attempt-1) * initialDelay + random jitter
        const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
        return exponentialDelay + jitter;
    }
  }
  
  /**
   * Execute multiple agents in parallel
   * 
   * @param stage - The stage containing agents to execute in parallel
   */
  private async executeAgentsInParallel(stage: AgentExecutionStage): Promise<void> {
    const agentIds = stage.agents;
    this.log(`Executing ${agentIds.length} agents in parallel: ${agentIds.join(', ')}`);
    
    // Execute agents in parallel with retry
    const executions = agentIds.map(agentId => this.executeAgentWithRetry(agentId, stage));
    
    // Wait for all executions to complete
    await Promise.all(executions);
  }
  
  /**
   * Prepare input for a specific agent based on its type
   * 
   * @param agentId - The ID of the agent to prepare input for
   * @returns The prepared input
   */
  private async prepareAgentInput(agentId: string): Promise<any> {
    const brief = this.context.brief;
    
    // Create a unique ID for the input
    const inputId = `${agentId}-input-${nanoid(6)}`;
    
    // Check if we have a cached intermediate result for this stage
    const cachedResult = this.cacheManager.getIntermediateResult(this.context.sessionId, agentId);
    if (cachedResult) {
      this.log(`Using cached intermediate result for ${agentId}`);      
      return {
        id: inputId,
        ...cachedResult,
        fromCache: true
      };
    }
    
    switch (agentId) {
      case 'requirements': {
        return {
          id: inputId,
          brief: brief.prompt,
          imageDescriptions: brief.image_uploads?.map(file => `Image file: ${file.name}`)
        };
      }
        
      case 'moodboard': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare moodboard input: missing design spec from requirements agent');
        }
        
        return {
          id: inputId,
          designSpec: requirementsOutput.result.designSpec
        };
      }
        
      case 'selection': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const moodboardOutput = this.context.sharedMemory.get('moodboard_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare selection input: missing design spec from requirements agent');
        }
        
        if (!moodboardOutput?.result?.moodboard?.concepts) {
          throw new Error('Cannot prepare selection input: missing concepts from moodboard agent');
        }
        
        return {
          id: inputId,
          designSpec: requirementsOutput.result.designSpec,
          concepts: moodboardOutput.result.moodboard.concepts
        };
      }
        
      case 'svgGeneration': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const selectionOutput = this.context.sharedMemory.get('selection_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare SVG generation input: missing design spec from requirements agent');
        }
        
        if (!selectionOutput?.result?.selection?.selectedConcept) {
          throw new Error('Cannot prepare SVG generation input: missing selected concept from selection agent');
        }
        
        return {
          id: inputId,
          designSpec: requirementsOutput.result.designSpec,
          selectedConcept: selectionOutput.result.selection.selectedConcept
        };
      }
        
      case 'svgValidation': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const svgGenerationOutput = this.context.sharedMemory.get('svgGeneration_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare SVG validation input: missing design spec from requirements agent');
        }
        
        if (!svgGenerationOutput?.result?.svg) {
          throw new Error('Cannot prepare SVG validation input: missing SVG from generation agent');
        }
        
        return {
          id: inputId,
          svg: svgGenerationOutput.result.svg,
          brandName: requirementsOutput.result.designSpec.brand_name,
          repair: true,
          optimize: true
        };
      }
        
      case 'variantGeneration': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare variant generation input: missing design spec from requirements agent');
        }
        
        if (!svgValidationOutput?.result?.svg) {
          throw new Error('Cannot prepare variant generation input: missing validated SVG');
        }
        
        return {
          id: inputId,
          svg: svgValidationOutput.result.svg,
          designSpec: requirementsOutput.result.designSpec,
          brandName: requirementsOutput.result.designSpec.brand_name
        };
      }
        
      case 'guideline': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const variantGenerationOutput = this.context.sharedMemory.get('variantGeneration_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare guideline input: missing design spec from requirements agent');
        }
        
        if (!variantGenerationOutput?.result?.variants) {
          throw new Error('Cannot prepare guideline input: missing variants from variant generation agent');
        }
        
        return {
          id: inputId,
          variants: variantGenerationOutput.result.variants,
          designSpec: requirementsOutput.result.designSpec
        };
      }
        
      case 'packaging': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
        const variantGenerationOutput = this.context.sharedMemory.get('variantGeneration_output');
        const guidelineOutput = this.context.sharedMemory.get('guideline_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare packaging input: missing design spec from requirements agent');
        }
        
        if (!svgValidationOutput?.result?.svg) {
          throw new Error('Cannot prepare packaging input: missing validated SVG');
        }
        
        if (!variantGenerationOutput?.result?.variants) {
          throw new Error('Cannot prepare packaging input: missing variants from variant generation agent');
        }
        
        if (!guidelineOutput?.result?.html) {
          throw new Error('Cannot prepare packaging input: missing guidelines HTML');
        }
        
        return {
          id: inputId,
          brandName: requirementsOutput.result.designSpec.brand_name,
          svg: svgValidationOutput.result.svg,
          pngVariants: variantGenerationOutput.result.variants.pngVariants,
          monochrome: variantGenerationOutput.result.variants.monochrome,
          favicon: variantGenerationOutput.result.variants.favicon,
          guidelines: {
            html: guidelineOutput.result.html,
            plainText: '' // We're not generating plain text for now
          }
        };
      }
      
      case 'animation': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
        
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot prepare animation input: missing design spec from requirements agent');
        }
        
        if (!svgValidationOutput?.result?.svg) {
          throw new Error('Cannot prepare animation input: missing validated SVG');
        }
        
        return {
          id: inputId,
          svg: svgValidationOutput.result.svg,
          brandName: requirementsOutput.result.designSpec.brand_name,
          animationOptions: this.context.brief.animationOptions,
          autoSelectAnimation: !this.context.brief.animationOptions && this.context.brief.includeAnimations
        };
      }
        
      default:
        throw new Error(`Unknown agent type: ${agentId}`);
    }
  }
  
  /**
   * Generate messages to be sent to other agents based on output
   * 
   * @param agentId - The ID of the agent that generated the output
   * @param output - The agent's output
   */
  private generateAgentMessages(agentId: string, output: any): void {
    // Add a success message to the queue
    this.context.messageQueue.push({
      fromAgent: agentId,
      toAgent: 'all',
      messageType: 'update',
      payload: {
        status: 'completed',
        message: `Agent ${agentId} completed successfully`
      },
      timestamp: Date.now()
    });
    
    // For specific agents, add specialized messages
    switch (agentId) {
      case 'requirements': {
        // Notify other agents about the brand name and key requirements
        if (output.result?.designSpec) {
          const designSpec = output.result.designSpec;
          this.context.messageQueue.push({
            fromAgent: agentId,
            toAgent: 'all',
            messageType: 'brand_info',
            payload: {
              brandName: designSpec.brand_name,
              style: designSpec.style_preferences,
              colors: designSpec.color_palette
            },
            timestamp: Date.now()
          });
        }
        break;
      }
        
      case 'svgGeneration': {
        // Notify about SVG generation completion
        if (output.result?.svg) {
          this.context.messageQueue.push({
            fromAgent: agentId,
            toAgent: 'all',
            messageType: 'svg_preview',
            payload: {
              previewSvg: output.result.svg
            },
            timestamp: Date.now()
          });
        }
        break;
      }
    }
  }
  
  /**
   * Process the message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (this.context.messageQueue.length === 0) {
      return;
    }
    
    this.log(`Processing ${this.context.messageQueue.length} messages in queue`);
    
    // Process each message
    for (const message of this.context.messageQueue) {
      await this.processMessage(message);
    }
    
    // Clear the queue
    this.context.messageQueue = [];
  }
  
  /**
   * Process an individual message
   * 
   * @param message - The message to process
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    this.log(`Message from ${message.fromAgent} to ${message.toAgent}: ${message.messageType}`);
    
    // Handle broadcast messages
    if (message.toAgent === 'all') {
      // Broadcast to all agents
      this.log(`Broadcast message: ${JSON.stringify(message.payload)}`);
      
      // Special handling for svg_preview messages
      if (message.messageType === 'svg_preview' && this.progressCallback && message.payload.previewSvg) {
        // Send preview to client
        this.progressCallback({
          stage: this.getStageForAgent(message.fromAgent),
          agent: message.fromAgent,
          status: 'preview',
          progress: 50, // Arbitrary progress value
          message: 'SVG preview available',
          overallProgress: this.calculateOverallProgress(),
          preview: message.payload.previewSvg
        });
      }
      
      return;
    }
    
    // Handle directed messages
    const targetAgent = this.agents[message.toAgent];
    if (!targetAgent) {
      this.log(`Warning: Message targeted at unknown agent ${message.toAgent}`);
      return;
    }
    
    // In a more advanced implementation, agents would have a receiveMessage method
    // targetAgent.receiveMessage(message);
  }
  
  /**
   * Create the final result from all agent outputs
   * 
   * @returns The final generation result
   */
  private createFinalResult(): GenerationResult {
    // Extract results from each agent
    const requirementsOutput = this.context.sharedMemory.get('requirements_output');
    const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
    const variantGenerationOutput = this.context.sharedMemory.get('variantGeneration_output');
    const guidelineOutput = this.context.sharedMemory.get('guideline_output');
    const packagingOutput = this.context.sharedMemory.get('packaging_output');
    
    if (!svgValidationOutput?.result) {
      throw new Error('Missing SVG validation output in final result');
    }
    
    // Get brand name
    const brandName = requirementsOutput?.result?.designSpec?.brand_name;
    const animationOutput = this.context.sharedMemory.get('animation_output');
    
    // Build the final result object
    return {
      success: true,
      brandName,
      logoSvg: svgValidationOutput.result.svg,
      logoPngUrls: variantGenerationOutput?.result?.variants.pngVariants && {
        size256: '/api/download?file=logo-256.png',
        size512: '/api/download?file=logo-512.png',
        size1024: '/api/download?file=logo-1024.png'
      },
      monochromeVariants: variantGenerationOutput?.result?.variants.monochrome && {
        blackSvg: variantGenerationOutput.result.variants.monochrome.black,
        whiteSvg: variantGenerationOutput.result.variants.monochrome.white
      },
      faviconIcoUrl: '/api/download?file=favicon.ico',
      brandGuidelinesUrl: '/api/download?file=brand-guidelines.html',
      downloadUrl: packagingOutput?.result?.downloadUrl,
      
      // Include animation if available
      animatedSvg: animationOutput?.result?.animatedSvg,
      animationCss: animationOutput?.result?.cssCode,
      animationJs: animationOutput?.result?.jsCode
    };
  }
  
  /**
   * Update progress and send to callback if available
   * 
   * @param agentId - The ID of the agent
   * @param agent - The agent instance
   * @param status - The current status
   * @param progress - Progress percentage (0-100)
   * @param message - Status message
   */
  private updateProgress(
    agentId: string, 
    agent: Agent, 
    status: 'working' | 'completed' | 'failed' | 'retrying' | 'preview', 
    progress: number, 
    message: string
  ): void {
    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress();
    
    // Send to callback if available
    if (this.progressCallback) {
      this.progressCallback({
        stage: this.getStageForAgent(agentId),
        agent: agentId,
        status,
        progress,
        message,
        overallProgress
      });
    }
  }
  
  /**
   * Calculate the overall progress of the pipeline
   * 
   * @returns Progress percentage (0-100)
   */
  private calculateOverallProgress(): number {
    const totalAgents = Object.keys(this.agents).length;
    const completedAgents = this.completedAgents.size;
    const executingAgents = this.executingAgents.size;
    
    // Weight completed agents fully and executing agents partially
    const overallProgress = Math.round(
      ((completedAgents / totalAgents) * 100) + 
      ((executingAgents / totalAgents) * (50 / 100)) // Assume executing agents are ~50% complete on average
    );
    
    return Math.min(99, overallProgress); // Cap at 99% until fully complete
  }
  
  /**
   * Get the stage ID for a given agent
   * 
   * @param agentId - The agent ID
   * @returns The stage ID
   */
  private getStageForAgent(agentId: string): string {
    for (const stage of this.context.executionPlan.stages) {
      if (stage.agents.includes(agentId)) {
        return stage.id;
      }
    }
    return 'unknown';
  }
  
  /**
   * Calculate total tokens used across all agents
   * 
   * @returns Total token count
   */
  private calculateTotalTokensUsed(): number {
    let total = 0;
    
    for (const agent of Object.values(this.agents)) {
      total += agent.getMetrics().tokenUsage.total;
    }
    
    return total;
  }
  
  /**
   * Get metrics for all agents
   * 
   * @returns Record of agent metrics
   */
  private getAgentMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [agentId, agent] of Object.entries(this.agents)) {
      metrics[agentId] = {
        ...agent.getMetrics(),
        retryCount: this.agentRetryCount[agentId] || 0,
        completed: this.completedAgents.has(agentId),
        failed: this.failedAgents.has(agentId)
      };
    }
    
    return metrics;
  }
  
  /**
   * Log a message (internal)
   * 
   * @param message - The message to log
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    
    if (this.options.debugMode) {
      console.log(`[MultiAgentOrchestrator] ${message}`);
    }
  }
  
  /**
   * Abort the current execution
   * 
   * @param reason - The reason for aborting
   */
  public abort(reason: string = 'User requested abort'): void {
    if (!this.globalAbortController.signal.aborted) {
      this.globalAbortController.abort(reason);
      this.log(`Execution aborted: ${reason}`);
    }
  }
}