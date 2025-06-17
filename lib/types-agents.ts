import { DesignSpec, LogoBrief } from './types';

// Base agent interfaces
export interface AgentInput {
  id: string;
  [key: string]: any;
}

export interface AgentOutput {
  success: boolean;
  result?: any;
  error?: {
    message: string;
    details?: unknown;
  };
  tokensUsed?: number;
  processingTime?: number;
}

export interface AgentConfig {
  model: 'claude-3-5-sonnet-20240620' | 'claude-3-5-haiku-20240307';
  temperature: number;
  maxTokens: number;
  systemPromptOverride?: string;
  stopSequences?: string[];
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
    maxDelay: number;
  };
}

export interface AgentMetrics {
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  executionTime: number;
  retryCount: number;
  startTime: number;
  endTime: number;
}

export interface AgentContext {
  sessionId: string;
  brief: LogoBrief;
  sharedMemory: Map<string, any>;
  designSpec?: DesignSpec;
  overrides?: Record<string, any>;
  debugMode?: boolean;
}

// Agent status
export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed';

// Agent capabilities
export type AgentCapability = 
  'requirements-analysis' | 
  'concept-generation' | 
  'selection' | 
  'svg-generation' | 
  'svg-validation' | 
  'variant-generation' | 
  'guideline-creation' | 
  'asset-packaging';

// Agent message types
export interface AgentMessage {
  fromAgent: string;
  toAgent: string;
  messageType: 'request' | 'response' | 'update' | 'error';
  payload: any;
  timestamp: number;
}

// Agent interfaces for each specialized role
export interface RequirementsAgentInput extends AgentInput {
  brief: string;
  imageDescriptions?: string[];
}

export interface RequirementsAgentOutput extends AgentOutput {
  result?: {
    designSpec: DesignSpec;
  };
}

export interface MoodboardAgentInput extends AgentInput {
  designSpec: DesignSpec;
}

export interface MoodboardAgentOutput extends AgentOutput {
  result?: {
    moodboard: {
      concepts: Array<{
        name: string;
        description: string;
        style: string;
        colors: string;
        imagery: string;
      }>;
    };
  };
}

export interface SelectionAgentInput extends AgentInput {
  designSpec: DesignSpec;
  concepts: Array<{
    name: string;
    description: string;
    style: string;
    colors: string;
    imagery: string;
  }>;
}

export interface SelectionAgentOutput extends AgentOutput {
  result?: {
    selection: {
      selectedConcept: {
        name: string;
        description: string;
        style: string;
        colors: string;
        imagery: string;
      };
      selectionRationale: string;
      score: number;
    };
  };
}

export interface SVGGenerationAgentInput extends AgentInput {
  designSpec: DesignSpec;
  selectedConcept: {
    name: string;
    description: string;
    style: string;
    colors: string;
    imagery: string;
  };
}

export interface SVGGenerationAgentOutput extends AgentOutput {
  result?: {
    svg: string;
    designRationale: string;
  };
}

export interface SVGValidationAgentInput extends AgentInput {
  svg: string;
  brandName: string;
  repair?: boolean;
  optimize?: boolean;
}

export interface SVGValidationAgentOutput extends AgentOutput {
  result?: {
    svg: string;
    isValid: boolean;
    modifications?: string[];
    optimizationResults?: {
      originalSize: number;
      optimizedSize: number;
      reductionPercent: number;
    };
  };
}

export interface VariantGenerationAgentInput extends AgentInput {
  svg: string;
  designSpec: DesignSpec;
  brandName: string;
}

export interface VariantGenerationAgentOutput extends AgentOutput {
  result?: {
    variants: {
      monochrome: {
        black: string;
        white: string;
      };
      favicon: {
        svg: string;
        ico: string;
      };
      pngVariants: {
        size256: string;
        size512: string;
        size1024: string;
      };
    };
  };
}

export interface GuidelineAgentInput extends AgentInput {
  variants: {
    monochrome: {
      black: string;
      white: string;
    };
    favicon: {
      svg: string;
      ico: string;
    };
    pngVariants: {
      size256: string;
      size512: string;
      size1024: string;
    };
  };
  designSpec: DesignSpec;
}

export interface GuidelineAgentOutput extends AgentOutput {
  result?: {
    html: string;
  };
}

export interface PackagingAgentInput extends AgentInput {
  brandName: string;
  svg: string;
  pngVariants: {
    size256: string;
    size512: string;
    size1024: string;
  };
  monochrome: {
    black: string;
    white: string;
  };
  favicon: {
    svg: string;
    ico: string;
  };
  guidelines: {
    html: string;
    plainText: string;
  };
}

export interface PackagingAgentOutput extends AgentOutput {
  result?: {
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  };
}

// Agent factory and registry types
export interface AgentConstructor {
  new (config?: AgentConfig): Agent;
}

export interface AgentRegistry {
  [key: string]: AgentConstructor;
}

// Base Agent abstract class definition
export interface Agent {
  id: string;
  type: string;
  capabilities: AgentCapability[];
  status: AgentStatus;
  metrics: AgentMetrics;
  config: AgentConfig;
  
  initialize(context: AgentContext): Promise<void>;
  execute(input: AgentInput): Promise<AgentOutput>;
  getStatus(): AgentStatus;
  getMetrics(): AgentMetrics;
}

// Multi-agent system types
export interface AgentMap {
  [key: string]: Agent;
}

export interface AgentExecutionPlan {
  stages: Array<{
    id: string;
    agents: string[];
    dependencies: string[];
    parallel: boolean;
  }>;
}

export interface OrchestratorOptions {
  maxConcurrentAgents?: number;
  timeoutMs?: number;
  retryFailedAgents?: boolean;
  debugMode?: boolean;
}

export interface OrchestratorContext {
  sessionId: string;
  brief: LogoBrief;
  startTime: number;
  sharedMemory: Map<string, any>;
  messageQueue: AgentMessage[];
  executionPlan: AgentExecutionPlan;
}

export interface OrchestratorResult {
  success: boolean;
  result?: any;
  metrics: {
    totalExecutionTime: number;
    totalTokensUsed: number;
    agentMetrics: Record<string, AgentMetrics>;
  };
  logs?: string[];
  errors?: Array<{
    agentId: string;
    message: string;
    details?: unknown;
  }>;
}

export interface ProgressUpdateCallback {
  (update: {
    stage: string;
    agent: string;
    status: AgentStatus;
    progress: number;
    message: string;
    overallProgress: number;
  }): void;
}