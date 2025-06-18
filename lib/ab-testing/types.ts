// A/B Testing types for logo generation

/**
 * Defines the different testable variants for A/B testing
 */
export enum TestVariant {
  A = 'A', // Control/default
  B = 'B', // Test variant
  C = 'C', // Optional additional variant
  D = 'D', // Optional additional variant
}

/**
 * Component or process areas that can be tested
 */
export enum TestComponent {
  GENERATION_MODEL = 'generation_model',         // Different AI models for generation
  PROMPT_STRATEGY = 'prompt_strategy',           // Different prompt approaches
  SVG_GENERATION_APPROACH = 'svg_generation',    // Different SVG generation techniques
  UI_LAYOUT = 'ui_layout',                       // Different UI layouts
  MOODBOARD_STYLE = 'moodboard_style',           // Different moodboard approaches
  VARIANT_GENERATION = 'variant_generation',     // Different ways to create variants
  GUIDELINE_FORMAT = 'guideline_format',         // Different formats for brand guidelines
  PIPELINE_STRUCTURE = 'pipeline_structure',     // Different pipeline architectures
}

/**
 * Testing goal metrics to measure
 */
export enum TestMetric {
  USER_SATISFACTION = 'user_satisfaction',       // User rating/satisfaction score
  GENERATION_SPEED = 'generation_speed',         // Time to complete generation
  LOGO_QUALITY = 'logo_quality',                 // Quality assessment of logo
  CONVERSION_RATE = 'conversion_rate',           // % of users who download/complete
  ENGAGEMENT = 'engagement',                     // User engagement metrics
  TOKEN_EFFICIENCY = 'token_efficiency',         // Token usage efficiency
}

/**
 * Feedback source for test evaluation
 */
export enum FeedbackSource {
  EXPLICIT_RATING = 'explicit_rating',           // User explicitly rates the result
  IMPLICIT_BEHAVIOR = 'implicit_behavior',       // Derived from user behavior
  EXPERT_EVALUATION = 'expert_evaluation',       // Evaluation by design experts
  COMPARATIVE_SELECTION = 'comparative_selection', // User selects between options
}

/**
 * Test configuration for a specific experiment
 */
export interface TestConfig {
  id: string;                               // Unique test identifier
  name: string;                             // Human-readable test name
  description: string;                      // Test description
  component: TestComponent;                 // What component/area is being tested
  variants: {                               // Map of variant implementations
    [key in TestVariant]?: VariantConfig;   // Configuration for each variant
  };
  metrics: TestMetric[];                    // Metrics to track
  feedbackSources: FeedbackSource[];        // How feedback will be collected
  trafficAllocation: {                      // How traffic is split between variants
    [key in TestVariant]?: number;          // Percentage allocation (0-100)
  };
  startDate: Date;                          // When the test starts
  endDate?: Date;                           // When the test ends (optional)
  minimumSampleSize: number;                // Minimum samples needed for statistical significance
  isActive: boolean;                        // Whether the test is currently active
}

/**
 * Configuration for a specific variant in a test
 */
export interface VariantConfig {
  id: string;                               // Unique variant identifier
  description: string;                      // Variant description
  implementation: {                         // How this variant is implemented
    pipelineOptions?: Record<string, any>;  // Custom pipeline options
    modelSettings?: Record<string, any>;    // Custom model settings
    promptTemplate?: string;                // Custom prompt template
    componentProps?: Record<string, any>;   // Custom component props
    agentConfig?: Record<string, any>;      // Custom agent configuration
    customLogic?: string;                   // Reference to custom implementation
  };
}

/**
 * Tracks a user session within a test
 */
export interface TestSession {
  sessionId: string;                        // Unique session identifier
  testId: string;                           // Test this session belongs to
  assignedVariant: TestVariant;             // Which variant was shown
  startTime: Date;                          // When the session started
  endTime?: Date;                           // When the session ended
  completed: boolean;                       // Whether generation completed
  interactionEvents: InteractionEvent[];    // User interaction events
  feedbackData: FeedbackData[];             // Collected feedback
  performanceMetrics: {                     // Measured performance
    generationTime?: number;                // Time to generate in ms
    tokenUsage?: number;                    // Tokens used
    errorCount?: number;                    // Number of errors encountered
    [key: string]: any;                     // Other metrics
  };
}

/**
 * Tracks a specific user interaction
 */
export interface InteractionEvent {
  eventType: string;                        // Type of interaction
  timestamp: Date;                          // When it occurred
  data: Record<string, any>;                // Event-specific data
}

/**
 * Represents feedback collected from a user
 */
export interface FeedbackData {
  source: FeedbackSource;                   // How feedback was collected
  value: number | string | boolean;         // Feedback value
  metric: TestMetric;                       // What metric this measures
  timestamp: Date;                          // When feedback was given
  context?: Record<string, any>;            // Additional context
}

/**
 * Results of an A/B test analysis
 */
export interface TestResults {
  testId: string;                           // Test identifier
  status: 'running' | 'completed' | 'inconclusive'; // Current status
  sampleSize: {                             // Sample sizes by variant
    [key in TestVariant]?: number;
  };
  metrics: {                                // Results by metric
    [key in TestMetric]?: {
      [variant in TestVariant]?: {
        mean: number;                       // Average value
        median?: number;                    // Median value
        standardDeviation?: number;         // Standard deviation
        confidenceInterval?: [number, number]; // 95% confidence interval
      }
    }
  };
  winner?: TestVariant;                     // Winning variant if determined
  winnerConfidence?: number;                // Confidence in winner (0-1)
  insights: string[];                       // Key insights from the test
  recommendations: string[];                // Recommendations based on results
}

/**
 * User feedback request configuration
 */
export interface FeedbackRequest {
  id: string;                               // Unique request identifier
  sessionId: string;                        // Associated session
  testId: string;                           // Associated test
  type: 'rating' | 'comparison' | 'survey'; // Type of feedback requested
  prompt: string;                           // Question to ask user
  options?: Array<{                         // Possible response options
    id: string;
    label: string;
    value: any;
  }>;
  required: boolean;                        // Whether feedback is required
  displayTiming: 'immediate' | 'after_completion' | 'delayed'; // When to show
  dismissible: boolean;                     // Can user dismiss without answering
}