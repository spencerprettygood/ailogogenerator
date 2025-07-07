/**
 * @file cache-manager.ts
 * @module lib/utils/cache-manager
 * @description A comprehensive caching utility for the AI Logo Generator
 *
 * This module provides an efficient in-memory caching system that:
 * - Stores frequently accessed data for rapid retrieval
 * - Implements configurable TTL (Time To Live) for all cache entries
 * - Supports different cache types (generation results, intermediate results, assets)
 * - Handles automatic cache invalidation and memory management
 * - Provides LRU (Least Recently Used) eviction for memory optimization
 *
 * @author AILogoGenerator Team
 * @version 1.0.0
 * @copyright 2024
 */

import { GenerationResult, LogoBrief, PipelineProgress } from '../types';
import { Logger } from './logger';
import { cacheAdapter } from './cache-adapter';
import { ErrorCategory, ErrorSeverity, createAppError, handleError } from './error-handler';

// Internal types

/**
 * @interface LocalCacheItem
 * @description Represents an item stored in the cache with its metadata
 * @template T The type of data being stored in the cache
 * @property {T} data - The actual cached data
 * @property {number} expiresAt - Timestamp (ms) when this item expires
 * @property {number} createdAt - Timestamp (ms) when this item was created
 * @property {string} key - The unique identifier for this cache item
 * @property {CacheType} type - The type of cached data (generation, asset, etc.)
 */
interface LocalCacheItem<T = unknown> {
  data: T;
  expiresAt: number;
  createdAt: number;
  key: string;
  type: CacheType;
  lastAccessed?: number;
}

/**
 * @type {CacheType}
 * @description Enum-like type for different categories of cached data
 */
export type CacheType = 'generation' | 'intermediate' | 'asset' | 'progress';

/**
 * @interface CacheConfig
 * @description Configuration options for the cache manager
 */
export interface CacheConfig {
  /** Whether the cache is enabled */
  enabled: boolean;

  /** Default TTL for cache entries in milliseconds */
  defaultTTL: number;

  /** TTL for different cache types in milliseconds */
  ttl: {
    generation: number;
    intermediate: number;
    asset: number;
    progress: number;
  };

  /** Maximum number of items to store in the cache */
  maxItems: number;

  /** Clean interval in milliseconds */
  cleanInterval: number;
}

/**
 * @class CacheManager
 * @description Singleton manager for in-memory caching of frequently used data
 *
 * This cache manager provides efficient storage and retrieval of:
 * - Generation results (complete logo packages)
 * - Intermediate results (partial processing results)
 * - Assets (individual files like SVGs, PNGs)
 * - Progress updates (for streaming responses)
 *
 * It implements automatic cleanup, TTL expiration, and memory-safe storage.
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, LocalCacheItem>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private config: CacheConfig;
  private logger: Logger;
  private counts: Record<CacheType, number>;
  private hits: Record<CacheType, number>;
  private misses: Record<CacheType, number>;

  /**
   * Private constructor (use getInstance() instead)
   */
  private constructor() {
    // Initialize the cache
    this.cache = new Map<string, LocalCacheItem>();

    // Set up cache counts by type
    this.counts = {
      generation: 0,
      intermediate: 0,
      asset: 0,
      progress: 0,
    };

    // Set up cache hit/miss counters
    this.hits = {
      generation: 0,
      intermediate: 0,
      asset: 0,
      progress: 0,
    };

    this.misses = {
      generation: 0,
      intermediate: 0,
      asset: 0,
      progress: 0,
    };

    // Initialize configuration with defaults
    this.config = {
      enabled: true,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      ttl: {
        generation: 24 * 60 * 60 * 1000, // 24 hours
        intermediate: 2 * 60 * 60 * 1000, // 2 hours
        asset: 24 * 60 * 60 * 1000, // 24 hours
        progress: 15 * 60 * 1000, // 15 minutes
      },
      maxItems: 1000,
      cleanInterval: 10 * 60 * 1000, // 10 minutes
    };

    // Initialize logger
    this.logger = new Logger('CacheManager');

    // Start the cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get the singleton instance of the cache manager
   *
   * @returns {CacheManager} The singleton cache manager instance
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Start the timer that periodically cleans up expired cache entries
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.config.enabled) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanInterval);
    }
  }

  /**
   * Configure the cache manager with custom settings
   *
   * @param {Partial<CacheConfig>} config - Custom configuration options
   */
  public configure(config: Partial<CacheConfig>): void {
    // Merge the provided config with current config
    this.config = {
      ...this.config,
      ...config,
      ttl: {
        ...this.config.ttl,
        ...(config.ttl || {}),
      },
    };

    // Restart the cleanup timer with new interval if provided
    if (config.cleanInterval) {
      this.startCleanupTimer();
    }

    this.logger.info('Cache manager configured', { config: this.config });
  }

  /**
   * Enable or disable the cache
   *
   * @param {boolean} enabled - Whether to enable the cache
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled && !this.cleanupTimer) {
      this.startCleanupTimer();
    } else if (!enabled && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.logger.info(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear all items from the cache
   */
  public clear(): void {
    this.cache.clear();

    // Reset counts
    for (const type in this.counts) {
      this.counts[type as CacheType] = 0;
    }

    this.logger.info('Cache cleared');
  }

  /**
   * Get cache statistics for monitoring and debugging
   *
   * @returns {object} Cache statistics including size, hit/miss ratio, etc.
   */
  public getStats(): any {
    const totalItems = this.cache.size;
    const totalHits = Object.values(this.hits).reduce((sum, value) => sum + value, 0);
    const totalMisses = Object.values(this.misses).reduce((sum, value) => sum + value, 0);

    const hitRatio = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

    return {
      enabled: this.config.enabled,
      totalItems,
      itemsByType: { ...this.counts },
      hitRatio: hitRatio.toFixed(2),
      hits: { ...this.hits },
      misses: { ...this.misses },
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate the amount of memory being used by the cache
   *
   * @returns {number} Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    try {
      // Rough estimate: 200 bytes overhead per item plus the size of the data
      const ITEM_OVERHEAD = 200;
      let totalSize = 0;

      for (const [key, item] of this.cache.entries()) {
        // Add key size
        totalSize += key.length * 2;

        // Add item overhead
        totalSize += ITEM_OVERHEAD;

        // Add data size (rough estimate)
        if (typeof item.data === 'string') {
          totalSize += item.data.length * 2;
        } else if (item.data && typeof item.data === 'object') {
          // Convert to JSON and measure (rough estimate)
          try {
            const jsonSize = JSON.stringify(item.data).length * 2;
            totalSize += jsonSize;
          } catch (e) {
            // If JSON stringification fails, use a default size
            totalSize += 1000;
          }
        }
      }

      return totalSize;
    } catch (error) {
      this.logger.warn('Error estimating cache memory usage', { error });
      return 0;
    }
  }

  /**
   * Store a value in the cache with the specified key and type
   *
   * @template T Type of data being stored
   * @param {string} key - Unique identifier for the cached item
   * @param {T} value - The data to cache
   * @param {CacheType} type - The type of data being cached
   * @param {number} [ttl] - Optional custom TTL in milliseconds
   * @returns {void}
   */
  public set<T>(key: string, value: T, type: CacheType, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    // If cache is full, evict the least recently used item
    if (this.cache.size >= this.config.maxItems) {
      this.evict();
    }

    const now = Date.now();
    const expiresAt = now + (ttl || this.config.ttl[type] || this.config.defaultTTL);

    const newItem: LocalCacheItem<T> = {
      data: value,
      expiresAt,
      createdAt: now,
      key,
      type,
      lastAccessed: now,
    };

    // If the key already exists, decrement old type count
    if (this.cache.has(key)) {
      const oldItem = this.cache.get(key);
      if (oldItem) {
        this.counts[oldItem.type] = Math.max(0, this.counts[oldItem.type] - 1);
      }
    }

    this.cache.set(key, newItem);
    this.counts[type] = (this.counts[type] || 0) + 1;
    this.logger.info(`Set item in cache`, { key, type, ttl });
  }

  /**
   * Get a value from the cache
   *
   * @template T The type of data to retrieve
   * @param {string} key - The key of the item to retrieve
   * @param {CacheType} type - The type of cache to access
   * @returns {T | null} The cached data or null if not found/expired
   */
  public get<T>(key: string, type: CacheType): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const item = this.cache.get(key);

    if (item && item.type === type) {
      if (item.expiresAt > Date.now()) {
        this.hits[type]++;
        item.lastAccessed = Date.now();
        this.cache.set(key, item); // Update last accessed time
        return item.data as T;
      } else {
        // Item has expired, delete it
        this.delete(key, type);
      }
    }

    this.misses[type]++;
    return null;
  }

  /**
   * Evict the least recently used item from the cache
   */
  private evict(): void {
    let oldestItem: LocalCacheItem | null = null;
    let oldestKey: string | null = null;

    for (const [key, item] of this.cache.entries()) {
      if (!oldestItem || (item.lastAccessed || 0) < (oldestItem.lastAccessed || 0)) {
        oldestItem = item;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const removedType = oldestItem?.type || 'unknown';
      this.cache.delete(oldestKey);

      if (removedType in this.counts) {
        this.counts[removedType as CacheType]--;
      }

      this.logger.debug(`Cache evicted LRU item: ${oldestKey} (${removedType})`);
    }
  }

  /**
   * Cache a generation result for future retrieval
   *
   * @param {LogoBrief} brief - The original logo brief
   * @param {GenerationResult} result - The generation result to cache
   * @param {number} [ttl] - Optional custom TTL in milliseconds
   * @returns {void}
   */
  public cacheGenerationResult(brief: LogoBrief, result: GenerationResult, ttl?: number): void {
    try {
      const key = this.generateBriefKey(brief);
      this.set(key, result, 'generation', ttl);
    } catch (error) {
      this.logger.warn('Failed to cache generation result', { error });
    }
  }

  /**
   * Retrieve a cached generation result
   *
   * @param {LogoBrief} brief - The logo brief to look up
   * @returns {Promise<GenerationResult|null>} The cached result or null if not found
   */
  public async getGenerationResult(brief: LogoBrief): Promise<GenerationResult | null> {
    try {
      const key = this.generateBriefKey(brief);
      return this.get<GenerationResult>(key, 'generation');
    } catch (error) {
      this.logger.warn('Failed to retrieve cached generation result', { error });
      return null;
    }
  }

  /**
   * Cache progress information for a session
   *
   * @param {string} sessionId - The session ID
   * @param {PipelineProgress} progress - The progress data to cache
   * @param {number} [ttl] - Optional custom TTL in milliseconds
   * @returns {void}
   */
  public cacheProgress(sessionId: string, progress: PipelineProgress, ttl?: number): void {
    try {
      const key = `progress:${sessionId}`;
      this.set(key, progress, 'progress', ttl);
    } catch (error) {
      this.logger.warn('Failed to cache progress', { error, sessionId });
    }
  }

  /**
   * Retrieve cached progress information
   *
   * @param {string} sessionId - The session ID to look up
   * @returns {PipelineProgress|null} The cached progress or null if not found
   */
  public getProgress(sessionId: string): PipelineProgress | null {
    try {
      const key = `progress:${sessionId}`;
      return this.get<PipelineProgress>(key, 'progress');
    } catch (error) {
      this.logger.warn('Failed to retrieve cached progress', { error, sessionId });
      return null;
    }
  }

  /**
   * Cache an intermediate result during processing
   *
   * @template T Type of the intermediate data
   * @param {string} key - A unique key for this intermediate result
   * @param {T} data - The data to cache
   * @param {number} [ttl] - Optional custom TTL in milliseconds
   * @returns {void}
   */
  public cacheIntermediate<T>(key: string, data: T, ttl?: number): void {
    try {
      const cacheKey = `intermediate:${key}`;
      this.set(cacheKey, data, 'intermediate', ttl);
    } catch (error) {
      this.logger.warn('Failed to cache intermediate result', { error, key });
    }
  }

  /**
   * Retrieve a cached intermediate result
   *
   * @template T Expected type of the intermediate data
   * @param {string} key - The key to look up
   * @returns {T|null} The cached data or null if not found
   */
  public getIntermediate<T>(key: string): T | null {
    try {
      const cacheKey = `intermediate:${key}`;
      return this.get<T>(cacheKey, 'intermediate');
    } catch (error) {
      this.logger.warn('Failed to retrieve cached intermediate result', { error, key });
      return null;
    }
  }

  /**
   * Cache an asset like an SVG, PNG, etc.
   *
   * @param {string} key - A unique key for this asset
   * @param {string|Buffer} data - The asset data to cache
   * @param {number} [ttl] - Optional custom TTL in milliseconds
   * @returns {void}
   */
  public cacheAsset(key: string, data: string | Buffer, ttl?: number): void {
    try {
      const cacheKey = `asset:${key}`;
      this.set(cacheKey, data, 'asset', ttl);
    } catch (error) {
      this.logger.warn('Failed to cache asset', { error, key });
    }
  }

  /**
   * Retrieve a cached asset
   *
   * @param {string} key - The key to look up
   * @returns {string|Buffer|null} The cached asset or null if not found
   */
  public getAsset(key: string): string | Buffer | null {
    try {
      const cacheKey = `asset:${key}`;
      return this.get<string | Buffer>(cacheKey, 'asset');
    } catch (error) {
      this.logger.warn('Failed to retrieve cached asset', { error, key });
      return null;
    }
  }

  /**
   * Cache an intermediate result for a specific session and agent
   *
   * @param {string} sessionId - The session ID
   * @param {string} agentId - The agent ID
   * @param {any} result - The intermediate result to cache
   * @param {number} [ttl] - Optional custom TTL in milliseconds
   * @returns {void}
   */
  public cacheIntermediateResult(
    sessionId: string,
    agentId: string,
    result: any,
    ttl?: number
  ): void {
    try {
      const cacheKey = `intermediate:${sessionId}:${agentId}`;
      this.set(cacheKey, result, 'intermediate', ttl);
    } catch (error) {
      this.logger.warn('Failed to cache intermediate result', { error, sessionId, agentId });
    }
  }

  /**
   * Retrieve a cached intermediate result for a specific session and agent
   *
   * @param {string} sessionId - The session ID
   * @param {string} agentId - The agent ID
   * @returns {any|null} The cached intermediate result or null if not found
   */
  public getIntermediateResult(sessionId: string, agentId: string): any | null {
    try {
      const cacheKey = `intermediate:${sessionId}:${agentId}`;
      return this.get<any>(cacheKey, 'intermediate');
    } catch (error) {
      this.logger.warn('Failed to retrieve cached intermediate result', {
        error,
        sessionId,
        agentId,
      });
      return null;
    }
  }

  /**
   * Delete an item from the cache
   *
   * @param {string} key - The key of the item to delete
   * @param {CacheType} type - The type of cache to access
   * @returns {boolean} True if an item was deleted, false otherwise
   */
  public delete(key: string, type: CacheType): boolean {
    const item = this.cache.get(key);
    if (item && item.type === type) {
      this.cache.delete(key);
      this.counts[type] = Math.max(0, this.counts[type] - 1);
      this.logger.info(`Deleted item from cache`, { key, type });
      return true;
    }
    return false;
  }

  /**
   * Invalidate a specific cache entry
   *
   * @param {string} key - The cache key to invalidate
   * @param {CacheType} type - The type of cache entry
   * @returns {boolean} True if the item was removed, false if it didn't exist
   */
  public invalidate(key: string, type: CacheType): boolean {
    const item = this.cache.get(key);
    if (item && item.type === type) {
      this.cache.delete(key);
      this.counts[type]--;
      this.logger.debug(`Invalidated cache entry: ${key} (type: ${type})`);
      return true;
    }
    return false;
  }

  /**
   * Invalidate all cache entries of a specific type
   *
   * @param {CacheType} type - The type of cache entries to invalidate
   * @returns {number} Number of items removed
   */
  public invalidateType(type: CacheType): number {
    let removed = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.type === type) {
        this.cache.delete(key);
        removed++;
      }
    }
    this.counts[type] = 0;
    this.logger.info(`Invalidated ${removed} cache entries of type: ${type}`);
    return removed;
  }

  /**
   * Clean up expired cache entries
   *
   * This method iterates through all items in the cache and removes any
   * that have exceeded their TTL and remove them. This prevents the
   * cache from growing indefinitely with stale data.
   *
   * @returns {void}
   */
  private cleanup(): void {
    if (!this.config.enabled) {
      return;
    }

    this.logger.debug('Starting cache cleanup');

    try {
      const now = Date.now();
      let cleaned = 0;
      const typeCleanupCounts: Record<string, number> = {
        generation: 0,
        intermediate: 0,
        asset: 0,
        progress: 0,
      };

      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiresAt) {
          this.cache.delete(key);
          this.counts[item.type]--;
          typeCleanupCounts[item.type] = (typeCleanupCounts[item.type] || 0) + 1;
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.info(`Cleaned up ${cleaned} expired cache items`, {
          totalCleaned: cleaned,
          byType: typeCleanupCounts,
          remainingItems: {
            total: this.cache.size,
            byType: { ...this.counts },
          },
        });
      } else {
        this.logger.debug('No expired cache items found during cleanup');
      }
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { operation: 'cleanup' },
        logLevel: 'warn',
        silent: true, // Don't report this to monitoring systems
      });
    }
  }

  /**
   * Generate a consistent key from a logo brief
   *
   * @param {LogoBrief} brief - The logo brief
   * @returns {string} A unique key for the brief
   */
  private generateBriefKey(brief: LogoBrief): string {
    try {
      // Sort keys for consistency
      const sortedBrief = Object.keys(brief)
        .sort()
        .reduce((acc, key) => {
          (acc as any)[key] = (brief as any)[key];
          return acc;
        }, {} as LogoBrief);

      const briefString = JSON.stringify(sortedBrief);
      // Simple hash function (not crypto-secure, but fine for a key)
      let hash = 0;
      for (let i = 0; i < briefString.length; i++) {
        const char = briefString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
      }
      return `generation:${hash}`;
    } catch (error) {
      this.logger.error('Failed to generate brief key', { error });
      // Fallback to a simpler key if stringification fails
      return `generation:${brief.prompt}`;
    }
  }

  /**
   * Generate a cache key for logo generation requests
   * @param brief Logo brief or prompt
   * @returns Cache key string
   */
  public getCacheKey(brief: string | object): string {
    const content = typeof brief === 'string' ? brief : JSON.stringify(brief);
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `gen_${Math.abs(hash)}`;
  }
}

/**
 * Utility to create a memoized function with a custom cache key and size
 * @param fn The function to memoize
 * @param options.maxSize Maximum cache size
 * @param options.getKey Function to generate a cache key from arguments
 */
export function createMemoizedFunction<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number; getKey?: (...args: Parameters<T>) => string } = {}
): T {
  const cache = new Map<string, ReturnType<T>>();
  const maxSize = options.maxSize || 100;
  const getKey = options.getKey || ((...args) => JSON.stringify(args));

  return ((...args: Parameters<T>) => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    if (cache.size > maxSize) {
      // Remove oldest entry
      const firstKey = cache.keys().next().value;
      if (typeof firstKey === 'string') {
        cache.delete(firstKey);
      }
    }
    return result;
  }) as T;
}

// Export a function to get the cache manager instance
export function getCacheManager(): CacheManager {
  return CacheManager.getInstance();
}
