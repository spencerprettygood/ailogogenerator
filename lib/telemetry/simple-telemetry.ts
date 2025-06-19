/**
 * Simple Telemetry System
 * A lightweight replacement for OpenTelemetry that works reliably with Next.js
 */

type TelemetryProperties = Record<string, string | number | boolean | null>;

interface TelemetryEvent {
  name: string;
  timestamp: number;
  duration?: number;
  properties?: TelemetryProperties;
  userId?: string;
  sessionId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'counter' | 'gauge' | 'histogram';
}

class SimpleTelemetry {
  private events: TelemetryEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV !== 'test';
    
    if (this.isEnabled) {
      this.initializePerformanceObserver();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              type: 'histogram'
            });
          });
        });
        
        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  /**
   * Record a custom event
   */
  recordEvent(name: string, properties?: TelemetryProperties): void {
    if (!this.isEnabled) return;

    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      properties,
      sessionId: this.sessionId
    };

    this.events.push(event);
    
    // Keep only last 1000 events to prevent memory leaks
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Telemetry Event:', event);
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordEvent(`${name}_completed`, { duration });
      this.recordMetric({
        name: `${name}_duration`,
        value: duration,
        timestamp: Date.now(),
        type: 'histogram'
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Record an error
   */
  recordError(error: Error, context?: string): void {
    if (!this.isEnabled) return;

    this.recordEvent('error', {
      message: error.message,
      stack: error.stack || '',
      context: context || '',
      name: error.name
    });

    // Also log to console for debugging
    console.error('🔥 Error recorded:', error, context);
  }

  /**
   * Get current session data (for debugging)
   */
  getSessionData(): { events: TelemetryEvent[]; metrics: PerformanceMetric[]; sessionId: string } {
    return {
      events: [...this.events],
      metrics: [...this.metrics],
      sessionId: this.sessionId
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.events = [];
    this.metrics = [];
  }

  /**
   * Create a span-like interface for compatibility
   */
  createSpan(name: string): {
    setAttributes: (attrs: TelemetryProperties) => void;
    recordException: (error: Error) => void;
    end: () => void;
  } {
    const startTime = performance.now();
    let attributes: TelemetryProperties = {};

    return {
      setAttributes: (attrs: TelemetryProperties) => {
        attributes = { ...attributes, ...attrs };
      },
      recordException: (error: Error) => {
        this.recordError(error, name);
      },
      end: () => {
        const duration = performance.now() - startTime;
        this.recordEvent(name, { ...attributes, duration });
      }
    };
  }
}

// Create singleton instance
const telemetry = new SimpleTelemetry();

export { telemetry, SimpleTelemetry };
export type { TelemetryEvent, PerformanceMetric, TelemetryProperties };
