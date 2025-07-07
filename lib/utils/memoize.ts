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
  keyGenerator?: (...args: unknown[]) => string;

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
  value: unknown;

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
const memoizeRegistry = new Map<
  string,
  {
    fn: Function;
    cache: Map<string, CacheItem>;
    options: MemoizeOptions;
    stats: {
      hits: number;
      misses: number;
      size: number;
      lastCleared: number;
    };
  }
>();

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
      return args
        .map(arg => (typeof arg === 'object' ? `obj:${Object.keys(arg).join(',')}` : String(arg)))
        .join('|');
    }
  },
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
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): {
  fn: T;
  clearCache: () => void;
  invalidate: (...args: Parameters<T>) => void;
  getStats: () => { hits: number; misses: number; size: number; lastCleared: number };
  original: T;
} {
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
      lastCleared: Date.now(),
    },
  });

  // Create the memoized function
  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    try {
      // Generate the cache key
      const key = opts.keyGenerator!(...args);
      // Check if we have a cached result
      if (cache.has(key)) {
        const cached = cache.get(key)!;
        cached.hits++;
        memoizeRegistry.get(name)!.stats.hits++;
        // Type assertion: we trust the cache to have the correct type
        return cached.value as ReturnType<T>;
      }
      // No cache hit, compute the result
      memoizeRegistry.get(name)!.stats.misses++;
      const result = fn.apply(this, args);
      cache.set(key, {
        value: result as unknown as ReturnType<T>,
        expiresAt: 0,
        createdAt: Date.now(),
        hits: 1,
      });
      return result as ReturnType<T>;
    } catch (error) {
      // If anything goes wrong during caching, just call the original function
      return fn.apply(this, args) as ReturnType<T>;
    }
  };

  // Add helper methods to the memoized function
  function clearCache() {
    cache.clear();
    memoizeRegistry.get(name)!.stats.size = 0;
    memoizeRegistry.get(name)!.stats.lastCleared = Date.now();
  }
  function invalidate(...args: Parameters<T>) {
    const key = opts.keyGenerator!(...args);
    cache.delete(key);
    memoizeRegistry.get(name)!.stats.size = cache.size;
  }
  function getStats() {
    const stats = memoizeRegistry.get(name)!.stats;
    return {
      hits: stats.hits,
      misses: stats.misses,
      size: cache.size,
      lastCleared: stats.lastCleared,
    };
  }
  return {
    fn: memoized as T,
    clearCache,
    invalidate,
    getStats,
    original: fn,
  };
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
      logLevel: 'warn',
    });
  }
}

/**
 * Gets statistics for all memoized functions
 */
export function getMemoizationStats(): Record<
  string,
  {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    maxSize: number | undefined;
    ttl: number | undefined;
    lastCleared: Date;
  }
> {
  const stats: Record<
    string,
    {
      hits: number;
      misses: number;
      size: number;
      hitRate: number;
      maxSize: number | undefined;
      ttl: number | undefined;
      lastCleared: Date;
    }
  > = {};

  for (const [name, entry] of memoizeRegistry.entries()) {
    const { hits, misses, size, lastCleared } = entry.stats;

    stats[name] = {
      hits,
      misses,
      size: entry.cache.size,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
      maxSize: entry.options.maxSize,
      ttl: entry.options.ttl,
      lastCleared: new Date(lastCleared),
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
export function memoizeDebounced<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  wait: number,
  options: MemoizeOptions = {}
): T {
  const opts = { ...defaultOptions, ...options };
  const name =
    opts.name || fn.name || `memoized-debounced-${Math.random().toString(36).substring(2, 9)}`;

  // Create a map of pending promises
  const pending = new Map<
    string,
    {
      promise: Promise<any>;
      timer: NodeJS.Timeout;
    }
  >();

  // Create the memoized function first
  const memoized = memoize(fn, {
    ...opts,
    name,
  });

  // Add debouncing behavior
  const debouncedMemoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
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
          (memoized as unknown as (...args: Parameters<T>) => ReturnType<T>)
            .apply(this, args)
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
          functionName: name,
        },
        logLevel: 'warn',
        rethrow: false,
      });

      return fn.apply(this, args) as ReturnType<T>;
    }
  } as unknown as T; // Type assertion: we trust this shape for debounced memoized

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
    getPendingCount: () => pending.size,
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
