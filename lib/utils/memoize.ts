/**
 * @file memoize.ts
 * @description Function memoization utilities for caching repetitive operations
 * 
 * This module provides utilities for memoizing function results, allowing
 * expensive operations to be cached and reused when called with the same 
 * parameters. This can significantly improve performance for repetitive
 * operations like SVG processing, data transformations, and API requests.
 */

import { ErrorCategory, handleError } from './error-handler';

/**
 * Options for configuring the memoization behavior
 */
export interface MemoizeOptions {
  /**
   * Maximum number of results to cache
   * @default 100
   */
  maxSize?: number;
  
  /**
   * Time-to-live in milliseconds (0 = no expiration)
   * @default 0
   */
  ttl?: number;
  
  /**
   * Function to generate cache keys from function arguments
   * By default, JSON.stringify is used
   */
  keyGenerator?: (...args: any[]) => string;
  
  /**
   * Flag to determine if the memoize cache should be cleared when memory pressure is high
   * @default true
   */
  clearOnMemoryPressure?: boolean;
  
  /**
   * Custom cache storage to use instead of the default Map
   */
  cache?: Map<string, CacheItem>;
  
  /**
   * Whether to cache rejected promises (errors)
   * @default false
   */
  cacheRejections?: boolean;
  
  /**
   * Name for this memoized function (for debugging and monitoring)
   */
  name?: string;
}

/**
 * Interface for items stored in the memoization cache
 */
interface CacheItem {
  /**
   * The cached function result
   */
  value: any;
  
  /**
   * Timestamp when this item expires (0 = no expiration)
   */
  expiresAt: number;
  
  /**
   * Timestamp when this item was created
   */
  createdAt: number;
  
  /**
   * Number of times this cached result has been used
   */
  hits: number;
}

/**
 * Registry of all memoized functions for global management
 */
const memoizeRegistry = new Map<string, {
  fn: Function;
  cache: Map<string, CacheItem>;
  options: MemoizeOptions;
  stats: {
    hits: number;
    misses: number;
    size: number;
    lastCleared: number;
  };
}>();

/**
 * Default options for memoization
 */
const defaultOptions: MemoizeOptions = {
  maxSize: 100,
  ttl: 0, // No expiration by default
  clearOnMemoryPressure: true,
  cacheRejections: false,
  keyGenerator: (...args: any[]) => {
    try {
      return JSON.stringify(args);
    } catch (error) {
      // If serialization fails (e.g., circular references), fall back to simple string
      return args.map(arg => 
        typeof arg === 'object' 
          ? `obj:${Object.keys(arg).join(',')}` 
          : String(arg)
      ).join('|');
    }
  }
};

/**
 * Memoizes a function, caching its results for repeated calls with the same arguments
 * 
 * @template T The function to memoize
 * @param fn The function to memoize
 * @param options Configuration options for the memoization
 * @returns A memoized version of the function
 * 
 * @example
 * // Memoize an expensive calculation
 * const calculateComplexValue = memoize(
 *   (input: number) => {
 *     console.log('Calculating...');
 *     return expensiveCalculation(input);
 *   },
 *   { maxSize: 50, ttl: 60 * 1000 } // Cache up to 50 results for 1 minute
 * );
 * 
 * // First call: performs the calculation
 * calculateComplexValue(42); // logs "Calculating..." and returns result
 * 
 * // Second call with same input: returns cached result without calculation
 * calculateComplexValue(42); // returns cached result without logging
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const opts = { ...defaultOptions, ...options };
  const cache = opts.cache || new Map<string, CacheItem>();
  const name = opts.name || fn.name || `memoized-${Math.random().toString(36).substring(2, 9)}`;
  
  // Register this memoized function
  memoizeRegistry.set(name, {
    fn,
    cache,
    options: opts,
    stats: {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleared: Date.now()
    }
  });
  
  // Create the memoized function
  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    try {
      // Generate the cache key
      const key = opts.keyGenerator!(...args);
      
      // Check if we have a cached result
      const cached = cache.get(key);
      const now = Date.now();
      
      if (cached) {
        // Check if the cached result has expired
        if (opts.ttl && now > cached.expiresAt) {
          cache.delete(key);
        } else {
          // Return the cached result
          cached.hits++;
          memoizeRegistry.get(name)!.stats.hits++;
          return cached.value;
        }
      }
      
      // No cache hit, compute the result
      memoizeRegistry.get(name)!.stats.misses++;
      const result = fn.apply(this, args);
      
      // Check if we need to clear some space
      if (opts.maxSize && cache.size >= opts.maxSize) {
        // Find the least used entry
        let leastUsedKey: string | null = null;
        let leastUsedHits = Infinity;
        
        for (const [entryKey, entry] of cache.entries()) {
          if (entry.hits < leastUsedHits) {
            leastUsedKey = entryKey;
            leastUsedHits = entry.hits;
          }
        }
        
        // Remove the least used entry
        if (leastUsedKey) {
          cache.delete(leastUsedKey);
        }
      }
      
      // Check if the result is a promise
      if (result instanceof Promise) {
        // For promises, we need to handle both resolution and rejection
        return result.then((value) => {
          // Cache the resolved value
          cache.set(key, {
            value,
            expiresAt: opts.ttl ? now + opts.ttl : 0,
            createdAt: now,
            hits: 1
          });
          
          memoizeRegistry.get(name)!.stats.size = cache.size;
          return value;
        }).catch((error) => {
          // Only cache rejections if configured to do so
          if (opts.cacheRejections) {
            cache.set(key, {
              value: Promise.reject(error),
              expiresAt: opts.ttl ? now + opts.ttl : 0,
              createdAt: now,
              hits: 1
            });
            
            memoizeRegistry.get(name)!.stats.size = cache.size;
          }
          
          throw error;
        }) as ReturnType<T>;
      } else {
        // For non-promises, cache the result directly
        cache.set(key, {
          value: result,
          expiresAt: opts.ttl ? now + opts.ttl : 0,
          createdAt: now,
          hits: 1
        });
        
        memoizeRegistry.get(name)!.stats.size = cache.size;
        return result;
      }
    } catch (error) {
      // If anything goes wrong during caching, just call the original function
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'memoize',
          functionName: name,
          args: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg)).join(', ')
        },
        logLevel: 'warn',
        rethrow: false
      });
      
      return fn.apply(this, args);
    }
  } as T;
  
  // Add helper methods to the memoized function
  const memoizedWithHelpers = Object.assign(memoized, {
    /**
     * Clears the entire cache for this memoized function
     */
    clearCache: () => {
      cache.clear();
      if (memoizeRegistry.has(name)) {
        memoizeRegistry.get(name)!.stats.lastCleared = Date.now();
        memoizeRegistry.get(name)!.stats.size = 0;
      }
    },
    
    /**
     * Invalidates a specific cache entry
     * @param args The arguments that would be passed to the function
     */
    invalidate: (...args: Parameters<T>) => {
      try {
        const key = opts.keyGenerator!(...args);
        cache.delete(key);
        if (memoizeRegistry.has(name)) {
          memoizeRegistry.get(name)!.stats.size = cache.size;
        }
      } catch (error) {
        handleError(error, {
          category: ErrorCategory.STORAGE,
          context: { 
            operation: 'memoize.invalidate',
            functionName: name
          },
          logLevel: 'warn'
        });
      }
    },
    
    /**
     * Returns stats about the cache usage
     */
    getStats: () => {
      if (memoizeRegistry.has(name)) {
        const { hits, misses, size, lastCleared } = memoizeRegistry.get(name)!.stats;
        
        return {
          name,
          hits,
          misses,
          size: cache.size,
          hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
          maxSize: opts.maxSize,
          ttl: opts.ttl,
          lastCleared: new Date(lastCleared)
        };
      }
      
      return {
        name,
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0,
        maxSize: opts.maxSize,
        ttl: opts.ttl,
        lastCleared: new Date()
      };
    },
    
    /**
     * The original function
     */
    original: fn
  });
  
  return memoizedWithHelpers as T;
}

/**
 * Clears all memoization caches across the application
 */
export function clearAllMemoizationCaches(): void {
  try {
    let totalCleared = 0;
    
    for (const [name, entry] of memoizeRegistry.entries()) {
      totalCleared += entry.cache.size;
      entry.cache.clear();
      entry.stats.lastCleared = Date.now();
      entry.stats.size = 0;
    }
    
    console.info(`Cleared ${totalCleared} items from ${memoizeRegistry.size} memoization caches`);
  } catch (error) {
    handleError(error, {
      category: ErrorCategory.STORAGE,
      context: { operation: 'clearAllMemoizationCaches' },
      logLevel: 'warn'
    });
  }
}

/**
 * Gets statistics for all memoized functions
 */
export function getMemoizationStats(): Record<string, {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  maxSize: number | undefined;
  ttl: number | undefined;
  lastCleared: Date;
}> {
  const stats: Record<string, any> = {};
  
  for (const [name, entry] of memoizeRegistry.entries()) {
    const { hits, misses, size, lastCleared } = entry.stats;
    
    stats[name] = {
      hits,
      misses,
      size: entry.cache.size,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
      maxSize: entry.options.maxSize,
      ttl: entry.options.ttl,
      lastCleared: new Date(lastCleared)
    };
  }
  
  return stats;
}

/**
 * Creates a memoized version of an async function with debouncing
 * This is useful for expensive operations that might be called rapidly,
 * such as real-time search or UI updates based on user input
 * 
 * @template T The function to memoize and debounce
 * @param fn The async function to memoize and debounce
 * @param wait The debounce wait time in milliseconds
 * @param options Configuration options for the memoization
 * @returns A memoized and debounced version of the function
 * 
 * @example
 * // Create a memoized and debounced search function
 * const searchUsers = memoizeDebounced(
 *   async (query: string) => {
 *     const results = await api.searchUsers(query);
 *     return results;
 *   },
 *   300, // Debounce for 300ms
 *   { maxSize: 20, ttl: 30 * 1000 } // Cache up to 20 results for 30 seconds
 * );
 * 
 * // Usage in a component
 * const handleSearch = (query) => {
 *   searchUsers(query).then(results => {
 *     setSearchResults(results);
 *   });
 * };
 */
export function memoizeDebounced<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: MemoizeOptions = {}
): T {
  const opts = { ...defaultOptions, ...options };
  const name = opts.name || fn.name || `memoized-debounced-${Math.random().toString(36).substring(2, 9)}`;
  
  // Create a map of pending promises
  const pending = new Map<string, { 
    promise: Promise<any>;
    timer: NodeJS.Timeout;
  }>();
  
  // Create the memoized function first
  const memoized = memoize(fn, {
    ...opts,
    name
  });
  
  // Add debouncing behavior
  const debouncedMemoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    try {
      // Generate the cache key
      const key = opts.keyGenerator!(...args);
      
      // Check if we have a pending operation for this key
      if (pending.has(key)) {
        // Cancel the previous timer
        clearTimeout(pending.get(key)!.timer);
        
        // Return the existing promise
        return pending.get(key)!.promise as ReturnType<T>;
      }
      
      // Create a new promise for this operation
      const promise = new Promise<any>((resolve, reject) => {
        // Set a timer to execute the operation after the wait period
        const timer = setTimeout(() => {
          // Execute the memoized function
          memoized.apply(this, args)
            .then((result: any) => {
              // Remove from pending
              pending.delete(key);
              // Resolve with the result
              resolve(result);
            })
            .catch((error: any) => {
              // Remove from pending
              pending.delete(key);
              // Reject with the error
              reject(error);
            });
        }, wait);
        
        // Store the timer and promise
        pending.set(key, { promise, timer });
      });
      
      return promise as ReturnType<T>;
    } catch (error) {
      // If anything goes wrong, just call the original function
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: { 
          operation: 'memoizeDebounced',
          functionName: name
        },
        logLevel: 'warn',
        rethrow: false
      });
      
      return fn.apply(this, args);
    }
  } as T;
  
  // Add helper methods to the debounced memoized function
  return Object.assign(debouncedMemoized, {
    clearCache: memoized.clearCache,
    invalidate: memoized.invalidate,
    getStats: memoized.getStats,
    original: fn,
    
    /**
     * Cancels all pending debounced operations
     */
    cancelAll: () => {
      for (const { timer } of pending.values()) {
        clearTimeout(timer);
      }
      pending.clear();
    },
    
    /**
     * Returns stats about the pending operations
     */
    getPendingCount: () => pending.size
  });
}

/**
 * Set up event listeners for memory pressure and visibility change
 * to automatically clear memoization caches when appropriate
 */
if (typeof window !== 'undefined') {
  // Clear memoization caches when the page becomes hidden
  // This helps reduce memory usage when the user is not actively using the app
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Only clear caches that are configured to be cleared on memory pressure
      for (const [name, entry] of memoizeRegistry.entries()) {
        if (entry.options.clearOnMemoryPressure) {
          entry.cache.clear();
          entry.stats.lastCleared = Date.now();
          entry.stats.size = 0;
        }
      }
    }
  });
}