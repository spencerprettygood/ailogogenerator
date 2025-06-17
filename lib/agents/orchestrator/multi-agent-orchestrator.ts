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
  ProgressUpdateCallback 
} from '../../types-agents';
import { LogoBrief, GenerationResult } from '../../types';
import { 
  RequirementsAgent,
  MoodboardAgent,
  SelectionAgent,
  SVGGenerationAgent,
  SVGValidationAgent,
  VariantGenerationAgent,
  GuidelineAgent,
  PackagingAgent
} from '../specialized';

/**
 * MultiAgentOrchestrator - Coordinates the execution of multiple specialized agents
 */
export class MultiAgentOrchestrator {
  private agents: AgentMap = {};
  private context: OrchestratorContext;
  private options: OrchestratorOptions;
  private progressCallback?: ProgressUpdateCallback;
  private executingAgents: Set<string> = new Set();
  private completedAgents: Set<string> = new Set();
  private failedAgents: Set<string> = new Set();
  private logs: string[] = [];
  
  constructor(brief: LogoBrief, options?: OrchestratorOptions, progressCallback?: ProgressUpdateCallback) {
    // Set default options
    this.options = {
      maxConcurrentAgents: 2,
      timeoutMs: 5 * 60 * 1000, // 5 minutes
      retryFailedAgents: true,
      debugMode: process.env.NODE_ENV === 'development',
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
    
    // Initialize agent instances
    this.initializeAgents();
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
      packaging: new PackagingAgent()
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
          agents: ['requirements'],
          dependencies: [],
          parallel: false
        },
        {
          id: 'stage-b',
          agents: ['moodboard'],
          dependencies: ['requirements'],
          parallel: false
        },
        {
          id: 'stage-c',
          agents: ['selection'],
          dependencies: ['requirements', 'moodboard'],
          parallel: false
        },
        {
          id: 'stage-d',
          agents: ['svgGeneration'],
          dependencies: ['requirements', 'selection'],
          parallel: false
        },
        {
          id: 'stage-e',
          agents: ['svgValidation'],
          dependencies: ['requirements', 'svgGeneration'],
          parallel: false
        },
        {
          id: 'stage-f',
          agents: ['variantGeneration'],
          dependencies: ['requirements', 'svgValidation'],
          parallel: false
        },
        {
          id: 'stage-g',
          agents: ['guideline'],
          dependencies: ['requirements', 'variantGeneration'],
          parallel: true
        },
        {
          id: 'stage-h',
          agents: ['packaging'],
          dependencies: ['requirements', 'svgValidation', 'variantGeneration', 'guideline'],
          parallel: false
        }
      ]
    };
  }
  
  /**
   * Execute the multi-agent pipeline
   */
  public async execute(): Promise<OrchestratorResult> {
    const startTime = Date.now();
    
    try {
      this.log(`Starting multi-agent execution for session ${this.context.sessionId}`);
      
      // Initialize all agents with context
      await this.initializeAgentContexts();
      
      // Process the execution plan stage by stage
      for (const stage of this.context.executionPlan.stages) {
        this.log(`Starting stage ${stage.id} with agents: ${stage.agents.join(', ')}`);
        
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
          await this.executeAgentsInParallel(stage.agents);
        } else {
          // Execute agents sequentially
          for (const agentId of stage.agents) {
            await this.executeAgent(agentId);
          }
        }
        
        // Process any messages generated during this stage
        await this.processMessageQueue();
        
        this.log(`Completed stage ${stage.id}`);
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
        errors: [{
          agentId: 'orchestrator',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }]
      };
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
      debugMode: this.options.debugMode
    };
    
    // Initialize each agent with context
    for (const [agentId, agent] of Object.entries(this.agents)) {
      await agent.initialize(agentContext);
      this.log(`Initialized agent ${agentId}`);
    }
  }
  
  /**
   * Execute a specific agent
   */
  private async executeAgent(agentId: string): Promise<void> {
    const agent = this.agents[agentId];
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Mark agent as executing
    this.executingAgents.add(agentId);
    
    try {
      this.log(`Executing agent ${agentId}`);
      
      // Update progress
      this.updateProgress(agentId, agent, 'working', 0, `${agentId} starting execution...`);
      
      // Prepare input for the agent based on its type
      const input = await this.prepareAgentInput(agentId);
      
      // Execute the agent
      const output = await agent.execute(input);
      
      // If execution failed
      if (!output.success) {
        this.log(`Agent ${agentId} execution failed: ${output.error?.message}`);
        
        // Update progress
        this.updateProgress(agentId, agent, 'failed', 0, `${agentId} execution failed: ${output.error?.message}`);
        
        // Mark as failed
        this.failedAgents.add(agentId);
        this.executingAgents.delete(agentId);
        
        // Check if we should retry
        if (this.options.retryFailedAgents) {
          // TODO: Implement retry logic
          throw new Error(`Agent ${agentId} failed: ${output.error?.message}`);
        } else {
          throw new Error(`Agent ${agentId} failed: ${output.error?.message}`);
        }
      }
      
      // Store the output in shared memory
      this.context.sharedMemory.set(`${agentId}_output`, output);
      
      // Process any messages to be sent to other agents
      this.generateAgentMessages(agentId, output);
      
      // Mark agent as completed
      this.completedAgents.add(agentId);
      this.executingAgents.delete(agentId);
      
      // Update progress
      this.updateProgress(agentId, agent, 'completed', 100, `${agentId} completed successfully`);
      
      this.log(`Agent ${agentId} executed successfully`);
    } catch (error) {
      // Mark agent as failed
      this.failedAgents.add(agentId);
      this.executingAgents.delete(agentId);
      
      // Update progress
      this.updateProgress(
        agentId, 
        agent, 
        'failed', 
        0, 
        `${agentId} execution error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      this.log(`Agent ${agentId} execution error: ${error instanceof Error ? error.message : String(error)}`);
      
      throw error;
    }
  }
  
  /**
   * Execute multiple agents in parallel
   */
  private async executeAgentsInParallel(agentIds: string[]): Promise<void> {
    this.log(`Executing ${agentIds.length} agents in parallel: ${agentIds.join(', ')}`);
    
    const executions = agentIds.map(agentId => this.executeAgent(agentId));
    await Promise.all(executions);
  }
  
  /**
   * Prepare input for a specific agent based on its type
   */
  private async prepareAgentInput(agentId: string): Promise<any> {
    const brief = this.context.brief;
    
    // Create a unique ID for the input
    const inputId = `${agentId}-input-${nanoid(6)}`;
    
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
        
      default:
        throw new Error(`Unknown agent type: ${agentId}`);
    }
  }
  
  /**
   * Generate messages to be sent to other agents based on output
   */
  private generateAgentMessages(agentId: string, output: any): void {
    // Currently a simple implementation
    // In a more advanced system, agents could generate messages for other agents
    
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
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    // Currently a simple implementation
    // In a more advanced system, this would route messages to their target agents
    
    this.log(`Message from ${message.fromAgent} to ${message.toAgent}: ${message.messageType}`);
    
    // Handle broadcast messages
    if (message.toAgent === 'all') {
      // Broadcast to all agents
      // Currently, we just log the message
      this.log(`Broadcast message: ${JSON.stringify(message.payload)}`);
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
   */
  private createFinalResult(): GenerationResult {
    // Extract results from each agent
    const svgValidationOutput = this.context.sharedMemory.get('svgValidation_output');
    const variantGenerationOutput = this.context.sharedMemory.get('variantGeneration_output');
    const guidelineOutput = this.context.sharedMemory.get('guideline_output');
    const packagingOutput = this.context.sharedMemory.get('packaging_output');
    
    if (!svgValidationOutput?.result) {
      throw new Error('Missing SVG validation output in final result');
    }
    
    // Build the final result object
    return {
      success: true,
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
      downloadUrl: packagingOutput?.result?.downloadUrl
    };
  }
  
  /**
   * Update progress and send to callback if available
   */
  private updateProgress(
    agentId: string, 
    agent: Agent, 
    status: 'working' | 'completed' | 'failed', 
    progress: number, 
    message: string
  ): void {
    // Calculate overall progress
    const totalAgents = Object.keys(this.agents).length;
    const completedAgents = this.completedAgents.size;
    const executingAgents = this.executingAgents.size;
    
    const overallProgress = Math.round(
      ((completedAgents / totalAgents) * 100) + 
      ((executingAgents / totalAgents) * (progress / 100))
    );
    
    // Send to callback if available
    if (this.progressCallback) {
      this.progressCallback({
        stage: this.getStageForAgent(agentId),
        agent: agentId,
        status: status === 'working' ? 'working' : status === 'completed' ? 'completed' : 'failed',
        progress,
        message,
        overallProgress
      });
    }
  }
  
  /**
   * Get the stage ID for a given agent
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
   */
  private getAgentMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [agentId, agent] of Object.entries(this.agents)) {
      metrics[agentId] = agent.getMetrics();
    }
    
    return metrics;
  }
  
  /**
   * Log a message (internal)
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    
    if (this.options.debugMode) {
      console.log(`[MultiAgentOrchestrator] ${message}`);
    }
  }
}