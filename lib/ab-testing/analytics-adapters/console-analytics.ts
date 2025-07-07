import { TestSession, InteractionEvent, FeedbackData } from '@/lib/types';
import { AnalyticsAdapter } from '../test-manager';

/**
 * Simple console-based analytics adapter for development
 * Logs all events to the console
 */
export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  private readonly debugMode: boolean;

  constructor(debugMode: boolean = true) {
    this.debugMode = debugMode;
  }

  /**
   * Track when a test session starts
   */
  public trackSessionStart(session: TestSession): void {
    if (!this.debugMode) return;

    console.log(`[AB Testing] Session started: ${session.sessionId}`);
    console.log(`  Test: ${session.testId}`);
    console.log(`  Variant: ${session.assignedVariant}`);
    console.log(`  Time: ${session.startTime.toISOString()}`);
  }

  /**
   * Track a user interaction event
   */
  public trackEvent(sessionId: string, event: InteractionEvent): void {
    if (!this.debugMode) return;

    console.log(`[AB Testing] Event in session ${sessionId}`);
    console.log(`  Type: ${event.eventType}`);
    console.log(`  Time: ${event.timestamp.toISOString()}`);
    console.log(`  Data:`, event.data);
  }

  /**
   * Track user feedback
   */
  public trackFeedback(sessionId: string, feedback: FeedbackData): void {
    if (!this.debugMode) return;

    console.log(`[AB Testing] Feedback in session ${sessionId}`);
    console.log(`  Metric: ${feedback.metric}`);
    console.log(`  Source: ${feedback.source}`);
    console.log(`  Value: ${feedback.value}`);
    console.log(`  Time: ${feedback.timestamp.toISOString()}`);

    if (feedback.context) {
      console.log(`  Context:`, feedback.context);
    }
  }

  /**
   * Track when a session completes
   */
  public trackSessionComplete(session: TestSession): void {
    if (!this.debugMode) return;

    console.log(`[AB Testing] Session completed: ${session.sessionId}`);
    console.log(`  Test: ${session.testId}`);
    console.log(`  Variant: ${session.assignedVariant}`);
    console.log(`  Duration: ${this.calculateDuration(session)} ms`);
    console.log(`  Success: ${session.completed}`);
    console.log(`  Metrics:`, session.performanceMetrics);
    console.log(`  Events: ${session.interactionEvents.length}`);
    console.log(`  Feedback items: ${session.feedbackData.length}`);
  }

  /**
   * Calculate session duration in milliseconds
   */
  private calculateDuration(session: TestSession): number {
    if (!session.endTime) return 0;
    return session.endTime.getTime() - session.startTime.getTime();
  }
}
