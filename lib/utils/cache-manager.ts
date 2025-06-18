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

import { createHash } from 'node:crypto';
import { GenerationResult, LogoBrief, PipelineProgress } from '../types';

/**
 * @interface CacheItem
 * @description Represents an item stored in the cache with its metadata
 * @template T The type of data being stored in the cache
 * @property {T} data - The actual cached data
 * @property {number} expiresAt - Timestamp (ms) when this item expires
 * @property {number} createdAt - Timestamp (ms) when this item was created
 * @property {string} key - The unique identifier for this cache item
 * @property {CacheType} type - The category this cached item belongs to
 * @property {Record<string, unknown>} [metadata] - Optional additional information about the cached item
 */
export interface CacheItem<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  key: string;
  type: CacheType;
  metadata?: Record<string, unknown>;
}

/**
 * @typedef {('generation'|'intermediate'|'asset'|'progress')} CacheType
 * @description Types of data that can be stored in the cache
 * - generation: Complete logo generation results
 * - intermediate: Partial results from pipeline stages
 * - asset: Generated files and resources
 * - progress: Real-time generation progress information
 */
export type CacheType = 'generation' | 'intermediate' | 'asset' | 'progress';

/**
 * @interface CacheConfig
 * @description Configuration options for the cache manager
 * @property {boolean} enabled - Master switch to enable/disable caching
 * @property {Object} ttl - Time-to-live settings for different cache types (in milliseconds)
 * @property {number} ttl.generation - TTL for complete generation results
 * @property {number} ttl.intermediate - TTL for intermediate pipeline stage results
 * @property {number} ttl.asset - TTL for generated assets (SVGs, PNGs, etc.)
 * @property {number} ttl.progress - TTL for progress tracking information
 * @property {Object} maxSize - Maximum number of items to keep in each cache type
 * @property {number} maxSize.generation - Max number of complete generation results
 * @property {number} maxSize.intermediate - Max number of intermediate results
 * @property {number} maxSize.asset - Max number of cached assets
 * @property {number} maxSize.progress - Max number of progress entries
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: {
    generation: number;
    intermediate: number;
    asset: number;
    progress: number;
  };
  maxSize: {
    generation: number;
    intermediate: number;
    asset: number;
    progress: number;
  };
}

/**
 * @class CacheManager
 * @description Singleton class that manages caching for the AI Logo Generator
 * 
 * Provides a centralized caching system with the following features:
 * - Singleton pattern for application-wide access
 * - In-memory storage with configurable TTL
 * - LRU (Least Recently Used) eviction strategy
 * - Support for different cache types with separate configurations
 * - Automatic cleanup of expired items
 * - Metrics and statistics tracking
 * 
 * @example
 * // Get the singleton instance
 * const cacheManager = CacheManager.getInstance();
 * 
 * // Store a generation result
 * cacheManager.cacheGenerationResult(brief, result);
 * 
 * // Retrieve a cached result
 * const cachedResult = cacheManager.getGenerationResult(brief);
 * 
 * @implements {Singleton<CacheManager>}
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private config: CacheConfig;
  private counts: Record<CacheType, number> = {
    generation: 0,
    intermediate: 0,
    asset: 0,
    progress: 0,
  };
  
  /**
   * @constructor
   * @private
   * @description Private constructor to enforce singleton pattern
   * 
   * Initializes the cache with default configuration and starts the
   * automatic cleanup process to remove expired items periodically.
   */
  private constructor() {
    // Default configuration
    this.config = {
      enabled: process.env.ENABLE_CACHING !== 'false',
      ttl: {
        generation: 60 * 60 * 1000, // 1 hour
        intermediate: 30 * 60 * 1000, // 30 minutes
        asset: 24 * 60 * 60 * 1000, // 24 hours
        progress: 5 * 60 * 1000, // 5 minutes
      },
      maxSize: {
        generation: 100,
        intermediate: 200,
        asset: 50,
        progress: 500,
      }
    };
    
    // Start the cleanup interval
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Run cleanup every 5 minutes
  }
  
  /**
   * @static
   * @method getInstance
   * @description Gets the singleton instance of the CacheManager
   * 
   * If an instance doesn't exist yet, it creates one. Otherwise,
   * returns the existing instance. This ensures only one cache
   * exists throughout the application lifecycle.
   * 
   * @returns {CacheManager} The singleton CacheManager instance
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    
    return CacheManager.instance;
  }
  
  /**
   * @method configure
   * @description Updates the cache configuration with new settings
   * 
   * This method allows partial updates to the configuration, merging
   * the new settings with the existing ones. It handles nested properties
   * like ttl and maxSize correctly.
   * 
   * @param {Partial<CacheConfig>} config - New configuration options to apply
   * @returns {void}
   * 
   * @example
   * // Update only specific TTL values
   * cacheManager.configure({
   *   ttl: { 
   *     generation: 120 * 60 * 1000, // 2 hours
   *     asset: 48 * 60 * 60 * 1000   // 48 hours
   *   }
   * });
   */
  public configure(config: Partial<CacheConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      ttl: {
        ...this.config.ttl,
        ...(config.ttl || {})
      },
      maxSize: {
        ...this.config.maxSize,
        ...(config.maxSize || {})
      }
    };
  }
  
  /**
   * @method setEnabled
   * @description Enables or disables the entire cache system
   * 
   * When disabled, all cache operations become no-ops (they don't error,
   * but they don't store or retrieve data). When switching from enabled
   * to disabled, the entire cache is cleared.
   * 
   * @param {boolean} enabled - Whether the cache should be enabled
   * @returns {void}
   * 
   * @example
   * // Disable caching (clears existing cache)
   * cacheManager.setEnabled(false);
   * 
   * // Re-enable caching
   * cacheManager.setEnabled(true);
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    // Clear cache if disabled
    if (!enabled) {
      this.clear();
    }
  }
  
  /**
   * @method getCacheKey
   * @description Generates a deterministic hash key from a logo brief
   * 
   * Creates a SHA-256 hash based on the essential elements of a logo brief,
   * ensuring that identical briefs will generate the same cache key. For file
   * uploads, only metadata (filename, size, type) is used, not the actual file
   * contents, to keep key generation fast.
   * 
   * @param {LogoBrief} brief - The logo generation brief to create a key for
   * @returns {string} A unique hexadecimal hash that can be used as a cache key
   * 
   * @example
   * const brief = { 
   *   prompt: "Create a modern tech logo", 
   *   image_uploads: [file1, file2] 
   * };
   * const key = cacheManager.getCacheKey(brief);
   * // Returns something like: "8f7d6c5e4b3a2910..."
   */
  public getCacheKey(brief: LogoBrief): string {
    // Create a string representation of the brief
    const briefString = JSON.stringify({
      prompt: brief.prompt,
      // For images, we just store the file names and sizes for the key
      image_uploads: brief.image_uploads?.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))
    });
    
    // Create a hash of the brief
    return createHash('sha256').update(briefString).digest('hex');
  }
  
  /**
   * @method get
   * @description Retrieves an item from the cache if it exists and hasn't expired
   * 
   * This method looks up an item in the cache by its key and type, checks if
   * it has expired, and returns the data if valid. If the item has expired,
   * it's automatically removed from the cache.
   * 
   * @template T - The type of data being retrieved
   * @param {string} key - The unique identifier for the item
   * @param {CacheType} type - The category of cached data
   * @returns {T | null} The cached data if found and valid, null otherwise
   * 
   * @example
   * // Get a cached generation result
   * const result = cacheManager.get<GenerationResult>('abc123', 'generation');
   * 
   * if (result) {
   *   // Use the cached result
   * } else {
   *   // Generate a new result
   * }
   */
  public get<T>(key: string, type: CacheType): T | null {
    if (!this.config.enabled) {
      return null;
    }
    
    const cacheKey = `${type}:${key}`;
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(cacheKey);
      this.counts[type]--;
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * @method set
   * @description Stores an item in the cache with its type and metadata
   * 
   * This method adds or updates an item in the cache. If the cache for this
   * type is full, it will evict the oldest item before adding the new one.
   * Each item is stored with its expiration time based on the TTL for its type.
   * 
   * @template T - The type of data being stored
   * @param {string} key - The unique identifier for the item
   * @param {T} data - The data to cache
   * @param {CacheType} type - The category of cached data
   * @param {Record<string, any>} [metadata] - Optional additional information about the item
   * @returns {string} The cache key
   * 
   * @example
   * // Store a generation result
   * const key = cacheManager.set(
   *   '123abc', 
   *   generationResult, 
   *   'generation', 
   *   { brandName: 'TechCorp', timestamp: Date.now() }
   * );
   */
  public set<T>(key: string, data: T, type: CacheType, metadata?: Record<string, unknown>): string {
    if (!this.config.enabled) {
      return key;
    }
    
    const cacheKey = `${type}:${key}`;
    const ttl = this.config.ttl[type];
    const expiresAt = Date.now() + ttl;
    
    // Check if we need to evict items
    if (!this.cache.has(cacheKey) && this.counts[type] >= this.config.maxSize[type]) {
      this.evictOldest(type);
    }
    
    // Create cache item
    const cacheItem: CacheItem<T> = {
      data,
      expiresAt,
      createdAt: Date.now(),
      key,
      type,
      metadata
    };
    
    // Update counts if this is a new item
    if (!this.cache.has(cacheKey)) {
      this.counts[type]++;
    }
    
    // Store in cache
    this.cache.set(cacheKey, cacheItem);
    
    return key;
  }
  
  /**
   * @method cacheGenerationResult
   * @description Stores a complete logo generation result in the cache
   * 
   * This is a high-level method that handles creating the appropriate key
   * from a logo brief and storing the result with metadata for easier
   * retrieval and management.
   * 
   * @param {LogoBrief} brief - The original logo generation brief
   * @param {GenerationResult} result - The complete generation result to cache
   * @returns {string} The cache key used to store the result
   * 
   * @example
   * const result = await generateLogo(brief);
   * cacheManager.cacheGenerationResult(brief, result);
   */
  public cacheGenerationResult(brief: LogoBrief, result: GenerationResult): string {
    const key = this.getCacheKey(brief);
    return this.set(key, result, 'generation', { 
      brandName: result.brandName,
      timestamp: Date.now()
    });
  }
  
  /**
   * @method cacheIntermediateResult
   * @description Stores partial results from a pipeline stage
   * 
   * Caches intermediate results from specific pipeline stages, which can
   * be used to speed up regeneration or for debugging purposes. These
   * results have a shorter TTL than complete generation results.
   * 
   * @param {string} sessionId - The unique generation session identifier
   * @param {string} stageId - The pipeline stage identifier
   * @param {any} data - The stage result data to cache
   * @returns {string} The cache key used to store the result
   * 
   * @example
   * // Cache moodboard results from stage B
   * cacheManager.cacheIntermediateResult(
   *   'session-123',
   *   'stage-b',
   *   moodboardData
   * );
   */
  public cacheIntermediateResult(sessionId: string, stageId: string, data: unknown): string {
    const key = `${sessionId}:${stageId}`;
    return this.set(key, data, 'intermediate', {
      sessionId,
      stageId,
      timestamp: Date.now()
    });
  }
  
  /**
   * @method cacheProgress
   * @description Stores progress information for active generations
   * 
   * Caches real-time progress data for ongoing logo generation processes.
   * This data is used to provide progress updates to users, especially
   * after page refreshes or when reconnecting.
   * 
   * @param {string} sessionId - The unique generation session identifier
   * @param {PipelineProgress} progress - The current progress data
   * @returns {string} The cache key used to store the progress
   * 
   * @example
   * cacheManager.cacheProgress('session-456', {
   *   currentStage: 'stage-d',
   *   stageProgress: 60,
   *   overallProgress: 45,
   *   statusMessage: 'Generating SVG logo...'
   * });
   */
  public cacheProgress(sessionId: string, progress: PipelineProgress): string {
    return this.set(sessionId, progress, 'progress', {
      timestamp: Date.now(),
      stage: progress.currentStage
    });
  }
  
  /**
   * @method getGenerationResult
   * @description Retrieves a complete logo generation result from the cache
   * 
   * Looks up a generation result using the same brief that was used to
   * create it. This is the primary method for implementing result caching
   * at the API level.
   * 
   * @param {LogoBrief} brief - The logo brief to search for
   * @returns {GenerationResult | null} The cached generation result or null if not found
   * 
   * @example
   * // Check if we already have a result for this brief
   * const cachedResult = cacheManager.getGenerationResult(userBrief);
   * if (cachedResult) {
   *   return cachedResult; // Use cached result
   * } else {
   *   // Generate new result
   * }
   */
  public getGenerationResult(brief: LogoBrief): GenerationResult | null {
    const key = this.getCacheKey(brief);
    return this.get<GenerationResult>(key, 'generation');
  }
  
  /**
   * @method getIntermediateResult
   * @description Retrieves a cached intermediate result from a specific pipeline stage
   * 
   * Used to retrieve partial results from pipeline stages, which can be used
   * to skip stages that have already been completed in case of a restart or
   * to implement incremental generation.
   * 
   * @param {string} sessionId - The unique generation session identifier
   * @param {string} stageId - The pipeline stage identifier
   * @returns {any | null} The cached stage result or null if not found
   * 
   * @example
   * // Check if we already have moodboard results
   * const moodboard = cacheManager.getIntermediateResult(
   *   sessionId, 
   *   'stage-b'
   * );
   */
  public getIntermediateResult(sessionId: string, stageId: string): unknown | null {
    const key = `${sessionId}:${stageId}`;
    return this.get(key, 'intermediate');
  }
  
  /**
   * @method getProgress
   * @description Retrieves cached progress information for a generation session
   * 
   * Used to restore progress information when a user reconnects or refreshes
   * the page during an ongoing generation process.
   * 
   * @param {string} sessionId - The unique generation session identifier
   * @returns {PipelineProgress | null} The cached progress data or null if not found
   * 
   * @example
   * // Check if we have progress data for this session
   * const progress = cacheManager.getProgress('session-789');
   * if (progress) {
   *   // Update UI with current progress
   *   updateProgressUI(progress);
   * }
   */
  public getProgress(sessionId: string): PipelineProgress | null {
    return this.get<PipelineProgress>(sessionId, 'progress');
  }
  
  /**
   * @method invalidate
   * @description Removes a specific item from the cache
   * 
   * Manually removes a cached item before its expiration time.
   * Useful for invalidating stale data or for implementing
   * cache purging on demand.
   * 
   * @param {string} key - The cache key to invalidate
   * @param {CacheType} type - The category of cached data
   * @returns {void}
   * 
   * @example
   * // Invalidate a cached result when it's no longer needed
   * cacheManager.invalidate(cacheKey, 'generation');
   */
  public invalidate(key: string, type: CacheType): void {
    const cacheKey = `${type}:${key}`;
    
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.counts[type]--;
    }
  }
  
  /**
   * @method invalidateType
   * @description Removes all cached items of a specific type
   * 
   * Clears an entire category of cached data. Useful for implementing
   * cache refresh policies or handling data schema changes that would
   * make all cached items of a certain type invalid.
   * 
   * @param {CacheType} type - The category of cached data to invalidate
   * @returns {void}
   * 
   * @example
   * // Clear all generation results
   * cacheManager.invalidateType('generation');
   * 
   * // Clear all progress data
   * cacheManager.invalidateType('progress');
   */
  public invalidateType(type: CacheType): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.type === type) {
        this.cache.delete(key);
      }
    }
    
    this.counts[type] = 0;
  }
  
  /**
   * @method clear
   * @description Removes all items from all caches
   * 
   * Completely empties the cache. Useful for implementing a "force refresh"
   * function or when deploying significant application updates that would
   * invalidate all cached data.
   * 
   * @returns {void}
   * 
   * @example
   * // Clear all cached data
   * cacheManager.clear();
   */
  public clear(): void {
    this.cache.clear();
    this.counts = {
      generation: 0,
      intermediate: 0,
      asset: 0,
      progress: 0,
    };
  }
  
  /**
   * @method cleanup
   * @private
   * @description Automatically removes expired items from the cache
   * 
   * This method is called periodically to scan the cache for items
   * that have exceeded their TTL and remove them. This prevents the
   * cache from growing indefinitely with stale data.
   * 
   * @returns {void}
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        this.counts[item.type]--;
        cleaned++;
      }
    }
    
    if (cleaned > 0 && this.config.enabled) {
      console.log(`[CacheManager] Cleaned up ${cleaned} expired items`);
    }
  }
  
  /**
   * @method evictOldest
   * @private
   * @description Removes the oldest item of a specific type when the cache is full
   * 
   * Implements a Least Recently Used (LRU) eviction strategy for each cache type.
   * When a cache type reaches its maximum size, this method removes the oldest
   * item to make room for new entries.
   * 
   * @param {CacheType} type - The category of cached data to evict from
   * @returns {void}
   */
  private evictOldest(type: CacheType): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.type === type && item.createdAt < oldestTime) {
        oldestKey = key;
        oldestTime = item.createdAt;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.counts[type]--;
    }
  }
  
  /**
   * @method getStats
   * @description Returns detailed statistics about the current cache state
   * 
   * Provides comprehensive metrics about the cache, including item counts
   * by type, configured limits, and overall size. Useful for monitoring
   * cache performance and usage patterns.
   * 
   * @returns {Object} Cache statistics object
   * @returns {boolean} .enabled - Whether caching is currently enabled
   * @returns {Record<CacheType, number>} .counts - Number of items by type
   * @returns {Record<CacheType, number>} .maxSizes - Maximum allowed items by type
   * @returns {Record<CacheType, number>} .ttls - TTL values by type (ms)
   * @returns {number} .totalSize - Total number of items in the cache
   * 
   * @example
   * // Log cache statistics
   * console.log('Cache stats:', cacheManager.getStats());
   * 
   * // Check memory usage
   * const stats = cacheManager.getStats();
   * const utilization = stats.totalSize / 
   *   Object.values(stats.maxSizes).reduce((a, b) => a + b, 0);
   * console.log(`Cache utilization: ${(utilization * 100).toFixed(1)}%`);
   */
  public getStats(): {
    enabled: boolean;
    counts: Record<CacheType, number>;
    maxSizes: Record<CacheType, number>;
    ttls: Record<CacheType, number>;
    totalSize: number;
  } {
    return {
      enabled: this.config.enabled,
      counts: { ...this.counts },
      maxSizes: { ...this.config.maxSize },
      ttls: { ...this.config.ttl },
      totalSize: this.cache.size
    };
  }
}