/**
 * @file cache-manager-extended.ts
 * @description Extended cache manager with additional features
 * 
 * This module enhances the base cache manager with additional features:
 * - Adaptive cache sizing based on memory usage
 * - Enhanced statistics and monitoring
 * - Performance optimization for high-volume operations
 * - Batch operations for efficiency
 * - Structured data type support
 */

import { CacheManager, CacheType, CacheConfig } from './cache-manager';
import { ErrorCategory, handleError } from './error-handler';
import { Logger } from './logger';
import { env } from './env';

/**
 * Enhanced cache statistics
 */
export interface CacheStats {
  /**
   * Basic stats
   */
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  
  /**
   * Performance stats
   */
  averageGetTimeMs: number;
  averageSetTimeMs: number;
  
  /**
   * Temporal stats
   */
  lastCleanupAt: number;
  lastHitAt: number;
  lastMissAt: number;
  createdAt: number;
  
  /**
   * Memory stats
   */
  estimatedMemoryUsageBytes: number;
  
  /**
   * Counts by type
   */
  countsByType: Record<string, number>;
}

/**
 * Extended CacheManager with enhanced capabilities
 */
export class ExtendedCacheManager extends CacheManager {
  private static extendedInstance: ExtendedCacheManager;
  private logger: Logger;
  
  // Stats tracking
  private hits: number = 0;
  private misses: number = 0;
  private getTimes: number[] = [];
  private setTimes: number[] = [];
  private lastHitAt: number = 0;
  private lastMissAt: number = 0;
  private createdAt: number = Date.now();
  private lastCleanupAt: number = 0;
  
  // Memory monitoring
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private adaptiveSizingEnabled: boolean = true;
  private memoryUsageThresholdPercent: number = 80; // Trigger cleanup at 80% of max memory
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
    this.logger = new Logger('ExtendedCacheManager');
    
    // Set up memory monitoring if available
    this.setupMemoryMonitoring();
    
    this.logger.info('ExtendedCacheManager initialized', {
      adaptiveSizing: this.adaptiveSizingEnabled,
      memoryThreshold: `${this.memoryUsageThresholdPercent}%`
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ExtendedCacheManager {
    if (!ExtendedCacheManager.extendedInstance) {
      ExtendedCacheManager.extendedInstance = new ExtendedCacheManager();
    }
    
    return ExtendedCacheManager.extendedInstance;
  }
  
  /**
   * Set up memory monitoring if available
   */
  private setupMemoryMonitoring(): void {
    try {
      // Memory monitoring is only available in Node.js environment
      if (typeof window === 'undefined' && typeof process !== 'undefined' && process.memoryUsage) {
        // Set up periodic memory checks
        this.memoryMonitorInterval = setInterval(() => {
          this.checkMemoryUsage();
        }, 30 * 1000); // Check every 30 seconds
      } else if (typeof window !== 'undefined' && 'performance' in window) {
        // Use browser memory API if available
        // @ts-expect-error - MemoryInfo is not in standard TypeScript DOM lib
        if (window.performance && window.performance.memory) {
          this.memoryMonitorInterval = setInterval(() => {
            this.checkBrowserMemoryUsage();
          }, 30 * 1000);
        }
      }
    } catch (error) {
      // Disable adaptive sizing if memory monitoring fails
      this.adaptiveSizingEnabled = false;
      
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { operation: 'setupMemoryMonitoring' },
        logLevel: 'warn'
      });
    }
  }
  
  /**
   * Check memory usage in Node.js environment
   */
  private checkMemoryUsage(): void {
    try {
      if (typeof process === 'undefined' || !process.memoryUsage) return;
      
      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed;
      const heapTotal = memoryUsage.heapTotal;
      const usagePercent = (heapUsed / heapTotal) * 100;
      
      // Log memory usage
      this.logger.debug('Memory usage check', {
        heapUsed: `${Math.round(heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(heapTotal / 1024 / 1024)}MB`,
        usagePercent: `${Math.round(usagePercent)}%`
      });
      
      // If usage is above threshold, trigger cleanup
      if (this.adaptiveSizingEnabled && usagePercent > this.memoryUsageThresholdPercent) {
        this.logger.warn('High memory usage detected, performing cache cleanup', {
          usagePercent: `${Math.round(usagePercent)}%`,
          threshold: `${this.memoryUsageThresholdPercent}%`
        });
        
        this.adaptiveCleanup(usagePercent);
      }
    } catch (error) {
      // Log error but continue
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { operation: 'checkMemoryUsage' },
        logLevel: 'warn',
        silent: true
      });
    }
  }
  
  /**
   * Check memory usage in browser environment
   */
  private checkBrowserMemoryUsage(): void {
    try {
      if (typeof window === 'undefined' || !window.performance) return;
      
      // @ts-expect-error - MemoryInfo is not in standard TypeScript DOM lib
      const memory = window.performance.memory;
      if (!memory) return;
      
      const usedJSHeapSize = memory.usedJSHeapSize;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const usagePercent = (usedJSHeapSize / totalJSHeapSize) * 100;
      
      // Log memory usage
      this.logger.debug('Browser memory usage check', {
        usedHeap: `${Math.round(usedJSHeapSize / 1024 / 1024)}MB`,
        totalHeap: `${Math.round(totalJSHeapSize / 1024 / 1024)}MB`,
        usagePercent: `${Math.round(usagePercent)}%`
      });
      
      // If usage is above threshold, trigger cleanup
      if (this.adaptiveSizingEnabled && usagePercent > this.memoryUsageThresholdPercent) {
        this.logger.warn('High browser memory usage detected, performing cache cleanup', {
          usagePercent: `${Math.round(usagePercent)}%`,
          threshold: `${this.memoryUsageThresholdPercent}%`
        });
        
        this.adaptiveCleanup(usagePercent);
      }
    } catch (error) {
      // Log error but continue
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { operation: 'checkBrowserMemoryUsage' },
        logLevel: 'warn',
        silent: true
      });
    }
  }
  
  /**
   * Perform adaptive cleanup based on memory pressure
   */
  private adaptiveCleanup(usagePercent: number): void {
    try {
      // Calculate how aggressive the cleanup should be based on memory pressure
      const overagePercent = usagePercent - this.memoryUsageThresholdPercent;
      const cleanupPercent = Math.min(90, Math.max(10, overagePercent * 2));
      
      this.logger.info('Performing adaptive cache cleanup', {
        overagePercent: `${Math.round(overagePercent)}%`,
        cleanupPercent: `${Math.round(cleanupPercent)}%`
      });
      
      // Get cache stats to determine which types to clean
      const stats = super.getStats();
      const totalItems = stats.totalSize;
      
      if (totalItems === 0) return;
      
      // For each type, determine how many items to remove
      const typesToClean: Record<CacheType, number> = {
        generation: 0,
        intermediate: 0,
        asset: 0,
        progress: 0
      };
      
      // Calculate items to remove for each type
      for (const type of Object.keys(stats.counts) as CacheType[]) {
        const count = stats.counts[type];
        const removeCount = Math.floor((count * cleanupPercent) / 100);
        typesToClean[type] = removeCount;
      }
      
      this.logger.debug('Adaptive cleanup plan', { typesToClean });
      
      // Perform the cleanup
      let totalRemoved = 0;
      
      for (const [type, count] of Object.entries(typesToClean) as [CacheType, number][]) {
        if (count <= 0) continue;
        
        const removed = this.removeOldestItems(type, count);
        totalRemoved += removed;
      }
      
      this.lastCleanupAt = Date.now();
      
      this.logger.info('Adaptive cleanup completed', {
        totalRemoved,
        remainingItems: this.getStats().totalSize
      });
    } catch (error) {
      // Log error but continue
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { operation: 'adaptiveCleanup' },
        logLevel: 'warn',
        silent: true
      });
    }
  }
  
  /**
   * Remove a specific number of oldest items of a given type
   */
  private removeOldestItems(type: CacheType, count: number): number {
    try {
      if (count <= 0) return 0;
      
      // Access the private cache map (we can do this because we extend the class)
      // @ts-ignore - accessing private member
      const cache = this.cache as Map<string, any>;
      const keyPrefix = `${type}:`;
      
      // Collect items of the specified type
      const items: Array<{ key: string; createdAt: number }> = [];
      
      for (const [key, item] of cache.entries()) {
        if (key.startsWith(keyPrefix)) {
          items.push({
            key,
            createdAt: item.createdAt
          });
        }
      }
      
      // Sort by creation time (oldest first)
      items.sort((a, b) => a.createdAt - b.createdAt);
      
      // Remove the oldest items up to the specified count
      const toRemove = items.slice(0, count);
      
      for (const { key } of toRemove) {
        cache.delete(key);
      }
      
      // @ts-ignore - accessing private member
      this.counts[type] -= toRemove.length;
      
      return toRemove.length;
    } catch (error) {
      // Log error but continue
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'removeOldestItems',
          type,
          count
        },
        logLevel: 'warn',
        silent: true
      });
      
      return 0;
    }
  }
  
  /**
   * Override the get method to add performance tracking
   */
  public override get<T>(key: string, type: CacheType): T | null {
    const startTime = performance.now();
    
    try {
      const result = super.get<T>(key, type);
      
      // Track performance
      const endTime = performance.now();
      this.getTimes.push(endTime - startTime);
      
      // Limit the number of timing samples we keep
      if (this.getTimes.length > 100) {
        this.getTimes.shift();
      }
      
      // Track hit/miss
      if (result !== null) {
        this.hits++;
        this.lastHitAt = Date.now();
      } else {
        this.misses++;
        this.lastMissAt = Date.now();
      }
      
      return result;
    } catch (error) {
      // Log error and return null
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'extendedGet',
          key,
          type
        },
        logLevel: 'warn',
        silent: true
      });
      
      return null;
    }
  }
  
  /**
   * Override the set method to add performance tracking
   */
  public override set<T>(key: string, data: T, type: CacheType, metadata?: Record<string, unknown>): string {
    const startTime = performance.now();
    
    try {
      const result = super.set(key, data, type, metadata);
      
      // Track performance
      const endTime = performance.now();
      this.setTimes.push(endTime - startTime);
      
      // Limit the number of timing samples we keep
      if (this.setTimes.length > 100) {
        this.setTimes.shift();
      }
      
      return result;
    } catch (error) {
      // Log error and return key
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'extendedSet',
          key,
          type
        },
        logLevel: 'warn',
        silent: true
      });
      
      return key;
    }
  }
  
  /**
   * Configure adaptive cache sizing
   */
  public configureAdaptiveSizing(options: {
    enabled?: boolean;
    memoryThresholdPercent?: number;
  }): void {
    if (options.enabled !== undefined) {
      this.adaptiveSizingEnabled = options.enabled;
    }
    
    if (options.memoryThresholdPercent !== undefined) {
      this.memoryUsageThresholdPercent = Math.min(95, Math.max(50, options.memoryThresholdPercent));
    }
    
    this.logger.info('Adaptive sizing configuration updated', {
      enabled: this.adaptiveSizingEnabled,
      memoryThreshold: `${this.memoryUsageThresholdPercent}%`
    });
  }
  
  /**
   * Batch set multiple items at once
   */
  public batchSet<T>(items: Array<{
    key: string;
    data: T;
    type: CacheType;
    metadata?: Record<string, unknown>;
  }>): string[] {
    try {
      return items.map(item => {
        return this.set(item.key, item.data, item.type, item.metadata);
      });
    } catch (error) {
      // Log error and return partial results
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'batchSet',
          itemCount: items.length
        },
        logLevel: 'warn'
      });
      
      return items.map(item => item.key);
    }
  }
  
  /**
   * Batch get multiple items at once
   */
  public batchGet<T>(keys: Array<{
    key: string;
    type: CacheType;
  }>): Array<T | null> {
    try {
      return keys.map(item => {
        return this.get<T>(item.key, item.type);
      });
    } catch (error) {
      // Log error and return empty results
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'batchGet',
          keyCount: keys.length
        },
        logLevel: 'warn'
      });
      
      return keys.map(() => null);
    }
  }
  
  /**
   * Get detailed cache statistics
   */
  public getDetailedStats(): CacheStats {
    try {
      const basicStats = super.getStats();
      const totalHits = this.hits;
      const totalMisses = this.misses;
      const totalOperations = totalHits + totalMisses;
      
      // Calculate average times
      const avgGetTime = this.getTimes.length > 0
        ? this.getTimes.reduce((sum, time) => sum + time, 0) / this.getTimes.length
        : 0;
        
      const avgSetTime = this.setTimes.length > 0
        ? this.setTimes.reduce((sum, time) => sum + time, 0) / this.setTimes.length
        : 0;
      
      // Estimate memory usage
      let estimatedMemoryUsage = 0;
      
      // @ts-ignore - accessing private member
      const cache = this.cache as Map<string, any>;
      
      for (const [key, value] of cache.entries()) {
        // Rough estimate: key length + JSON stringified value length * 2 bytes per char
        let valueSize = 0;
        
        try {
          // Try to get size via JSON
          valueSize = JSON.stringify(value).length * 2;
        } catch (e) {
          // Fallback to a basic estimate
          valueSize = 1000; // Default guess for complex objects
        }
        
        estimatedMemoryUsage += (key.length * 2) + valueSize;
      }
      
      return {
        // Basic stats
        size: basicStats.totalSize,
        hits: totalHits,
        misses: totalMisses,
        hitRate: totalOperations > 0 ? totalHits / totalOperations : 0,
        
        // Performance stats
        averageGetTimeMs: avgGetTime,
        averageSetTimeMs: avgSetTime,
        
        // Temporal stats
        lastCleanupAt: this.lastCleanupAt,
        lastHitAt: this.lastHitAt,
        lastMissAt: this.lastMissAt,
        createdAt: this.createdAt,
        
        // Memory stats
        estimatedMemoryUsageBytes: estimatedMemoryUsage,
        
        // Counts by type
        countsByType: { ...basicStats.counts }
      };
    } catch (error) {
      // Log error and return minimal stats
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { operation: 'getDetailedStats' },
        logLevel: 'warn'
      });
      
      return {
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageGetTimeMs: 0,
        averageSetTimeMs: 0,
        lastCleanupAt: 0,
        lastHitAt: 0,
        lastMissAt: 0,
        createdAt: this.createdAt,
        estimatedMemoryUsageBytes: 0,
        countsByType: {
          generation: 0,
          intermediate: 0,
          asset: 0,
          progress: 0
        }
      };
    }
  }
  
  /**
   * Clean up resources
   */
  public override dispose(): void {
    super.dispose();
    
    // Clean up memory monitoring
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
    
    this.logger.info('ExtendedCacheManager disposed');
  }
}

/**
 * Singleton instance for convenience
 */
export const extendedCacheManager = ExtendedCacheManager.getInstance();