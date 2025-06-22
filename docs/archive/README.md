# A/B Testing Framework for AI Logo Generator

This module provides a comprehensive framework for conducting A/B tests on different aspects of the AI Logo Generator. It enables systematic experimentation, user feedback collection, and data-driven decision making to improve logo generation quality and user experience.

## Core Features

- **Variant Testing**: Test different approaches to logo generation, UI layouts, and user interactions
- **Feedback Collection**: Gather explicit and implicit user feedback on generated logos
- **Performance Measurement**: Track metrics like generation time, token usage, and success rates
- **Statistical Analysis**: Analyze test results with proper statistical methods
- **Dashboard**: View test results and insights through a visual dashboard

## Getting Started

### Initialize the Test Manager

```typescript
import { initializeTestManager } from './lib/ab-testing';

// Initialize with persistent storage in production
const testManager = initializeTestManager(
  process.env.NODE_ENV === 'production',
  process.env.NODE_ENV === 'development'
);
```

### Create a Test Configuration

```typescript
import { 
  createTestConfig, 
  TestComponent, 
  TestVariant, 
  TestMetric, 
  FeedbackSource 
} from './lib/ab-testing';

const svgGenerationTest = createTestConfig(
  'svg_generation_approach',
  'SVG Generation Approach Test',
  TestComponent.SVG_GENERATION_APPROACH,
  {
    [TestVariant.A]: {
      id: 'standard_approach',
      description: 'Current standard approach'
    },
    [TestVariant.B]: {
      id: 'enhanced_approach',
      description: 'Enhanced SVG generation with detailed prompts',
      implementation: {
        customLogic: 'enhancedSvgGeneration'
      }
    }
  }
);

// Register the test with the test manager
testManager.registerTest(svgGenerationTest);
```

### Integrate with React Components

```typescript
import { useAbTest } from './lib/ab-testing';

function LogoGeneratorComponent() {
  const {
    variant,
    sessionId,
    trackEvent,
    recordFeedback,
    completeTest
  } = useAbTest({
    testId: 'svg_generation_approach',
    component: TestComponent.SVG_GENERATION_APPROACH
  });

  // Use the assigned variant
  useEffect(() => {
    if (variant === TestVariant.B) {
      // Configure for variant B
    }
  }, [variant]);

  // Track events
  const handleUserInteraction = () => {
    trackEvent('button_click', { detail: 'download_button' });
  };

  // Record feedback
  const handleUserRating = (rating) => {
    recordFeedback('user_satisfaction', rating, 'explicit_rating');
  };

  // Complete the test
  const handleCompletion = () => {
    completeTest({
      generationTime: 5000,
      tokenUsage: 3200
    });
  };

  return (
    <div>
      {/* Component UI */}
    </div>
  );
}
```

## Framework Structure

### Core Types

- `TestVariant`: Enumeration of test variants (A, B, C, D)
- `TestComponent`: Enumeration of testable components/areas
- `TestMetric`: Metrics to measure test performance
- `FeedbackSource`: Methods of collecting feedback
- `TestConfig`: Configuration for an A/B test
- `TestSession`: Tracks a user's participation in a test

### Key Components

- `TestManager`: Core class managing test lifecycle
- `StorageAdapter`: Interface for storing test data
- `AnalyticsAdapter`: Interface for tracking events
- `useAbTest`: React hook for integrating tests
- `FeedbackCollector`: Component for collecting user feedback
- `ComparisonTest`: Component for direct variant comparison
- `ResultsDashboard`: Admin UI for viewing test results

## Best Practices

1. **Define clear hypotheses** before creating tests
2. **Start with small tests** focusing on high-impact areas
3. **Run tests long enough** to reach statistical significance
4. **Collect both explicit and implicit feedback**
5. **Analyze results thoroughly** before implementing changes
6. **Document learnings** from each test
7. **Only test one thing at a time** for clear causality

## Creating Test Variants

To create a test variant:

1. Define the component or pipeline stage to modify
2. Create an alternative implementation
3. Set up the test configuration with appropriate metrics
4. Integrate the test into the component
5. Collect feedback from users
6. Analyze results to determine the better approach

## Example: Testing SVG Generation Approaches

```typescript
// Define the test
const svgGenerationTest = {
  id: 'svg_generation_prompt_techniques',
  component: TestComponent.SVG_GENERATION_APPROACH,
  variants: {
    [TestVariant.A]: { /* Standard approach */ },
    [TestVariant.B]: { /* Enhanced approach */ }
  },
  metrics: [
    TestMetric.LOGO_QUALITY,
    TestMetric.USER_SATISFACTION,
    TestMetric.GENERATION_SPEED
  ]
};

// Create an enhanced SVG generation function
const enhancedSvgGeneration = async (input) => {
  // Alternative implementation with different prompting
};

// Integrate with the logo generator
function LogoGeneratorWithTest() {
  const { variant } = useAbTest({
    testId: 'svg_generation_prompt_techniques',
    component: TestComponent.SVG_GENERATION_APPROACH
  });
  
  // Use the appropriate generation function based on variant
}
```

## Roadmap

- Add more test metrics and analysis tools
- Create pre-built templates for common test scenarios
- Integrate with external analytics platforms
- Add support for multivariate testing (more than two variants)
- Create more visualization options for test results