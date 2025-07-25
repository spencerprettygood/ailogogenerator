import { AnimationOptions } from './animation/types';
import { DesignSpec, LogoBrief } from './types';

// Base agent interfaces
export interface AgentInput {
  id: string;
  [key: string]: any;
}

export interface AgentOutput<T = any> {
  success: boolean;
  result?: T;
  error?: {
    message: string;
    details?: any;
    retryable?: boolean;
  };
  tokensUsed?: number;
  processingTime?: number;
}

export interface OrchestratorOptions {
  maxConcurrentAgents: number;
  timeoutMs: number;
  retryFailedAgents: boolean;
  maxRetries: number;
  debugMode: boolean;
  retryStrategy: AgentRetryStrategy;
  initialRetryDelayMs: number;
  cacheTTLSeconds: number;
}

export type ClaudeModel =
  | 'claude-3-5-sonnet-20240620'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307';

export interface AgentConfig {
  model: ClaudeModel;
  fallbackModels?: ClaudeModel[];
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
  overrides?: Record<string, unknown>;
  debugMode?: boolean;
  abortSignal?: AbortSignal;
  progressCallback?: (percent: number, message: string) => void;
}

// Agent status
export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed' | 'retrying' | 'preview';

// Agent capabilities
export type AgentCapability =
  | 'requirements-analysis'
  | 'concept-generation'
  | 'selection'
  | 'svg-generation'
  | 'svg-validation'
  | 'variant-generation'
  | 'guideline-creation'
  | 'asset-packaging'
  | 'design-theory'
  | 'industry-analysis'
  | 'animation-generation'
  | 'animation'
  | 'uniqueness-verification';

// Agent message types
export interface AgentMessage {
  fromAgent: string;
  toAgent: string;
  messageType: 'request' | 'response' | 'update' | 'error' | 'brand_info' | 'svg_preview';
  payload: {
    content?: string;
    progress?: any; // Keeping this as `any` for now to avoid deep refactoring, will be addressed next.
    [key: string]: any;
  };
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
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
}

export interface DesignPrinciple {
  goldenRatio: string;
  colorTheory: string;
  visualHierarchy: string;
  technicalExcellence: string;
}

export interface IndustryDesignPrinciple {
  colorTheory: string;
  composition: string;
  visualWeight: string;
  typography: string;
  negativeSpace: string;
}

export interface SVGGenerationAgentOutput extends AgentOutput {
  result?: {
    svg: string;
    designRationale: string;
    designPrinciples?: DesignPrinciple;
  };
}

export interface IndustryTemplateSVGAgentOutput extends AgentOutput {
  result?: {
    svg: string;
    designRationale: string;
    designPrinciples?: IndustryDesignPrinciple;
    industryTemplate?: string;
  };
}

export interface UniquenessVerificationAgentInput extends AgentInput {
  logo: { svgCode: string };
  industry?: string;
  brandName: string;
  existingLogos?: { svgCode: string }[];
}

export interface UniquenessVerificationResult {
  isUnique: boolean;
  uniquenessScore: number; // 0-100
  similarityIssues: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    elementType: 'shape' | 'color' | 'typography' | 'composition' | 'concept';
    recommendations: string[];
  }[];
  recommendations: string[];
}

export interface UniquenessVerificationAgentOutput extends AgentOutput {
  result?: UniquenessVerificationResult;
}

export interface SVGValidationAgentInput extends AgentInput {
  svg: string;
  brandName: string;
  repair?: boolean;
  optimize?: boolean;
}

export interface SVGValidationResultOutput extends AgentOutput {
  result?: {
    svg: string;
    isValid: boolean;
    modifications?: string[];
    securityScore?: number;
    accessibilityScore?: number;
    optimizationScore?: number;
    overallScore?: number;
    designQualityScore?: SVGDesignQualityScore;
    designFeedback?: string;
    issues?: { severity: 'critical' | 'warning' | 'info'; message: string }[];
  };
}

export interface SVGDesignQualityScore {
  balance: number;
  harmony: number;
  symmetry: number;
  simplicity: number;
  clarity: number;
  overall: number;
}

export interface VariantGenerationAgentInput extends AgentInput {
  designSpec: DesignSpec;
  brandName: string;
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
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
        png32?: string;
      };
      pngVariants: {
        size256: string;
        size512: string;
        size1024: string;
      };
      transparentPngVariants?: {
        size256: string;
        size512: string;
        size1024: string;
      };
      monochromePngVariants?: {
        black: {
          size256: string;
          size512: string;
        };
        white: {
          size256: string;
          size512: string;
        };
      };
      animatedVariant?: {
        svg: string;
        css: string;
        js?: string;
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
      png32?: string;
    };
    pngVariants: {
      size256: string;
      size512: string;
      size1024: string;
    };
    transparentPngVariants?: {
      size256: string;
      size512: string;
      size1024: string;
    };
    monochromePngVariants?: {
      black: {
        size256: string;
        size512: string;
      };
      white: {
        size256: string;
        size512: string;
      };
    };
    animatedVariant?: {
      svg: string;
      css: string;
      js?: string;
    };
  };
  designSpec: DesignSpec;
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
}

export interface GuidelineAgentOutput extends AgentOutput {
  result?: {
    html: string;
  };
}

export interface AnimationAgentInput extends AgentInput {
  svg: string;
  designSpec: DesignSpec;
  animationOptions: AnimationOptions;
}

export interface AnimationAgentOutput extends AgentOutput {
  result?: {
    animatedSvg: string;
    cssCode: string;
    jsCode?: string;
    animationOptions: AnimationOptions;
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
  animatedVariant?: {
    svg: string;
    css: string;
    js?: string;
  };
}

export interface PackagingAgentOutput extends AgentOutput {
  result?: {
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  };
}

export interface IndustryAnalysisAgentInput extends AgentInput {
  brandName: string;
  industry: string;
  designSpec: DesignSpec;
  svg?: string; // Optional: for analyzing an existing logo
}

export interface CompetitorLogo {
  companyName: string;
  logoUrl?: string;
  logoDescription: string;
  dominantColors: string[];
  styleCategory: string;
  visualElements: string[];
  similarityScore?: number; // 0-100 score comparing to user's design/requirements
}

export interface IndustryTrend {
  name: string;
  description: string;
  prevalence: number; // 0-100 indicating how common this trend is
  examples: string[];
}

export interface IndustryAnalysisAgentOutput extends AgentOutput {
  result?: {
    industryName: string;
    confidence: number; // 0-1 confidence in industry classification
    competitorLogos: CompetitorLogo[];
    industryTrends: IndustryTrend[];
    designRecommendations: string[];
    uniquenessScore: number; // 0-100 score of how unique the logo is compared to competitors
    conventionScore: number; // 0-100 score of how well it follows industry conventions
    balanceAnalysis: string; // Analysis of uniqueness vs. convention balance
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

// Execution stage enum for orchestrator
export enum AgentExecutionStage {
  INITIALIZATION = 'initialization',
  ANALYSIS = 'analysis',
  CONCEPTUALIZATION = 'conceptualization',
  GENERATION = 'generation',
  VALIDATION = 'validation',
  REFINEMENT = 'refinement',
  DOCUMENTATION = 'documentation',
  PACKAGING = 'packaging',
  ANIMATION = 'animation',
  COMPLETE = 'complete',
  ERROR = 'error'
}

// Enhanced execution stage interface
export interface AgentExecutionStageConfig {
  id: string;
  name: string;
  agents: string[];
  dependencies: string[];
  parallel: boolean;
  critical: boolean;
  allowFallback: boolean;
}

export interface AgentExecutionPlan {
  stages: AgentExecutionStageConfig[];
}

// Retry strategies
export type AgentRetryStrategy = 'fixed' | 'linear' | 'exponential-backoff';

// Enhanced orchestrator options
export interface OrchestratorOptions {
  maxConcurrentAgents: number;
  timeoutMs: number;
  retryFailedAgents: boolean;
  maxRetries: number;
  debugMode: boolean;
  retryStrategy: AgentRetryStrategy;
  initialRetryDelayMs: number;
  cacheTTLSeconds: number;
  useCache: boolean;
}

export interface OrchestratorContext {
  sessionId: string;
  brief: LogoBrief;
  startTime: number;
  sharedMemory: Map<string, any>;
  messageQueue: AgentMessage[];
  executionPlan: AgentExecutionPlan;
}

// Error tracking
export interface AgentExecutionError {
  agentId: string;
  stageId?: string;
  message: string;
  details?: unknown;
}

export interface OrchestratorResult {
  success: boolean;
  result?: any;
  metrics: {
    totalExecutionTime: number;
    totalTokensUsed: number;
    agentMetrics: Record<string, any>;
  };
  logs?: string[];
  errors?: AgentExecutionError[];
}

export interface ProgressUpdateCallback {
  (update: {
    stage: string;
    agent: string;
    status: string;
    progress: number;
    message: string;
    overallProgress: number;
    preview?: string;
  }): void;
}
