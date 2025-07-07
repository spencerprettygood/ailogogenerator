import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { analyzeClaudeError, ClaudeErrorType } from '../../utils/claude-error-handler';
import {
  Agent,
  AgentContext,
  AgentExecutionPlan,
  AgentExecutionStageConfig,
  AgentMap,
  AgentMessage,
  OrchestratorContext,
  OrchestratorOptions,
  OrchestratorResult,
  AgentExecutionStage,
  AgentExecutionError,
  AgentRetryStrategy,
  AgentOutput,
} from '../../types-agents';
import { LogoBrief, GenerationResult, PipelineProgress } from '../../types';
import { CacheManager } from '../../utils/cache-manager';
import { BaseAgent } from '../base/base-agent';
import {
  RequirementsAgent,
  MoodboardAgent,
  SelectionAgent,
  SVGGenerationAgent,
  SVGValidationAgent,
  VariantGenerationAgent,
  GuidelineAgent,
  PackagingAgent,
  AnimationAgent,
} from '../specialized';

/**
 * MultiAgentOrchestrator - Coordinates the execution of a pipeline of specialized agents
 * for logo generation.
 */
export class MultiAgentOrchestrator extends EventEmitter {
  private agents: AgentMap = {};
  private context: OrchestratorContext;
  private options: OrchestratorOptions;
  private executingAgents: Set<string> = new Set();
  private completedAgents: Set<string> = new Set();
  private failedAgents: Set<string> = new Set();
  private successfulAgents: Set<string> = new Set();
  private agentRetryCount: Record<string, number> = {};
  private logs: { timestamp: number; message: string; level: 'info' | 'warn' | 'error' }[] = [];
  private globalAbortController: AbortController;
  private cacheManager: CacheManager;

  constructor(brief: LogoBrief, options?: Partial<OrchestratorOptions>, progressCallback?: (progress: any) => void) {
    super();
    this.options = {
      maxConcurrentAgents: 2,
      timeoutMs: 5 * 60 * 1000, // 5 minutes
      retryFailedAgents: true,
      maxRetries: 2,
      debugMode: process.env.NODE_ENV === 'development',
      retryStrategy: 'exponential-backoff',
      initialRetryDelayMs: 1000,
      cacheTTLSeconds: 60 * 60, // 1 hour default
      useCache: true, // Default to using cache
      ...options,
    };

    this.context = {
      sessionId: nanoid(),
      brief,
      startTime: Date.now(),
      sharedMemory: new Map(),
      messageQueue: [],
      executionPlan: this.createExecutionPlan(),
      designSpec: undefined, // Will be populated by RequirementsAgent
    };

    this.globalAbortController = new AbortController();
    this.cacheManager = CacheManager.getInstance();

    this.initializeAgents();

    Object.keys(this.agents).forEach(agentId => {
      this.agentRetryCount[agentId] = 0;
    });

    // Set up progress callback if provided
    if (progressCallback) {
      this.on('progress', progressCallback);
    }
  }

  public async start(): Promise<void> {
    this.log(`Orchestration started for session ${this.context.sessionId}`);
    try {
      const finalResult = await this.executePipeline();
      this.emit('complete', finalResult);
      this.log(`Orchestration completed successfully for session ${this.context.sessionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(
        `Orchestration failed for session ${this.context.sessionId}: ${errorMessage}`,
        'error'
      );
      this.emit('error', error);
    }
  }

  /**
   * Execute method for compatibility with test expectations
   */
  public async execute(): Promise<OrchestratorResult> {
    this.log(`Orchestration started for session ${this.context.sessionId}`);
    
    try {
      // Initialize all agents
      await this.initializeAllAgents();
      
      // Execute the pipeline
      const result = await this.executePipeline();
      
      this.log(`Orchestration completed successfully for session ${this.context.sessionId}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(
        `Orchestration failed for session ${this.context.sessionId}: ${errorMessage}`,
        'error'
      );
      
      // Return error result
      return {
        success: false,
        result: {},
        metrics: {
          totalExecutionTime: Date.now() - this.context.startTime,
          totalTokensUsed: 0,
          agentMetrics: {},
        },
        logs: this.logs.map(log => log.message),
        errors: [{
          agentId: 'orchestrator',
          message: errorMessage,
          details: error,
        }],
      };
    }
  }

  /**
   * Abort the orchestration process
   */
  public abort(reason?: string): void {
    const abortReason = reason || 'Execution aborted by user';
    this.log(`Aborting orchestration: ${abortReason}`, 'warn');
    this.globalAbortController.abort(abortReason);
  }

  /**
   * Initialize all agents
   */
  private async initializeAllAgents(): Promise<void> {
    const agentPromises = Object.values(this.agents).map(agent => {
      if (typeof agent.initialize === 'function') {
        return agent.initialize();
      }
      return Promise.resolve();
    });
    
    await Promise.all(agentPromises);
  }

  private emitProgress(update: Partial<PipelineProgress>): void {
    this.emit('progress', update);
  }

  private emitTestProgress(stage: string, agent: string, status: string): void {
    // This is for test compatibility based on what the test expects
    this.emit('progress', {
      stage,
      agent,
      status,
    });
  }

  private getStageForAgent(agentId: string): string {
    // Simple mapping logic, can be expanded
    return agentId.replace('Agent', '').toLowerCase();
  }

  private async handleMessage(message: AgentMessage): Promise<void> {
    this.log(
      `Received message from ${message.fromAgent} to ${message.toAgent} of type ${message.messageType}`
    );
    if (message.payload.progress) {
      this.emitProgress({
        ...message.payload.progress,
        currentStage: this.getStageForAgent(message.fromAgent),
      });
    }
    // ... other message handling logic
  }

  private async executePipeline(): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const results: Record<string, any> = {};
    const agentMetrics: Record<string, any> = {};
    const logs: string[] = [];
    const errors: AgentExecutionError[] = [];
    let totalTokensUsed = 0;

    try {
      // Initialize pipeline
      this.emitProgress({
        status: 'generating',
        progress: 10,
        message: 'Initializing agents',
        currentStage: 'initialization',
        stageProgress: 100,
      });

      logs.push(`Pipeline started for session ${this.context.sessionId}`);

      // Get execution plan
      const executionPlan = this.context.executionPlan;
      const totalStages = executionPlan.length;

      // Execute stages in sequence
      for (let stageIndex = 0; stageIndex < totalStages; stageIndex++) {
        const stage = executionPlan[stageIndex];
        if (!stage) continue;

        const progress = 10 + ((stageIndex + 1) / totalStages) * 80;
        
        this.emitProgress({
          status: 'generating',
          progress,
          message: `Executing ${stage.name}`,
          currentStage: stage.id,
          stageProgress: 0,
        });

        logs.push(`Starting stage: ${stage.name} (${stage.id})`);

        try {
          // Execute agents in this stage
          for (let agentIndex = 0; agentIndex < stage.agents.length; agentIndex++) {
            const agentName = stage.agents[agentIndex];
            if (!agentName) continue;

            const agent = this.agents[agentName];
            if (!agent) {
              const error: AgentExecutionError = {
                agentId: agentName,
                stageId: stage.id,
                message: `Agent ${agentName} not found`,
              };
              errors.push(error);
              
              if (stage.critical && !stage.allowFallback) {
                throw new Error(`Critical agent ${agentName} not found`);
              }
              continue;
            }

            const agentProgress = (agentIndex / stage.agents.length) * 100;
            this.emitProgress({
              status: 'generating',
              progress,
              message: `Executing ${agentName}`,
              currentStage: stage.id,
              stageProgress: agentProgress,
            });

            logs.push(`Executing agent: ${agentName}`);

            // Check for abort signal
            if (this.globalAbortController.signal.aborted) {
              throw new Error(`Execution aborted: ${this.globalAbortController.signal.reason || 'Unknown reason'}`);
            }

            // Emit test-compatible progress
            this.emitTestProgress(
              `stage-${String.fromCharCode(97 + stageIndex)}`, // stage-a, stage-b, etc.
              agentName.replace('Agent', '').toLowerCase(),
              'working'
            );

            // Create input for the agent
            const agentInput = this.createAgentInput(agentName, results);
            
            // Execute the agent
            const result = await agent.execute(agentInput);
            
            // Track metrics
            const metrics = agent.getMetrics();
            agentMetrics[agentName] = metrics;
            totalTokensUsed += metrics.tokenUsage.total;

            if (result.success && result.result) {
              // Store results for subsequent agents
              results[agentName] = result.result;
              logs.push(`Agent ${agentName} completed successfully`);

              // Emit test-compatible completion progress
              this.emitTestProgress(
                `stage-${String.fromCharCode(97 + stageIndex)}`,
                agentName.replace('Agent', '').toLowerCase(),
                'completed'
              );
            } else {
              const error: AgentExecutionError = {
                agentId: agentName,
                stageId: stage.id,
                message: result.error?.message || 'Agent execution failed',
                details: result.error,
              };
              errors.push(error);

              if (stage.critical && !stage.allowFallback) {
                throw new Error(`Critical agent ${agentName} failed: ${result.error?.message}`);
              }
              
              logs.push(`Agent ${agentName} failed: ${result.error?.message}`);
            }
          }

          // Complete stage
          this.emitProgress({
            status: 'generating',
            progress,
            message: `Completed ${stage.name}`,
            currentStage: stage.id,
            stageProgress: 100,
          });

          logs.push(`Completed stage: ${stage.name}`);

        } catch (stageError) {
          const error: AgentExecutionError = {
            agentId: 'unknown',
            stageId: stage.id,
            message: stageError instanceof Error ? stageError.message : 'Stage execution failed',
            details: stageError,
          };
          errors.push(error);

          if (stage.critical) {
            throw stageError;
          }
          
          logs.push(`Stage ${stage.name} failed: ${error.message}`);
        }
      }

      // Complete pipeline
      this.emitProgress({
        status: 'completed',
        progress: 100,
        message: 'Pipeline completed successfully',
        currentStage: 'complete',
        stageProgress: 100,
      });

      const executionTime = Date.now() - startTime;
      logs.push(`Pipeline completed in ${executionTime}ms`);

      return {
        success: true,
        result: results,
        metrics: {
          totalExecutionTime: executionTime,
          totalTokensUsed,
          agentMetrics,
        },
        logs,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      this.emitProgress({
        status: 'error',
        progress: 0,
        message: `Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentStage: 'error',
        stageProgress: 0,
      });

      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logs.push(`Pipeline failed: ${errorMessage}`);
      
      const finalError: AgentExecutionError = {
        agentId: 'orchestrator',
        message: errorMessage,
        details: error,
      };
      errors.push(finalError);

      return {
        success: false,
        result: results,
        metrics: {
          totalExecutionTime: executionTime,
          totalTokensUsed,
          agentMetrics,
        },
        logs,
        errors,
      };
    }
  }

  private createAgentInput(agentName: string, previousResults: Record<string, any>): any {
    // Create appropriate input based on agent type and previous results
    const baseInput = {
      id: `${agentName}-${Date.now()}`,
    };

    switch (agentName) {
      case 'RequirementsAgent':
        return {
          ...baseInput,
          brief: this.context.brief.prompt || '',
        };

      case 'MoodboardAgent':
        return {
          ...baseInput,
          designSpec: previousResults.RequirementsAgent?.designSpec || this.context.designSpec,
        };

      case 'SelectionAgent':
        return {
          ...baseInput,
          designSpec: previousResults.RequirementsAgent?.designSpec || this.context.designSpec,
          concepts: previousResults.MoodboardAgent?.moodboard?.concepts || [],
        };

      case 'SVGGenerationAgent':
        return {
          ...baseInput,
          designSpec: previousResults.RequirementsAgent?.designSpec || this.context.designSpec,
          selectedConcept: previousResults.SelectionAgent?.selection?.selectedConcept,
        };

      case 'SVGValidationAgent':
        return {
          ...baseInput,
          svg: previousResults.SVGGenerationAgent?.svg || '',
          brandName: this.context.brief.brandName || 'Brand',
        };

      case 'VariantGenerationAgent':
        return {
          ...baseInput,
          designSpec: previousResults.RequirementsAgent?.designSpec || this.context.designSpec,
          brandName: this.context.brief.brandName || 'Brand',
        };

      case 'GuidelineAgent':
        return {
          ...baseInput,
          variants: previousResults.VariantGenerationAgent?.variants || {},
          designSpec: previousResults.RequirementsAgent?.designSpec || this.context.designSpec,
        };

      case 'PackagingAgent':
        return {
          ...baseInput,
          brandName: this.context.brief.brandName || 'Brand',
          svg: previousResults.SVGGenerationAgent?.svg || '',
          pngVariants: previousResults.VariantGenerationAgent?.variants?.pngVariants || {},
          monochrome: previousResults.VariantGenerationAgent?.variants?.monochrome || {},
          favicon: previousResults.VariantGenerationAgent?.variants?.favicon || {},
          guidelines: previousResults.GuidelineAgent || { html: '', plainText: '' },
        };

      case 'AnimationAgent':
        return {
          ...baseInput,
          svg: previousResults.SVGGenerationAgent?.svg || '',
          designSpec: previousResults.RequirementsAgent?.designSpec || this.context.designSpec,
          animationOptions: {
            type: 'fade_in',
            duration: 1000,
            easing: 'ease-in-out',
            delay: 0,
          },
        };

      default:
        return baseInput;
    }
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logEntry = {
      timestamp: Date.now(),
      message: `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`,
      level,
    };
    this.logs.push(logEntry);

    if (this.options.debugMode) {
      switch (level) {
        case 'info':
          console.log(logEntry.message);
          break;
        case 'warn':
          console.warn(logEntry.message);
          break;
        case 'error':
          console.error(logEntry.message);
          break;
      }
    }
  }

  private initializeAgents(): void {
    this.agents = {
      RequirementsAgent: new RequirementsAgent(),
      MoodboardAgent: new MoodboardAgent(),
      SelectionAgent: new SelectionAgent(),
      SVGGenerationAgent: new SVGGenerationAgent(),
      SVGValidationAgent: new SVGValidationAgent(),
      VariantGenerationAgent: new VariantGenerationAgent(),
      GuidelineAgent: new GuidelineAgent(),
      PackagingAgent: new PackagingAgent(),
      AnimationAgent: new AnimationAgent(),
    };
  }

  private createExecutionPlan(): AgentExecutionStageConfig[] {
    return [
      { 
        id: 'analysis',
        name: 'Requirements Analysis',
        agents: ['RequirementsAgent'],
        dependencies: [],
        parallel: false,
        critical: true,
        allowFallback: false
      },
      {
        id: 'conceptualization-moodboard',
        name: 'Moodboard Generation',
        agents: ['MoodboardAgent'],
        dependencies: ['analysis'],
        parallel: false,
        critical: true,
        allowFallback: false
      },
      {
        id: 'conceptualization-selection',
        name: 'Concept Selection',
        agents: ['SelectionAgent'],
        dependencies: ['conceptualization-moodboard'],
        parallel: false,
        critical: true,
        allowFallback: false
      },
      {
        id: 'generation',
        name: 'SVG Generation',
        agents: ['SVGGenerationAgent'],
        dependencies: ['conceptualization-selection'],
        parallel: false,
        critical: true,
        allowFallback: false
      },
      {
        id: 'validation',
        name: 'SVG Validation',
        agents: ['SVGValidationAgent'],
        dependencies: ['generation'],
        parallel: false,
        critical: true,
        allowFallback: false
      },
      {
        id: 'refinement',
        name: 'Variant Generation',
        agents: ['VariantGenerationAgent'],
        dependencies: ['validation'],
        parallel: false,
        critical: false,
        allowFallback: true
      },
      {
        id: 'documentation',
        name: 'Guidelines Generation',
        agents: ['GuidelineAgent'],
        dependencies: ['refinement'],
        parallel: false,
        critical: false,
        allowFallback: true
      },
      {
        id: 'packaging',
        name: 'Asset Packaging',
        agents: ['PackagingAgent'],
        dependencies: ['documentation'],
        parallel: false,
        critical: false,
        allowFallback: true
      },
      {
        id: 'animation',
        name: 'Animation Generation',
        agents: ['AnimationAgent'],
        dependencies: ['packaging'],
        parallel: false,
        critical: false,
        allowFallback: true
      },
    ];
  }
}
