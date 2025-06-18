/**
 * @file performance-monitor.ts
 * @module lib/utils/performance-monitor
 * @description Performance monitoring utilities for the AI Logo Generator
 * 
 * This module provides performance monitoring capabilities including:
 * - Request timing and tracking
 * - Memory usage monitoring
 * - API call tracking
 * - Token usage monitoring
 * - Pipeline stage performance metrics
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 * @copyright 2024
 */

/**
 * @interface PerformanceMetric
 * @description Represents a single performance metric data point
 * @property {string} id - Unique identifier for the metric
 * @property {string} name - Human-readable name of the metric
 * @property {string} category - Category of the metric (e.g., 'api', 'pipeline', 'memory')
 * @property {number} value - The metric value
 * @property {string} unit - Unit of measurement (e.g., 'ms', 'bytes', 'count')
 * @property {number} timestamp - When the metric was recorded
 * @property {Record<string, any>} [metadata] - Additional contextual information
 */
export interface PerformanceMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * @interface TimingMetric
 * @description Specialized performance metric for timing measurements
 * @extends PerformanceMetric
 * @property {number} startTime - When the timing started
 * @property {number} endTime - When the timing ended
 * @property {number} duration - Total duration in milliseconds
 */
export interface TimingMetric extends PerformanceMetric {
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * @interface APIMetric
 * @description Specialized performance metric for API calls
 * @extends TimingMetric
 * @property {string} endpoint - The API endpoint called
 * @property {string} method - The HTTP method used
 * @property {number} statusCode - The HTTP status code returned
 * @property {number} [requestSize] - Size of the request in bytes
 * @property {number} [responseSize] - Size of the response in bytes
 */
export interface APIMetric extends TimingMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  requestSize?: number;
  responseSize?: number;
}

/**
 * @interface TokenUsageMetric
 * @description Specialized performance metric for token usage
 * @extends PerformanceMetric
 * @property {string} model - The AI model used
 * @property {number} promptTokens - Number of prompt tokens used
 * @property {number} completionTokens - Number of completion tokens used
 * @property {number} totalTokens - Total tokens used
 * @property {number} [cost] - Estimated cost in USD
 */
export interface TokenUsageMetric extends PerformanceMetric {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

/**
 * @interface PipelineMetric
 * @description Specialized performance metric for pipeline stages
 * @extends TimingMetric
 * @property {string} stageId - Identifier of the pipeline stage
 * @property {string} stageName - Human-readable name of the stage
 * @property {boolean} success - Whether the stage completed successfully
 * @property {TokenUsageMetric} [tokenUsage] - Token usage metrics if applicable
 */
export interface PipelineMetric extends TimingMetric {
  stageId: string;
  stageName: string;
  success: boolean;
  tokenUsage?: TokenUsageMetric;
}

/**
 * @interface MemoryMetric
 * @description Specialized performance metric for memory usage
 * @extends PerformanceMetric
 * @property {number} heapUsed - Heap memory used in bytes
 * @property {number} heapTotal - Total heap size in bytes
 * @property {number} external - External memory usage in bytes
 * @property {number} rss - Resident set size in bytes
 */
export interface MemoryMetric extends PerformanceMetric {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * @type MetricConsumer
 * @description Function type for consuming metrics
 */
export type MetricConsumer = (metric: PerformanceMetric) => void;

/**
 * @class PerformanceMonitor
 * @description Singleton class for monitoring and recording performance metrics
 * 
 * Provides methods for tracking various performance aspects including:
 * - API call timing and response sizes
 * - Pipeline stage performance
 * - Memory usage tracking
 * - Token usage and cost estimation
 * 
 * @example
 * // Start timing an operation
 * const timerId = PerformanceMonitor.getInstance().startTimer('database-query', 'database');
 * 
 * // Perform the operation
 * const results = await db.query(...);
 * 
 * // End the timer and record the metric
 * PerformanceMonitor.getInstance().endTimer(timerId, { records: results.length });
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, { start: number; name: string; category: string }> = new Map();
  private consumers: MetricConsumer[] = [];
  private maxMetricsCount: number = 1000;
  private enabled: boolean = true;
  
  /**
   * @constructor
   * @private
   * @description Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Check if we're in a Node.js environment with process.env
    if (typeof process !== 'undefined' && process.env) {
      this.enabled = process.env.PERFORMANCE_MONITORING !== 'false';
      
      // Parse max metrics count from environment
      const maxCount = parseInt(process.env.PERFORMANCE_METRICS_MAX_COUNT || '1000', 10);
      if (!isNaN(maxCount) && maxCount > 0) {
        this.maxMetricsCount = maxCount;
      }
    }
  }
  
  /**
   * @static
   * @method getInstance
   * @description Gets the singleton instance of the PerformanceMonitor
   * @returns {PerformanceMonitor} The singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * @method isEnabled
   * @description Checks if performance monitoring is enabled
   * @returns {boolean} Whether monitoring is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * @method setEnabled
   * @description Enables or disables performance monitoring
   * @param {boolean} enabled - Whether monitoring should be enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * @method addConsumer
   * @description Adds a metric consumer function to receive metrics in real-time
   * @param {MetricConsumer} consumer - Function to consume metrics
   */
  public addConsumer(consumer: MetricConsumer): void {
    this.consumers.push(consumer);
  }
  
  /**
   * @method removeConsumer
   * @description Removes a previously added metric consumer
   * @param {MetricConsumer} consumer - The consumer function to remove
   */
  public removeConsumer(consumer: MetricConsumer): void {
    const index = this.consumers.indexOf(consumer);
    if (index !== -1) {
      this.consumers.splice(index, 1);
    }
  }
  
  /**
   * @method recordMetric
   * @description Records a generic performance metric
   * @param {Omit<PerformanceMetric, 'id' | 'timestamp'>} metric - The metric to record
   * @returns {string} The ID of the recorded metric
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string {
    if (!this.enabled) return '';
    
    const id = this.generateId();
    const timestamp = Date.now();
    
    const fullMetric: PerformanceMetric = {
      ...metric,
      id,
      timestamp
    };
    
    this.addMetric(fullMetric);
    return id;
  }
  
  /**
   * @method startTimer
   * @description Starts timing an operation
   * @param {string} name - Name of the operation
   * @param {string} category - Category of the operation
   * @param {Record<string, any>} [metadata] - Additional information about the operation
   * @returns {string} Timer ID for use with endTimer
   * 
   * @example
   * const timerId = monitor.startTimer('database-query', 'database', { table: 'users' });
   * // ... perform operation ...
   * monitor.endTimer(timerId, { records: 42 });
   */
  public startTimer(name: string, category: string, metadata?: Record<string, any>): string {
    if (!this.enabled) return '';
    
    const id = this.generateId();
    const start = Date.now();
    
    this.activeTimers.set(id, { start, name, category });
    
    return id;
  }
  
  /**
   * @method endTimer
   * @description Ends a previously started timer and records the timing metric
   * @param {string} id - Timer ID returned from startTimer
   * @param {Record<string, any>} [metadata] - Additional information about the operation
   * @returns {TimingMetric | null} The recorded timing metric or null if timer not found
   */
  public endTimer(id: string, metadata?: Record<string, any>): TimingMetric | null {
    if (!this.enabled || !id) return null;
    
    const timer = this.activeTimers.get(id);
    if (!timer) return null;
    
    const endTime = Date.now();
    const duration = endTime - timer.start;
    
    const metric: TimingMetric = {
      id,
      name: timer.name,
      category: timer.category,
      value: duration,
      unit: 'ms',
      timestamp: endTime,
      startTime: timer.start,
      endTime,
      duration,
      metadata
    };
    
    this.addMetric(metric);
    this.activeTimers.delete(id);
    
    return metric;
  }
  
  /**
   * @method recordAPICall
   * @description Records metrics for an API call
   * @param {Omit<APIMetric, 'id' | 'timestamp' | 'duration' | 'value' | 'unit'>} metric - API call details
   * @returns {string} The ID of the recorded metric
   */
  public recordAPICall(metric: Omit<APIMetric, 'id' | 'timestamp' | 'duration' | 'value' | 'unit'>): string {
    if (!this.enabled) return '';
    
    const duration = metric.endTime - metric.startTime;
    
    const apiMetric: APIMetric = {
      id: this.generateId(),
      name: `API: ${metric.endpoint}`,
      category: 'api',
      value: duration,
      unit: 'ms',
      timestamp: metric.endTime,
      duration,
      ...metric
    };
    
    this.addMetric(apiMetric);
    return apiMetric.id;
  }
  
  /**
   * @method recordTokenUsage
   * @description Records token usage metrics from AI model calls
   * @param {Omit<TokenUsageMetric, 'id' | 'timestamp' | 'value' | 'unit'>} metric - Token usage details
   * @returns {string} The ID of the recorded metric
   */
  public recordTokenUsage(metric: Omit<TokenUsageMetric, 'id' | 'timestamp' | 'value' | 'unit'>): string {
    if (!this.enabled) return '';
    
    const tokenMetric: TokenUsageMetric = {
      id: this.generateId(),
      name: `Tokens: ${metric.model}`,
      category: 'tokens',
      value: metric.totalTokens,
      unit: 'tokens',
      timestamp: Date.now(),
      ...metric
    };
    
    this.addMetric(tokenMetric);
    return tokenMetric.id;
  }
  
  /**
   * @method recordPipelineStage
   * @description Records performance metrics for a pipeline stage
   * @param {Omit<PipelineMetric, 'id' | 'timestamp' | 'duration' | 'value' | 'unit'>} metric - Pipeline stage details
   * @returns {string} The ID of the recorded metric
   */
  public recordPipelineStage(metric: Omit<PipelineMetric, 'id' | 'timestamp' | 'duration' | 'value' | 'unit'>): string {
    if (!this.enabled) return '';
    
    const duration = metric.endTime - metric.startTime;
    
    const pipelineMetric: PipelineMetric = {
      id: this.generateId(),
      name: `Stage: ${metric.stageName}`,
      category: 'pipeline',
      value: duration,
      unit: 'ms',
      timestamp: metric.endTime,
      duration,
      ...metric
    };
    
    this.addMetric(pipelineMetric);
    return pipelineMetric.id;
  }
  
  /**
   * @method recordMemoryUsage
   * @description Records current memory usage metrics
   * @param {Record<string, any>} [metadata] - Additional information
   * @returns {string} The ID of the recorded metric
   */
  public recordMemoryUsage(metadata?: Record<string, any>): string {
    if (!this.enabled) return '';
    
    // Check if we're in a Node.js environment with process.memoryUsage
    if (typeof process === 'undefined' || !process.memoryUsage) {
      // Use browser memory API if available
      if (typeof performance !== 'undefined' && performance.memory) {
        const memory = performance.memory as any;
        
        const memoryMetric: Partial<MemoryMetric> = {
          id: this.generateId(),
          name: 'Browser Memory Usage',
          category: 'memory',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          timestamp: Date.now(),
          heapUsed: memory.usedJSHeapSize,
          heapTotal: memory.totalJSHeapSize,
          metadata
        };
        
        this.addMetric(memoryMetric as MemoryMetric);
        return memoryMetric.id as string;
      }
      
      return '';
    }
    
    const memory = process.memoryUsage();
    
    const memoryMetric: MemoryMetric = {
      id: this.generateId(),
      name: 'Memory Usage',
      category: 'memory',
      value: memory.heapUsed,
      unit: 'bytes',
      timestamp: Date.now(),
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      rss: memory.rss,
      metadata
    };
    
    this.addMetric(memoryMetric);
    return memoryMetric.id;
  }
  
  /**
   * @method getMetrics
   * @description Gets all recorded metrics
   * @param {Object} [options] - Options for filtering metrics
   * @param {string} [options.category] - Filter by metric category
   * @param {number} [options.since] - Filter metrics recorded after this timestamp
   * @param {number} [options.limit] - Maximum number of metrics to return
   * @returns {PerformanceMetric[]} Array of metrics matching the filters
   */
  public getMetrics(options?: { 
    category?: string; 
    since?: number; 
    limit?: number 
  }): PerformanceMetric[] {
    if (!this.enabled) return [];
    
    let result = [...this.metrics];
    
    // Apply filters
    if (options) {
      if (options.category) {
        result = result.filter(m => m.category === options.category);
      }
      
      if (options.since) {
        result = result.filter(m => m.timestamp >= options.since);
      }
    }
    
    // Sort by timestamp (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (options?.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  /**
   * @method getSummary
   * @description Gets a summary of performance metrics by category
   * @returns {Record<string, { count: number; avgValue: number; minValue: number; maxValue: number; }>}
   * Summary statistics for each metric category
   */
  public getSummary(): Record<string, { 
    count: number; 
    avgValue: number; 
    minValue: number; 
    maxValue: number;
    totalValue: number;
    unit: string;
  }> {
    if (!this.enabled || this.metrics.length === 0) {
      return {};
    }
    
    const summary: Record<string, { 
      count: number; 
      avgValue: number; 
      minValue: number; 
      maxValue: number;
      totalValue: number;
      unit: string;
    }> = {};
    
    // Group metrics by category
    const categories = new Set(this.metrics.map(m => m.category));
    
    for (const category of categories) {
      const categoryMetrics = this.metrics.filter(m => m.category === category);
      
      if (categoryMetrics.length === 0) continue;
      
      const values = categoryMetrics.map(m => m.value);
      const unit = categoryMetrics[0].unit;
      const totalValue = values.reduce((sum, val) => sum + val, 0);
      
      summary[category] = {
        count: categoryMetrics.length,
        avgValue: totalValue / categoryMetrics.length,
        minValue: Math.min(...values),
        maxValue: Math.max(...values),
        totalValue,
        unit
      };
    }
    
    return summary;
  }
  
  /**
   * @method clearMetrics
   * @description Clears all recorded metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }
  
  /**
   * @private
   * @method addMetric
   * @description Adds a metric to the internal store and notifies consumers
   * @param {PerformanceMetric} metric - The metric to add
   */
  private addMetric(metric: PerformanceMetric): void {
    // Add to internal store
    this.metrics.push(metric);
    
    // Enforce maximum metrics count
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.maxMetricsCount);
    }
    
    // Notify consumers
    for (const consumer of this.consumers) {
      try {
        consumer(metric);
      } catch (error) {
        console.error('Error in metric consumer:', error);
      }
    }
  }
  
  /**
   * @private
   * @method generateId
   * @description Generates a unique ID for a metric
   * @returns {string} A unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Singleton instance for easy import
 */
export const performanceMonitor = PerformanceMonitor.getInstance();