import { 
  TestConfig, 
  TestVariant, 
  TestSession, 
  FeedbackData, 
  TestResults,
  FeedbackRequest,
  InteractionEvent
} from './types';

/**
 * Manages the full lifecycle of A/B tests in the logo generation system
 */
export class TestManager {
  private activeTests: Map<string, TestConfig> = new Map();
  private sessions: Map<string, TestSession> = new Map();
  private storageAdapter: StorageAdapter;
  private analyticsAdapter: AnalyticsAdapter;

  constructor(
    storageAdapter: StorageAdapter,
    analyticsAdapter: AnalyticsAdapter
  ) {
    this.storageAdapter = storageAdapter;
    this.analyticsAdapter = analyticsAdapter;
    this.loadActiveTests();
  }

  /**
   * Load active tests from storage
   */
  private async loadActiveTests(): Promise<void> {
    try {
      const tests = await this.storageAdapter.getActiveTests();
      tests.forEach(test => {
        if (test.isActive) {
          this.activeTests.set(test.id, test);
        }
      });
      console.log(`Loaded ${this.activeTests.size} active A/B tests`);
    } catch (error) {
      console.error('Failed to load active tests:', error);
    }
  }

  /**
   * Get active test for a specific component
   */
  public getActiveTestForComponent(component: string): TestConfig | null {
    for (const test of this.activeTests.values()) {
      if (test.component === component && test.isActive) {
        return test;
      }
    }
    return null;
  }

  /**
   * Assign a variant to a user session based on test configuration
   */
  public assignVariant(testId: string, userId?: string): TestVariant {
    const test = this.activeTests.get(testId);
    if (!test) {
      return TestVariant.A; // Default to control if test not found
    }

    // Check if user already assigned in this test (for consistent experience)
    if (userId) {
      const existingSession = this.findSessionByUserAndTest(userId, testId);
      if (existingSession) {
        return existingSession.assignedVariant;
      }
    }

    // Otherwise assign based on traffic allocation
    const randomValue = Math.random() * 100;
    let cumulativePercentage = 0;

    for (const [variant, percentage] of Object.entries(test.trafficAllocation)) {
      cumulativePercentage += percentage || 0;
      if (randomValue <= cumulativePercentage) {
        return variant as TestVariant;
      }
    }

    // Fallback to control variant
    return TestVariant.A;
  }

  /**
   * Find existing session by user ID and test ID
   */
  private findSessionByUserAndTest(userId: string, testId: string): TestSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.testId === testId && session.sessionId.includes(userId)) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Create a new test session
   */
  public createSession(testId: string, variant: TestVariant, userId?: string): string {
    const sessionId = `${testId}_${userId || 'anonymous'}_${Date.now()}`;
    
    const session: TestSession = {
      sessionId,
      testId,
      assignedVariant: variant,
      startTime: new Date(),
      completed: false,
      interactionEvents: [],
      feedbackData: [],
      performanceMetrics: {}
    };

    this.sessions.set(sessionId, session);
    this.storageAdapter.saveSession(session);
    this.analyticsAdapter.trackSessionStart(session);
    
    return sessionId;
  }

  /**
   * Track user interaction event
   */
  public trackEvent(sessionId: string, event: InteractionEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.interactionEvents.push(event);
    this.analyticsAdapter.trackEvent(sessionId, event);
    this.storageAdapter.updateSession(session);
  }

  /**
   * Record user feedback
   */
  public recordFeedback(sessionId: string, feedback: FeedbackData): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.feedbackData.push(feedback);
    this.analyticsAdapter.trackFeedback(sessionId, feedback);
    this.storageAdapter.updateSession(session);
  }

  /**
   * Complete a session with final performance metrics
   */
  public completeSession(
    sessionId: string, 
    performanceMetrics: Record<string, any>,
    success: boolean = true
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.completed = success;
    session.endTime = new Date();
    session.performanceMetrics = {
      ...session.performanceMetrics,
      ...performanceMetrics
    };

    this.analyticsAdapter.trackSessionComplete(session);
    this.storageAdapter.updateSession(session);
    
    // Clean up memory (session still in storage)
    this.sessions.delete(sessionId);
  }

  /**
   * Create a feedback request for a user
   */
  public createFeedbackRequest(
    sessionId: string, 
    type: FeedbackRequest['type'], 
    prompt: string,
    options?: FeedbackRequest['options']
  ): FeedbackRequest {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const request: FeedbackRequest = {
      id: `feedback_${sessionId}_${Date.now()}`,
      sessionId,
      testId: session.testId,
      type,
      prompt,
      options,
      required: false,
      displayTiming: 'after_completion',
      dismissible: true
    };

    return request;
  }

  /**
   * Get test results with statistical analysis
   */
  public async getTestResults(testId: string): Promise<TestResults> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const sessions = await this.storageAdapter.getSessionsByTest(testId);
    return this.analyzeTestResults(test, sessions);
  }

  /**
   * Analyze test data to determine results
   */
  private analyzeTestResults(test: TestConfig, sessions: TestSession[]): TestResults {
    // Calculate sample sizes
    const sampleSize: Record<string, number> = {};
    
    for (const variant of Object.keys(test.variants)) {
      sampleSize[variant] = sessions.filter(s => 
        s.assignedVariant === variant && s.completed
      ).length;
    }
    
    // Calculate metrics by variant
    const metricResults: Record<string, Record<string, any>> = {};
    
    for (const metric of test.metrics) {
      metricResults[metric] = {};
      
      for (const variant of Object.keys(test.variants)) {
        const variantSessions = sessions.filter(s => 
          s.assignedVariant === variant && s.completed
        );
        
        if (variantSessions.length === 0) continue;
        
        // Extract metric values from sessions
        const values = this.extractMetricValues(variantSessions, metric);
        
        if (values.length > 0) {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const sortedValues = [...values].sort((a, b) => a - b);
          const median = sortedValues[Math.floor(sortedValues.length / 2)];
          
          // Calculate standard deviation
          const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
          const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          // Calculate 95% confidence interval
          const marginOfError = 1.96 * (stdDev / Math.sqrt(values.length));
          const confidenceInterval: [number, number] = [
            mean - marginOfError,
            mean + marginOfError
          ];
          
          metricResults[metric][variant] = {
            mean,
            median,
            standardDeviation: stdDev,
            confidenceInterval
          };
        }
      }
    }
    
    // Determine winner if possible
    let winner: TestVariant | undefined;
    let winnerConfidence = 0;
    
    // Basic determination - can be enhanced with proper statistical significance testing
    if (test.metrics.length > 0 && Object.keys(metricResults[test.metrics[0]]).length >= 2) {
      const primaryMetric = test.metrics[0];
      const variants = Object.keys(metricResults[primaryMetric]);
      let bestVariant = variants[0];
      let bestScore = metricResults[primaryMetric][bestVariant].mean;
      
      for (let i = 1; i < variants.length; i++) {
        const variant = variants[i];
        const score = metricResults[primaryMetric][variant].mean;
        
        if (score > bestScore) {
          bestVariant = variant;
          bestScore = score;
        }
      }
      
      // Simple confidence calculation (can be replaced with p-value)
      const controlVariant = TestVariant.A;
      if (bestVariant !== controlVariant && metricResults[primaryMetric][controlVariant]) {
        const controlScore = metricResults[primaryMetric][controlVariant].mean;
        const improvement = (bestScore - controlScore) / controlScore;
        
        if (improvement > 0.05) { // 5% improvement threshold
          winner = bestVariant as TestVariant;
          winnerConfidence = Math.min(improvement * 10, 0.99); // Simple conversion to confidence
        }
      }
    }
    
    // Generate insights and recommendations
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    // Basic insights
    for (const metric of test.metrics) {
      if (Object.keys(metricResults[metric]).length >= 2) {
        const variants = Object.keys(metricResults[metric]);
        const variantScores = variants.map(v => ({
          variant: v,
          score: metricResults[metric][v].mean
        }));
        
        variantScores.sort((a, b) => b.score - a.score);
        
        if (variantScores.length >= 2) {
          const topVariant = variantScores[0];
          const secondVariant = variantScores[1];
          const percentDiff = ((topVariant.score - secondVariant.score) / secondVariant.score) * 100;
          
          if (Math.abs(percentDiff) > 5) {
            insights.push(
              `Variant ${topVariant.variant} ${percentDiff > 0 ? 'outperformed' : 'underperformed'} ` +
              `Variant ${secondVariant.variant} by ${Math.abs(percentDiff).toFixed(1)}% on ${metric}`
            );
          }
        }
      }
    }
    
    // Basic recommendations
    if (winner) {
      recommendations.push(`Consider implementing Variant ${winner} as the new standard approach`);
    } else if (insights.length === 0) {
      recommendations.push('Continue testing to gather more data for conclusive results');
    }

    // Determine test status
    const minSampleReached = Object.values(sampleSize).every(
      size => size >= test.minimumSampleSize
    );
    
    const status = !minSampleReached 
      ? 'running' 
      : winner 
        ? 'completed' 
        : 'inconclusive';
    
    return {
      testId: test.id,
      status,
      sampleSize: sampleSize as Record<TestVariant, number>,
      metrics: metricResults as any,
      winner,
      winnerConfidence,
      insights,
      recommendations
    };
  }

  /**
   * Extract numeric values for a specific metric from sessions
   */
  private extractMetricValues(sessions: TestSession[], metric: string): number[] {
    const values: number[] = [];
    
    for (const session of sessions) {
      // Check performance metrics
      if (session.performanceMetrics && metric in session.performanceMetrics) {
        const value = session.performanceMetrics[metric];
        if (typeof value === 'number') {
          values.push(value);
        }
      }
      
      // Check feedback data
      for (const feedback of session.feedbackData) {
        if (feedback.metric === metric && typeof feedback.value === 'number') {
          values.push(feedback.value);
        }
      }
    }
    
    return values;
  }
}

/**
 * Interface for storage implementations
 */
export interface StorageAdapter {
  getActiveTests(): Promise<TestConfig[]>;
  saveTest(test: TestConfig): Promise<void>;
  saveSession(session: TestSession): Promise<void>;
  updateSession(session: TestSession): Promise<void>;
  getSessionsByTest(testId: string): Promise<TestSession[]>;
}

/**
 * Interface for analytics implementations
 */
export interface AnalyticsAdapter {
  trackSessionStart(session: TestSession): void;
  trackEvent(sessionId: string, event: InteractionEvent): void;
  trackFeedback(sessionId: string, feedback: FeedbackData): void;
  trackSessionComplete(session: TestSession): void;
}