import { 
  TestConfig, 
  TestVariant, 
  TestComponent, 
  TestMetric, 
  FeedbackSource 
} from '../types';

/**
 * Sample A/B test configuration for SVG generation
 */
export const svgGenerationTest: TestConfig = {
  id: 'svg_generation_prompt_techniques',
  name: 'SVG Generation Prompt Techniques',
  description: 'Tests different prompt engineering approaches for SVG logo generation',
  component: TestComponent.SVG_GENERATION_APPROACH,
  variants: {
    [TestVariant.A]: {
      id: 'standard_approach',
      description: 'Current standard approach to SVG generation',
      implementation: {
        // Uses the default approach, no changes
      }
    },
    [TestVariant.B]: {
      id: 'enhanced_approach',
      description: 'Enhanced approach with detailed design principles',
      implementation: {
        customLogic: 'enhancedSvgGeneration',
        modelSettings: {
          temperature: 0.7
        }
      }
    }
  },
  metrics: [
    TestMetric.LOGO_QUALITY,
    TestMetric.USER_SATISFACTION,
    TestMetric.GENERATION_SPEED
  ],
  feedbackSources: [
    FeedbackSource.EXPLICIT_RATING,
    FeedbackSource.COMPARATIVE_SELECTION
  ],
  trafficAllocation: {
    [TestVariant.A]: 50,
    [TestVariant.B]: 50
  },
  startDate: new Date('2025-06-15'),
  endDate: new Date('2025-07-15'),
  minimumSampleSize: 30,
  isActive: true
};

/**
 * Sample A/B test configuration for UI layout
 */
export const uiLayoutTest: TestConfig = {
  id: 'logo_display_layout',
  name: 'Logo Display Layout Test',
  description: 'Tests different UI layouts for displaying generated logos',
  component: TestComponent.UI_LAYOUT,
  variants: {
    [TestVariant.A]: {
      id: 'standard_layout',
      description: 'Current standard centered layout',
      implementation: {
        componentProps: {
          layout: 'centered'
        }
      }
    },
    [TestVariant.B]: {
      id: 'asymmetrical_layout',
      description: 'New asymmetrical layout with side panels',
      implementation: {
        componentProps: {
          layout: 'asymmetrical'
        }
      }
    }
  },
  metrics: [
    TestMetric.USER_SATISFACTION,
    TestMetric.ENGAGEMENT,
    TestMetric.CONVERSION_RATE
  ],
  feedbackSources: [
    FeedbackSource.EXPLICIT_RATING,
    FeedbackSource.IMPLICIT_BEHAVIOR
  ],
  trafficAllocation: {
    [TestVariant.A]: 50,
    [TestVariant.B]: 50
  },
  startDate: new Date('2025-06-15'),
  minimumSampleSize: 50,
  isActive: true
};

/**
 * Sample A/B test configuration for moodboard style
 */
export const moodboardTest: TestConfig = {
  id: 'moodboard_approach',
  name: 'Moodboard Generation Approach',
  description: 'Tests different strategies for generating moodboards',
  component: TestComponent.MOODBOARD_STYLE,
  variants: {
    [TestVariant.A]: {
      id: 'text_only',
      description: 'Standard text-only concept descriptions',
      implementation: {
        // Default approach
      }
    },
    [TestVariant.B]: {
      id: 'visual_elements',
      description: 'Enhanced with visual style descriptions and references',
      implementation: {
        promptTemplate: 'Use vivid visual language and style references from established design systems. Describe textures, patterns, and spatial relationships in detail.',
        modelSettings: {
          temperature: 0.8
        }
      }
    },
    [TestVariant.C]: {
      id: 'industry_templates',
      description: 'Industry-specific templates and benchmarks',
      implementation: {
        pipelineOptions: {
          useIndustryTemplates: true
        },
        customLogic: 'industrySpecificMoodboard'
      }
    }
  },
  metrics: [
    TestMetric.LOGO_QUALITY,
    TestMetric.USER_SATISFACTION
  ],
  feedbackSources: [
    FeedbackSource.EXPLICIT_RATING,
    FeedbackSource.COMPARATIVE_SELECTION
  ],
  trafficAllocation: {
    [TestVariant.A]: 34,
    [TestVariant.B]: 33,
    [TestVariant.C]: 33
  },
  startDate: new Date('2025-06-15'),
  minimumSampleSize: 30,
  isActive: true
};

/**
 * Sample A/B test configuration for model selection
 */
export const modelSelectionTest: TestConfig = {
  id: 'ai_model_selection',
  name: 'AI Model Selection',
  description: 'Tests different Claude models for logo generation',
  component: TestComponent.GENERATION_MODEL,
  variants: {
    [TestVariant.A]: {
      id: 'claude_sonnet',
      description: 'Claude 3.5 Sonnet for all stages',
      implementation: {
        modelSettings: {
          model: 'claude-3-5-sonnet-20240620'
        }
      }
    },
    [TestVariant.B]: {
      id: 'mixed_models',
      description: 'Sonnet for creative tasks, Haiku for analysis',
      implementation: {
        pipelineOptions: {
          models: {
            stageA: 'claude-3-5-haiku-20240307',
            stageB: 'claude-3-5-sonnet-20240620',
            stageC: 'claude-3-5-haiku-20240307',
            stageD: 'claude-3-5-sonnet-20240620',
            stageF: 'claude-3-5-haiku-20240307',
            stageG: 'claude-3-5-sonnet-20240620'
          }
        }
      }
    }
  },
  metrics: [
    TestMetric.LOGO_QUALITY,
    TestMetric.GENERATION_SPEED,
    TestMetric.TOKEN_EFFICIENCY
  ],
  feedbackSources: [
    FeedbackSource.EXPLICIT_RATING,
    FeedbackSource.EXPERT_EVALUATION
  ],
  trafficAllocation: {
    [TestVariant.A]: 50,
    [TestVariant.B]: 50
  },
  startDate: new Date('2025-06-15'),
  minimumSampleSize: 30,
  isActive: true
};

/**
 * All sample test configurations
 */
export const sampleTests: TestConfig[] = [
  svgGenerationTest,
  uiLayoutTest,
  moodboardTest,
  modelSelectionTest
];