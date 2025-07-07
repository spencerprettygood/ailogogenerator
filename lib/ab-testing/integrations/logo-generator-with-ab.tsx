import React, { useEffect, useState, useCallback } from 'react';
import { useAbTest } from '../hooks/use-ab-test';
import { TestComponent, TestVariant, TestMetric, FeedbackSource } from '../types';
import { AbVariantDebugger } from '../components/ab-variant-debugger';
import { FeedbackCollector } from '../components/feedback-collector';
import { enhancedSvgGeneration } from '../pipeline-variants/enhanced-svg-generation';

// Import regular components
import LogoGeneratorApp from '../../../components/logo-generator/logo-generator-app';
import CenteredLogoChat from '../../../components/logo-generator/centered-logo-chat';
import AsymmetricalLogoChat from '../../../components/logo-generator/asymmetrical-logo-chat';

interface LogoGeneratorWithAbProps {
  className?: string;
}

/**
 * Integration of A/B testing with the logo generator application
 * This wraps the main application with A/B testing functionality
 */
const LogoGeneratorWithAb: React.FC<LogoGeneratorWithAbProps> = ({ className = '' }) => {
  // Recent events for debugging
  const [events, setEvents] = useState<
    Array<{
      type: string;
      timestamp: string;
      data?: any;
    }>
  >([]);

  // Performance metrics
  const [metrics, setMetrics] = useState<Record<string, any>>({});

  // Hook into UI layout test
  const {
    variant: uiVariant,
    sessionId: uiSessionId,
    trackEvent: trackUiEvent,
    recordFeedback: recordUiFeedback,
    completeTest: completeUiTest,
  } = useAbTest({
    testId: 'logo_display_layout',
    component: TestComponent.UI_LAYOUT,
    userId: 'user123', // Replace with actual user ID in production
    onAssignment: variant => {
      console.log(`UI layout variant assigned: ${variant}`);
    },
  });

  // Hook into SVG generation test
  const {
    variant: svgVariant,
    sessionId: svgSessionId,
    trackEvent: trackSvgEvent,
    recordFeedback: recordSvgFeedback,
    completeTest: completeSvgTest,
  } = useAbTest({
    testId: 'svg_generation_prompt_techniques',
    component: TestComponent.SVG_GENERATION_APPROACH,
  });

  // Track event helper that updates debug UI
  const trackDebugEvent = useCallback(
    (
      sessionId: string | null,
      trackFn: (eventType: string, data: Record<string, any>) => void,
      eventType: string,
      data: Record<string, any> = {}
    ) => {
      if (!sessionId) return;

      // Track the event
      trackFn(eventType, data);

      // Add to debug display
      setEvents(prev =>
        [
          ...prev,
          {
            type: eventType,
            timestamp: new Date().toISOString(),
            data,
          },
        ].slice(-10)
      ); // Keep only most recent 10 events
    },
    []
  );

  // Record metrics helper
  const updateMetrics = useCallback((newMetrics: Record<string, any>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics,
    }));
  }, []);

  // Set up custom handlers for the SVG generation process
  useEffect(() => {
    if (!svgSessionId) return;

    // This would be where we integrate with the actual pipeline
    // to use our variant implementations

    // For example, if we're testing the B variant:
    if (svgVariant === TestVariant.B) {
      // Register our enhanced SVG generation function with the pipeline
      // This is just a demo - actual implementation would depend on your architecture
      console.log('Registering enhanced SVG generation for variant B');

      // Example of how this might be integrated
      window.customSvgGenerationFunction = enhancedSvgGeneration;
    }

    return () => {
      // Clean up any customizations when the component unmounts
      if (window.customSvgGenerationFunction) {
        delete window.customSvgGenerationFunction;
      }
    };
  }, [svgVariant, svgSessionId]);

  // Handler for logo generation start
  const handleGenerationStart = useCallback(() => {
    // Track generation start for both tests
    trackDebugEvent(uiSessionId, trackUiEvent, 'generation_started');
    trackDebugEvent(svgSessionId, trackSvgEvent, 'generation_started');

    // Reset metrics
    updateMetrics({
      generationStartTime: Date.now(),
      stageMetrics: {},
    });
  }, [uiSessionId, svgSessionId, trackUiEvent, trackSvgEvent, trackDebugEvent, updateMetrics]);

  // Handler for generation progress
  const handleGenerationProgress = useCallback(
    (progress: { stage: string; stageProgress: number; overallProgress: number }) => {
      // Track stage transitions
      trackDebugEvent(svgSessionId, trackSvgEvent, 'stage_progress', {
        stage: progress.stage,
        progress: progress.stageProgress,
        overall: progress.overallProgress,
      });

      // Update metrics
      updateMetrics({
        currentStage: progress.stage,
        stageProgress: progress.stageProgress,
        overallProgress: progress.overallProgress,
      });
    },
    [svgSessionId, trackSvgEvent, trackDebugEvent, updateMetrics]
  );

  // Handler for generation completion
  const handleGenerationComplete = useCallback(
    (result: { success: boolean; brandName?: string; logoSvg?: string; error?: any }) => {
      const endTime = Date.now();
      const startTime = metrics.generationStartTime || endTime;
      const generationTime = endTime - startTime;

      // Update final metrics
      updateMetrics({
        generationEndTime: endTime,
        generationTime,
        success: result.success,
      });

      // Track completion events
      trackDebugEvent(
        uiSessionId,
        trackUiEvent,
        result.success ? 'generation_complete' : 'generation_failed',
        { generationTime, brandName: result.brandName }
      );

      trackDebugEvent(
        svgSessionId,
        trackSvgEvent,
        result.success ? 'generation_complete' : 'generation_failed',
        { generationTime, error: result.error }
      );

      // Complete the SVG test (but keep UI test active for interaction tracking)
      if (svgSessionId) {
        completeSvgTest(
          {
            generationTime,
            success: result.success,
          },
          result.success
        );
      }
    },
    [
      metrics.generationStartTime,
      updateMetrics,
      uiSessionId,
      svgSessionId,
      trackUiEvent,
      trackSvgEvent,
      trackDebugEvent,
      completeSvgTest,
    ]
  );

  // Handler for user feedback submission
  const handleFeedbackSubmit = useCallback(
    (
      metric: string,
      value: number | string | boolean,
      source: string,
      context?: Record<string, any>
    ) => {
      // Record for both tests
      if (uiSessionId) {
        recordUiFeedback(metric, value, source);
      }

      if (svgSessionId) {
        recordSvgFeedback(metric, value, source);
      }

      // Update local metrics
      updateMetrics({
        [`feedback_${metric}`]: value,
      });

      // Track the event
      trackDebugEvent(uiSessionId, trackUiEvent, 'feedback_submitted', { metric, value, source });
    },
    [
      uiSessionId,
      svgSessionId,
      recordUiFeedback,
      recordSvgFeedback,
      trackUiEvent,
      trackDebugEvent,
      updateMetrics,
    ]
  );

  // Handler for user interaction with logo
  const handleLogoInteraction = useCallback(
    (interactionType: string, details: any) => {
      trackDebugEvent(uiSessionId, trackUiEvent, `logo_${interactionType}`, details);
    },
    [uiSessionId, trackUiEvent, trackDebugEvent]
  );

  // Complete UI test when component unmounts
  useEffect(() => {
    return () => {
      if (uiSessionId) {
        completeUiTest({
          interactionCount: events.filter(e => e.type.startsWith('logo_')).length,
          sessionDuration: Date.now() - (metrics.sessionStartTime || Date.now()),
        });
      }
    };
  }, [uiSessionId, completeUiTest, events, metrics.sessionStartTime]);

  // Set session start time on first render
  useEffect(() => {
    updateMetrics({
      sessionStartTime: Date.now(),
    });
  }, [updateMetrics]);

  // Render the appropriate UI variant
  const renderUiVariant = () => {
    // Apply the appropriate variant
    switch (uiVariant) {
      case TestVariant.B:
        return (
          <AsymmetricalLogoChat
            onGenerationStart={handleGenerationStart}
            onGenerationProgress={handleGenerationProgress}
            onGenerationComplete={handleGenerationComplete}
            onLogoInteraction={handleLogoInteraction}
          />
        );
      case TestVariant.A:
      default:
        return (
          <CenteredLogoChat
            onGenerationStart={handleGenerationStart}
            onGenerationProgress={handleGenerationProgress}
            onGenerationComplete={handleGenerationComplete}
            onLogoInteraction={handleLogoInteraction}
          />
        );
    }
  };

  return (
    <div className={className}>
      {/* Main application with appropriate variant */}
      {renderUiVariant()}

      {/* Feedback collector */}
      {(uiSessionId || svgSessionId) && (
        <FeedbackCollector
          sessionId={svgSessionId || uiSessionId}
          onSubmitFeedback={handleFeedbackSubmit}
          className="mt-8"
        />
      )}

      {/* Debug information - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <AbVariantDebugger
            testId="logo_display_layout"
            componentId={TestComponent.UI_LAYOUT}
            variant={uiVariant}
            sessionId={uiSessionId}
            metrics={metrics}
            events={events}
          />

          <AbVariantDebugger
            testId="svg_generation_prompt_techniques"
            componentId={TestComponent.SVG_GENERATION_APPROACH}
            variant={svgVariant}
            sessionId={svgSessionId}
            metrics={metrics}
            events={events}
            className="right-72"
          />
        </>
      )}
    </div>
  );
};

export default LogoGeneratorWithAb;
