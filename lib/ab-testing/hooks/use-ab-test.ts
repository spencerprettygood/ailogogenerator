import { useState, useEffect, useCallback } from 'react';
import { 
  TestVariant, 
  TestComponent,
  InteractionEvent,
  FeedbackData,
  TestSession
} from '../types';
import { getTestManager } from '../index';

interface UseAbTestOptions {
  testId: string;
  component: TestComponent;
  userId?: string;
  onAssignment?: (variant: TestVariant) => void;
}

interface UseAbTestResult {
  variant: TestVariant;
  sessionId: string | null;
  isLoading: boolean;
  trackEvent: (eventType: string, data: Record<string, any>) => void;
  recordFeedback: (metric: string, value: number | string | boolean, source: string) => void;
  completeTest: (metrics: Record<string, any>, success?: boolean) => void;
}

/**
 * React hook for integrating A/B testing into components
 */
export function useAbTest({
  testId,
  component,
  userId,
  onAssignment
}: UseAbTestOptions): UseAbTestResult {
  const [variant, setVariant] = useState<TestVariant>(TestVariant.A);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize the test on component mount
  useEffect(() => {
    const initializeTest = async () => {
      try {
        setIsLoading(true);
        
        const testManager = getTestManager();
        const activeTest = testManager.getActiveTestForComponent(component);
        
        // If no active test for this component, use default variant
        if (!activeTest) {
          setVariant(TestVariant.A);
          setIsLoading(false);
          return;
        }
        
        // Assign variant
        const assignedVariant = testManager.assignVariant(testId, userId);
        setVariant(assignedVariant);
        
        // Create session
        const newSessionId = testManager.createSession(testId, assignedVariant, userId);
        setSessionId(newSessionId);
        
        // Notify callback if provided
        if (onAssignment) {
          onAssignment(assignedVariant);
        }
      } catch (error) {
        console.error('Error initializing A/B test:', error);
        // Fall back to default variant
        setVariant(TestVariant.A);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeTest();
    
    // Cleanup
    return () => {
      // If the component unmounts before completion, we could
      // potentially track this as an incomplete session
    };
  }, [testId, component, userId, onAssignment]);

  /**
   * Track a user interaction event
   */
  const trackEvent = useCallback((eventType: string, data: Record<string, any>) => {
    if (!sessionId) return;
    
    const event: InteractionEvent = {
      eventType,
      timestamp: new Date(),
      data
    };
    
    try {
      const testManager = getTestManager();
      testManager.trackEvent(sessionId, event);
    } catch (error) {
      console.error('Error tracking A/B test event:', error);
    }
  }, [sessionId]);

  /**
   * Record user feedback
   */
  const recordFeedback = useCallback((metric: string, value: number | string | boolean, source: string) => {
    if (!sessionId) return;
    
    const feedback: FeedbackData = {
      metric,
      value,
      source,
      timestamp: new Date()
    };
    
    try {
      const testManager = getTestManager();
      testManager.recordFeedback(sessionId, feedback);
    } catch (error) {
      console.error('Error recording A/B test feedback:', error);
    }
  }, [sessionId]);

  /**
   * Complete the test with performance metrics
   */
  const completeTest = useCallback((metrics: Record<string, any>, success: boolean = true) => {
    if (!sessionId) return;
    
    try {
      const testManager = getTestManager();
      testManager.completeSession(sessionId, metrics, success);
    } catch (error) {
      console.error('Error completing A/B test:', error);
    }
  }, [sessionId]);

  return {
    variant,
    sessionId,
    isLoading,
    trackEvent,
    recordFeedback,
    completeTest
  };
}