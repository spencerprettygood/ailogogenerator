import { nanoid } from 'nanoid';
import { analyzeClaudeError, ClaudeErrorType } from '../../utils/claude-error-handler';
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
  AnimationAgent
} from '../specialized';

/**
 * MultiAgentOrchestrator - Coordinates the execution of a pipeline of specialized agents
 * for logo generation.
 */
export class MultiAgentOrchestrator {
  private agents: AgentMap = {};
  private context: OrchestratorContext;
  private options: OrchestratorOptions;
  private progressCallback?: ProgressUpdateCallback;
  private executingAgents: Set<string> = new Set();
  private completedAgents: Set<string> = new Set();
  private failedAgents: Set<string> = new Set();
  private successfulAgents: Set<string> = new Set();
  private agentRetryCount: Record<string, number> = {};
  private logs: { timestamp: number; message: string; level: 'info' | 'warn' | 'error' }[] = [];
  private globalAbortController: AbortController;
  private cacheManager: CacheManager;

  constructor(brief: LogoBrief, options?: Partial<OrchestratorOptions>, progressCallback?: ProgressUpdateCallback) {
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
      ...options
    };

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
    this.cacheManager = CacheManager.getInstance();

    this.initializeAgents();

    Object.keys(this.agents).forEach(agentId => {
      this.agentRetryCount[agentId] = 0;
    });
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

  private createExecutionPlan(): AgentExecutionPlan {
    return {
      stages: [
        {
          id: 'stage-a',
          name: 'Requirements Analysis',
          agents: ['requirements'],
          dependencies: [],
          parallel: false,
          critical: true,
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

  public async execute(): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const errors: AgentExecutionError[] = [];

    const timeoutId = setTimeout(() => {
      this.globalAbortController.abort('Global timeout exceeded');
      this.log('Global timeout exceeded, aborting execution', 'error');
    }, this.options.timeoutMs);

    try {
      this.log(`Starting multi-agent execution for session ${this.context.sessionId}`);
      await this.initializeAgentContexts();

      for (const stage of this.context.executionPlan.stages) {
        if (this.globalAbortController.signal.aborted) {
          throw new Error(`Execution aborted: ${this.globalAbortController.signal.reason}`);
        }

        this.log(`Starting stage ${stage.id} (${stage.name}) with agents: ${stage.agents.join(', ')}`);

        try {
          const missingDependencies = stage.dependencies.filter(
            dep => !this.completedAgents.has(dep) && !stage.agents.includes(dep)
          );

          if (missingDependencies.length > 0) {
            throw new Error(`Cannot execute stage ${stage.id}: missing dependencies: ${missingDependencies.join(', ')}`);
          }

          if (stage.parallel && stage.agents.length > 1) {
            await this.executeAgentsInParallel(stage);
          } else {
            for (const agentId of stage.agents) {
              if (this.globalAbortController.signal.aborted) {
                throw new Error(`Execution aborted: ${this.globalAbortController.signal.reason}`);
              }
              await this.executeAgentWithRetry(agentId, stage);
            }
          }

          await this.processMessageQueue();
          this.log(`Completed stage ${stage.id}`);
        } catch (error) {
          const stageError: AgentExecutionError = {
            agentId: stage.agents[0] || 'orchestrator',
            stageId: stage.id,
            message: error instanceof Error ? error.message : 'Unknown error in stage',
            details: error
          };
          errors.push(stageError);
          this.log(`Error in stage ${stage.id}: ${stageError.message}`, 'error');
          // Report failure progress to client
          const failedAgentId = stage.agents[0]!;
          const failedAgent = this.agents[failedAgentId];
          if (failedAgent) {
            this.updateProgress(failedAgentId, failedAgent, 'failed', 0, stageError.message);
          }
          if (stage.critical) {
            throw new Error(`Critical stage ${stage.id} failed: ${stageError.message}`);
          }

          this.log(`Non-critical stage ${stage.id} failed, continuing with pipeline`, 'warn');
        }
      }

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
        logs: this.options.debugMode ? this.logs.map(l => l.message) : undefined
      };
    } catch (error) {
      const totalExecutionTime = Date.now() - startTime;
      this.log(`Multi-agent execution failed: ${error instanceof Error ? error.message : String(error)}`, 'error');

      return {
        success: false,
        metrics: {
          totalExecutionTime,
          totalTokensUsed: this.calculateTotalTokensUsed(),
          agentMetrics: this.getAgentMetrics()
        },
        logs: this.logs.map(l => l.message),
        errors: errors.length > 0 ? errors : [{
          agentId: 'orchestrator',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }]
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async initializeAgentContexts(): Promise<void> {
    const agentContext: AgentContext = {
      sessionId: this.context.sessionId,
      brief: this.context.brief,
      sharedMemory: this.context.sharedMemory,
      debugMode: this.options.debugMode,
      abortSignal: this.globalAbortController.signal
    };

    for (const [agentId, agent] of Object.entries(this.agents)) {
      await agent.initialize(agentContext);
      this.log(`Initialized agent ${agentId}`);
    }
  }

  private async executeAgentWithRetry(agentId: string, stage: AgentExecutionStage): Promise<void> {
    const agent = this.agents[agentId];
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    let lastError: Error | null = null;
    const maxRetries = this.options.maxRetries || 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Executing agent ${agentId} (attempt ${attempt + 1}/${maxRetries})`);
        const input = await this.prepareAgentInput(agentId);
        this.updateProgress(agentId, agent, 'working', 5, 'Executing...');

        const output = await this.executeAgentWithTimeout(agent, input);

        if (!output.success) {
          const errorDetails = output.error?.details || output.error;
          const errorMessage = output.error?.message || `Agent ${agentId} returned { success: false } without an error message.`;
          const agentError = errorDetails instanceof Error ? errorDetails : new Error(errorMessage);
          if (errorDetails && !(errorDetails instanceof Error)) {
            (agentError as any).details = errorDetails;
          }
          if (output.error && typeof (output.error as any).retryable === 'boolean') {
            (agentError as any).retryable = (output.error as any).retryable;
          }
          throw agentError;
        }

        this.log(`Agent ${agentId} executed successfully`);
        await this.handleSuccessfulAgentExecution(agentId, agent, output);
        return; // Success

      } catch (error: unknown) {
        let processedError: Error;
        if (error instanceof Error) {
          processedError = error;
        } else {
          const message = `Agent ${agentId} failed on attempt ${attempt + 1} with a non-error object: ${JSON.stringify(error)}`;
          this.log(`Caught a non-standard error from agent ${agentId}: ${JSON.stringify(error)}`, 'warn');
          processedError = new Error(message);
          (processedError as any).details = error;
        }

        lastError = processedError;
        
        const claudeErrorType = analyzeClaudeError(lastError);
        const isRetryable = (lastError as any).retryable ?? 
                            (claudeErrorType.type === ClaudeErrorType.RATE_LIMIT || claudeErrorType.type === ClaudeErrorType.SERVER_ERROR);

        const progress = (agent as any).getProgress?.()?.progress || 5;
        this.updateProgress(agentId, agent, 'retrying', progress, `Error: ${lastError.message.substring(0, 100)}`);

        if (isRetryable && attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt + 1);
          this.log(`Agent ${agentId} failed, retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`, 'warn');
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.log(`Agent ${agentId} failed after ${maxRetries + 1} attempts. Final error: ${lastError.message}`, 'error');
          this.failedAgents.add(agentId);
          throw lastError;
        }
      }
    }

    if (lastError) {
      this.log(`Agent ${agentId} ultimately failed after all retries.`, 'error');
      this.failedAgents.add(agentId);

      const stageForAgent = this.context.executionPlan.stages.find(s => s.agents.includes(agentId));
      if (stageForAgent?.allowFallback) {
        try {
          this.log(`Attempting to execute fallback for agent ${agentId}`, 'warn');
          const fallbackOutput = await this.executeFallback(agentId, stageForAgent);
          this.log(`Fallback for agent ${agentId} executed successfully`, 'info');
          await this.handleSuccessfulAgentExecution(agentId, agent, fallbackOutput);
          return; // Fallback was successful
        } catch (fallbackError: any) {
          this.log(`Fallback for agent ${agentId} also failed: ${fallbackError.message}`, 'error');
          // Fallback failed, throw original error
          throw lastError;
        }
      } else {
        throw lastError;
      }
    } else {
      const errorMessage = `Agent ${agentId} failed after all retries without a recorded error.`;
      this.log(errorMessage, 'error');
      this.failedAgents.add(agentId);
      throw new Error(errorMessage);
    }
  }

  private async handleSuccessfulAgentExecution(agentId: string, agent: Agent, output: AgentOutput): Promise<void> {
    this.log(`Agent ${agentId} executed successfully.`);
    this.context.sharedMemory.set(`${agentId}_output`, output);
    this.successfulAgents.add(agentId);
    this.failedAgents.delete(agentId);
    this.completedAgents.add(agentId); // <-- Ensure dependency is marked as completed

    if (this.options.useCache) {
      await this.cacheManager.set(`intermediate:${this.context.sessionId}:${agentId}`, output, 'intermediate', this.options.cacheTTLSeconds * 1000);
    }

    // Update progress
    this.updateProgress(agentId, agent, 'completed', 100, 'Execution completed successfully');
    await this.processMessageQueue();
  }

  private async executeAgentWithTimeout(agent: Agent, input: any): Promise<AgentOutput> {
    const timeoutPromise = new Promise<AgentOutput>((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(`Agent execution timed out after ${this.options.timeoutMs}ms`);
        (timeoutError as any).retryable = false; // Timeouts are generally not retryable
        reject(timeoutError);
      }, this.options.timeoutMs);
    });

    return Promise.race([
      agent.execute(input),
      timeoutPromise
    ]);
  }

  private async executeFallback(agentId: string, stage: AgentExecutionStage): Promise<AgentOutput> {
    switch (agentId) {
      case 'variantGeneration': {
        const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
        if (!svgValidationOutput?.result?.svg) {
          throw new Error('Cannot execute fallback: missing validated SVG');
        }
        const simplifiedVariants = {
          monochrome: {
            black: this.createMonochromeVariant(svgValidationOutput.result.svg, 'black'),
            white: this.createMonochromeVariant(svgValidationOutput.result.svg, 'white')
          },
          pngVariants: {
            size256: '/api/download?file=logo-256.png',
            size512: '/api/download?file=logo-512.png',
            size1024: '/api/download?file=logo-1024.png'
          },
          favicon: '/api/download?file=favicon.ico'
        };
        return { success: true, result: { variants: simplifiedVariants } };
      }
      case 'guideline': {
        const requirementsOutput = this.context.sharedMemory.get('requirements_output');
        if (!requirementsOutput?.result?.designSpec) {
          throw new Error('Cannot execute fallback: missing design spec');
        }
        const brandName = requirementsOutput.result.designSpec.brand_name;
        const basicGuidelines = `
          <html>
            <head><title>${brandName} Brand Guidelines</title></head>
            <body><h1>${brandName} Brand Guidelines</h1><p>Basic guidelines for ${brandName}.</p></body>
          </html>
        `;
        return { success: true, result: { html: basicGuidelines } };
      }
      case 'animation': {
        this.log(`Executing fallback for non-critical agent ${agentId}.`, 'warn');
        return { success: true, result: null }; // Return a null result
      }
      default:
        throw new Error(`No fallback available for agent ${agentId}`);
    }
  }

  private createMonochromeVariant(svg: string, color: 'black' | 'white'): string {
    const colorValue = color === 'black' ? '#000000' : '#FFFFFF';
    return svg
      .replace(/fill="[^"]*"/g, `fill="${colorValue}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${colorValue}"`)
      .replace(/<stop\s+[^>]*>/g, `<stop offset="0%" stop-color="${colorValue}" />`);
  }

  private calculateRetryDelay(attempt: number): number {
    const initialDelay = this.options.initialRetryDelayMs || 1000;
    switch (this.options.retryStrategy) {
      case 'fixed': return initialDelay;
      case 'linear': return initialDelay * attempt;
      case 'exponential-backoff':
      default:
        const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay;
        return exponentialDelay + jitter;
    }
  }

  private async executeAgentsInParallel(stage: AgentExecutionStage): Promise<void> {
    const agentIds = stage.agents;
    this.log(`Executing ${agentIds.length} agents in parallel: ${agentIds.join(', ')}`);
    const executions = agentIds.map(agentId => this.executeAgentWithRetry(agentId, stage));
    await Promise.all(executions);
  }

  private async prepareAgentInput(agentId: string): Promise<any> {
    const brief = this.context.brief;
    const inputId = `${agentId}-input-${nanoid(6)}`;

    const cachedResult = await this.cacheManager.get<AgentOutput>(`intermediate:${this.context.sessionId}:${agentId}`, 'intermediate');
    if (cachedResult) {
      this.log(`Using cached intermediate result for ${agentId}`);
      return { id: inputId, ...cachedResult, fromCache: true };
    }

    switch (agentId) {
      case 'requirements':
        return {
          id: inputId,
          brief: brief.prompt,
          imageDescriptions: brief.image_uploads?.map((file: File) => `Image file: ${file.name}`)
        };
      case 'moodboard': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        return { id: inputId, designSpec: reqs.result.designSpec };
      }
      case 'selection': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const mood = this.context.sharedMemory.get('moodboard_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!mood?.result?.moodboard?.concepts) throw new Error('Missing concepts');
        return { id: inputId, designSpec: reqs.result.designSpec, concepts: mood.result.moodboard.concepts };
      }
      case 'svgGeneration': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const sel = this.context.sharedMemory.get('selection_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!sel?.result?.selection?.selectedConcept) throw new Error('Missing selected concept');
        return { id: inputId, designSpec: reqs.result.designSpec, selectedConcept: sel.result.selection.selectedConcept };
      }
      case 'svgValidation': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const svg = this.context.sharedMemory.get('svgGeneration_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!svg?.result?.svg) throw new Error('Missing SVG');
        return { id: inputId, svg: svg.result.svg, brandName: reqs.result.designSpec.brand_name, repair: true, optimize: true };
      }
      case 'variantGeneration': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const svg = this.context.sharedMemory.get('svgValidation_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!svg?.result?.svg) throw new Error('Missing validated SVG');
        return { id: inputId, svg: svg.result.svg, designSpec: reqs.result.designSpec, brandName: reqs.result.designSpec.brand_name };
      }
      case 'guideline': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const variants = this.context.sharedMemory.get('variantGeneration_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!variants?.result?.variants) throw new Error('Missing variants');
        return { id: inputId, variants: variants.result.variants, designSpec: reqs.result.designSpec };
      }
      case 'packaging': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const svg = this.context.sharedMemory.get('svgValidation_output');
        const variants = this.context.sharedMemory.get('variantGeneration_output');
        const guide = this.context.sharedMemory.get('guideline_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!svg?.result?.svg) throw new Error('Missing validated SVG');
        if (!variants?.result?.variants) throw new Error('Missing variants');
        if (!guide?.result?.html) throw new Error('Missing guidelines HTML');
        return {
          id: inputId,
          brandName: reqs.result.designSpec.brand_name,
          svg: svg.result.svg,
          pngVariants: variants.result.variants.pngVariants,
          monochrome: variants.result.variants.monochrome,
          favicon: variants.result.variants.favicon,
          guidelines: { html: guide.result.html, plainText: '' }
        };
      }
      case 'animation': {
        const reqs = this.context.sharedMemory.get('requirements_output');
        const svg = this.context.sharedMemory.get('svgValidation_output');
        if (!reqs?.result?.designSpec) throw new Error('Missing design spec');
        if (!svg?.result?.svg) throw new Error('Missing validated SVG');
        return {
          id: inputId,
          svg: svg.result.svg,
          brandName: reqs.result.designSpec.brand_name,
          animationOptions: this.context.brief.animationOptions,
          autoSelectAnimation: !this.context.brief.animationOptions && this.context.brief.includeAnimations
        };
      }
      default:
        throw new Error(`Unknown agent type: ${agentId}`);
    }
  }

  private generateAgentMessages(agentId: string, output: any): void {
    this.context.messageQueue.push({
      fromAgent: agentId,
      toAgent: 'all',
      messageType: 'update',
      payload: { status: 'completed', message: `Agent ${agentId} completed successfully` },
      timestamp: Date.now()
    });

    if (agentId === 'requirements' && output.result?.designSpec) {
      this.context.messageQueue.push({
        fromAgent: agentId,
        toAgent: 'all',
        messageType: 'brand_info',
        payload: {
          brandName: output.result.designSpec.brand_name,
          style: output.result.designSpec.style_preferences,
          colors: output.result.designSpec.color_palette
        },
        timestamp: Date.now()
      });
    } else if (agentId === 'svgGeneration' && output.result?.svg) {
      this.context.messageQueue.push({
        fromAgent: agentId,
        toAgent: 'all',
        messageType: 'svg_preview',
        payload: { previewSvg: output.result.svg },
        timestamp: Date.now()
      });
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.context.messageQueue.length === 0) return;
    this.log(`Processing ${this.context.messageQueue.length} messages in queue`);

    for (const message of this.context.messageQueue) {
      await this.processMessage(message);
    }
    this.context.messageQueue = [];
  }

  private async processMessage(message: AgentMessage): Promise<void> {
    this.log(`Message from ${message.fromAgent} to ${message.toAgent}: ${message.messageType}`);

    if (message.toAgent === 'all') {
      this.log(`Broadcast message: ${JSON.stringify(message.payload)}`);
      if (message.messageType === 'svg_preview' && this.progressCallback && message.payload.previewSvg) {
        this.progressCallback({
          stage: this.getStageForAgent(message.fromAgent),
          agent: message.fromAgent,
          status: 'preview',
          progress: 50,
          message: 'SVG preview available',
          overallProgress: this.calculateOverallProgress(),
          preview: message.payload.previewSvg
        });
      }
      return;
    }

    const targetAgent = this.agents[message.toAgent];
    if (!targetAgent) {
      this.log(`Warning: Message targeted at unknown agent ${message.toAgent}`, 'warn');
      return;
    }
  }

  private createFinalResult(): GenerationResult {
    const getOutput = (key: string) => this.context.sharedMemory.get(`${key}_output`);

    const requirementsOutput = getOutput('requirements');
    const svgValidationOutput = getOutput('svgValidation');
    const variantGenerationOutput = getOutput('variantGeneration');
    const packagingOutput = getOutput('packaging');
    const animationOutput = getOutput('animation');
    const guidelineOutput = getOutput('guideline');

    if (!svgValidationOutput?.result?.svg) {
      this.log('Critical failure: Missing validated SVG from svgValidation agent.', 'error');
      throw new Error('Missing SVG validation output in final result. Cannot generate final assets.');
    }

    const designSpec = requirementsOutput?.result?.designSpec;
    const variants = variantGenerationOutput?.result?.variants;
    const animationResult = animationOutput?.result;

    return {
      success: true,
      brandName: designSpec?.brand_name || 'Unnamed Brand',
      logos: [{
        svgCode: svgValidationOutput.result.svg,
        inlineSize: svgValidationOutput.result.width || 1000,
        blockSize: svgValidationOutput.result.height || 1000,
        elements: [],
        colors: { primary: '#000000' },
        name: designSpec?.brand_name || 'Logo'
      }],
      logoSvg: svgValidationOutput.result.svg, // Backward compatibility
      brandGuidelinesUrl: packagingOutput?.result?.guidelinesUrl,
      downloadUrl: packagingOutput?.result?.downloadUrl,
      animatedSvg: animationResult?.animatedSvg,
      animationCss: animationResult?.cssCode,
      animationJs: animationResult?.jsCode,
    };
  }

  private updateProgress(
    agentId: string,
    agent: Agent,
    status: 'working' | 'completed' | 'failed' | 'retrying' | 'preview',
    progress: number,
    message: string
  ): void {
    const overallProgress = this.calculateOverallProgress();
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

  private calculateOverallProgress(): number {
    const totalAgents = Object.keys(this.agents).length;
    const completedAgents = this.completedAgents.size;
    const executingAgents = this.executingAgents.size;
    const overallProgress = Math.round(
      ((completedAgents / totalAgents) * 100) +
      ((executingAgents / totalAgents) * 50 / 100)
    );
    return Math.min(99, overallProgress);
  }

  private getStageForAgent(agentId: string): string {
    return this.context.executionPlan.stages.find(s => s.agents.includes(agentId))?.id || 'unknown';
  }

  private calculateTotalTokensUsed(): number {
    return Object.values(this.agents).reduce((total, agent) => total + agent.getMetrics().tokenUsage.total, 0);
  }

  private getAgentMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    for (const [agentId, agent] of Object.entries(this.agents)) {
      metrics[agentId] = agent.getMetrics();
    }
    return metrics;
  }

  public abort(reason: string = 'User requested abort'): void {
    if (!this.globalAbortController.signal.aborted) {
      this.globalAbortController.abort(reason);
      this.log(`Execution aborted: ${reason}`, 'error');
    }
  }
}