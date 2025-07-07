# ADR-001: Multi-Agent Architecture for AI Logo Generation

## Status

Accepted (2025-06-17)

## Context

The AI Logo Generator application needs to transform plain-language briefs into production-ready logo packages through a series of complex, interdependent steps. These steps include:

1. Analyzing user requirements from natural language
2. Generating creative design concepts
3. Selecting the optimal concept
4. Creating vector graphics (SVG)
5. Validating and optimizing the SVG
6. Generating variants (monochrome, favicon, etc.)
7. Creating brand guidelines
8. Packaging all assets for delivery

Each of these steps requires different specialized capabilities:

- Some steps need creative generation (concept design, SVG creation)
- Others need analytical processing (requirement extraction, concept selection)
- Others focus on technical tasks (validation, optimization, packaging)

Furthermore, different AI models are optimal for different tasks:

- Creative tasks benefit from more powerful models (Claude 3.5 Sonnet)
- Analytical tasks can use faster, more efficient models (Claude 3.5 Haiku)

The application also needs to maintain clear separation of concerns, enable parallel processing where possible, and provide a mechanism for robust error handling and retry logic.

## Decision

We will implement a Multi-Agent Architecture pattern where:

1. Each step in the logo generation pipeline is handled by a specialized agent
2. Agents are coordinated by a central orchestrator
3. Each agent has:
   - A specific responsibility (single-purpose)
   - Its own configuration (model, temperature, tokens)
   - Internal validation and error handling
   - Standardized input/output interfaces

4. The orchestrator will:
   - Manage the execution flow and dependencies
   - Handle inter-agent communication
   - Provide progress tracking and monitoring
   - Implement retry and error recovery strategies

This pattern follows the principles of:

- Single Responsibility Principle (each agent does one thing well)
- Interface Segregation (standardized interfaces between agents)
- Dependency Inversion (agents depend on abstractions, not concrete implementations)

## Consequences

### Positive

1. **Modular Development**: Each agent can be developed, tested, and optimized independently
2. **Specialized Optimization**: Different AI models and parameters can be used for different tasks
3. **Parallel Execution**: Where dependencies allow, agents can run in parallel
4. **Resilience**: Failure in one agent doesn't necessarily mean failure of the entire pipeline
5. **Flexibility**: New agents can be added or existing ones modified without changing the overall architecture
6. **Observability**: Each agent provides detailed metrics and progress information
7. **Resource Efficiency**: Tasks use only the computational resources they need (e.g., simpler models for simpler tasks)

### Negative

1. **Complexity**: The system has more moving parts than a monolithic approach
2. **Overhead**: Inter-agent communication and orchestration adds some overhead
3. **Debugging Challenges**: Issues may span multiple agents, making debugging more complex
4. **State Management**: Requires careful handling of shared state and context
5. **Testing Complexity**: Integration testing requires simulating the entire pipeline

## Implementation

### Agent Base Class

The foundation of the architecture is a `BaseAgent` abstract class that all specialized agents inherit from:

```typescript
export abstract class BaseAgent {
  protected id: string;
  protected capabilities: string[];
  protected config: AgentConfig;
  protected systemPrompt: string;
  protected context: AgentContext | null = null;
  protected metrics: AgentMetrics = {
    executionTime: 0,
    tokenUsage: {
      prompt: 0,
      completion: 0,
      total: 0
    }
  };

  constructor(id: string, capabilities: string[], config?: Partial<AgentConfig>) {
    this.id = id;
    this.capabilities = capabilities;
    this.config = {
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.5,
      maxTokens: 1000,
      ...config
    };
    this.systemPrompt = '';
  }

  async initialize(context: AgentContext): Promise<void> {
    this.context = context;
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    
    try {
      // Generate the prompt for Claude
      const prompt = await this.generatePrompt(input);
      
      // Execute the prompt with Claude
      const response = await this.executeWithClaude(prompt);
      
      // Process the response
      const result = await this.processResponse(response.content, input);
      
      // Update metrics
      this.metrics.executionTime = Date.now() - startTime;
      this.metrics.tokenUsage = {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens
      };
      
      return result;
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

  protected abstract generatePrompt(input: AgentInput): Promise<string>;
  
  protected abstract processResponse(responseContent: string, originalInput: AgentInput): Promise<AgentOutput>;
  
  private async executeWithClaude(prompt: string): Promise<ClaudeResponse> {
    // Implementation of Claude API call
    // ...
  }

  getMetrics(): AgentMetrics {
    return this.metrics;
  }
}
```

### Specialized Agents

Each specialized agent extends the base class and implements the abstract methods:

```typescript
export class RequirementsAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'requirements', 
      ['requirements-analysis'],
      {
        model: 'claude-3-haiku-20240307', // Use faster model for analysis
        temperature: 0.1, // Low temperature for consistent output
        maxTokens: 1000,
        ...config
      }
    );
    
    this.systemPrompt = `You are a specialized design requirements analyzer...`;
  }
  
  protected async generatePrompt(input: RequirementsAgentInput): Promise<string> {
    // Implementation
  }
  
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<RequirementsAgentOutput> {
    // Implementation
  }
}
```

### Multi-Agent Orchestrator

The orchestrator manages the execution flow:

```typescript
export class MultiAgentOrchestrator {
  private agents: AgentMap = {};
  private context: OrchestratorContext;
  private options: OrchestratorOptions;
  private progressCallback?: ProgressUpdateCallback;
  
  constructor(brief: LogoBrief, options?: OrchestratorOptions, progressCallback?: ProgressUpdateCallback) {
    // Initialize context and options
    
    this.context = {
      sessionId: nanoid(),
      brief,
      startTime: Date.now(),
      sharedMemory: new Map(),
      messageQueue: [],
      executionPlan: this.createExecutionPlan()
    };
    
    this.progressCallback = progressCallback;
    
    // Initialize agents
    this.initializeAgents();
  }
  
  private createExecutionPlan(): AgentExecutionPlan {
    return {
      stages: [
        {
          id: 'stage-a',
          agents: ['requirements'],
          dependencies: [],
          parallel: false
        },
        // Other stages
      ]
    };
  }
  
  public async execute(): Promise<OrchestratorResult> {
    // Process execution plan stage by stage
    for (const stage of this.context.executionPlan.stages) {
      // Check dependencies
      // Execute agents in this stage
      // Process message queue
    }
    
    // Create final result
    return result;
  }
}
```

### Agent Communication

Agents communicate through a shared memory system and message passing:

```typescript
interface OrchestratorContext {
  sessionId: string;
  brief: LogoBrief;
  startTime: number;
  sharedMemory: Map<string, any>;
  messageQueue: AgentMessage[];
  executionPlan: AgentExecutionPlan;
}

interface AgentMessage {
  fromAgent: string;
  toAgent: string;
  messageType: string;
  payload: any;
  timestamp: number;
}
```

## Implementation Notes

1. **Model Selection**:
   - Use Claude 3.5 Haiku for analytical tasks (requirements, selection)
   - Use Claude 3.5 Sonnet for creative tasks (moodboard, SVG generation)

2. **Error Handling Strategy**:
   - Each agent should have specific error handling for its domain
   - The orchestrator implements global retry and fallback strategies
   - Critical errors should be reported to the user with actionable feedback

3. **Progress Tracking**:
   - Each agent reports progress percentage
   - The orchestrator calculates overall progress based on stage weights
   - Progress updates are streamed to the client in real-time

4. **Performance Considerations**:
   - Implement token budget monitoring for cost control
   - Use streaming responses where possible for better UX
   - Consider caching for repeated operations

5. **Testing Approach**:
   - Unit test each agent independently with mock inputs/outputs
   - Integration test agent combinations for critical paths
   - End-to-end test the entire pipeline with representative inputs
