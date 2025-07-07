/**
 * @file use-cache.ts
 * @description React hook for client-side caching
 *
 * This hook provides a simple way to cache values and computations
 * within React components, including persistent caching across
 * renders and browser sessions when needed.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ErrorCategory, handleError } from '../utils/error-handler';

/**
 * Available storage types for the cache
 */
export type CacheStorage = 'memory' | 'session' | 'local';

/**
 * Cache options
 */
export interface CacheOptions<T> {
  /**
   * The key to use for the cache
   * If not provided, a key will be auto-generated
   */
  key?: string;

  /**
   * The storage type to use
   * @default 'memory'
   */
  storage?: CacheStorage;

  /**
   * Time-to-live in milliseconds (0 = no expiration)
   * @default 0
   */
  ttl?: number;

  /**
   * Initial value for the cache
   */
  initialValue?: T;

  /**
   * Custom serializer for the value
   * Used when storing in session or local storage
   * @default JSON.stringify
   */
  serialize?: (value: T) => string;

  /**
   * Custom deserializer for the value
   * Used when retrieving from session or local storage
   * @default JSON.parse
   */
  deserialize?: (value: string) => T;

  /**
   * Namespace for the cache key to avoid collisions
   * @default 'ailogo'
   */
  namespace?: string;
}

/**
 * Cache state returned by the hook
 */
interface CacheState<T> {
  /**
   * The current value in the cache
   */
  value: T | null;

  /**
   * Whether the value is stale (expired)
   */
  isStale: boolean;

  /**
   * When the value was last set
   */
  timestamp: number;

  /**
   * When the value will expire (0 = never)
   */
  expiresAt: number;
}

/**
 * Cache metadata stored alongside the value
 */
interface CacheMeta {
  /**
   * When the value was last set
   */
  timestamp: number;

  /**
   * When the value will expire (0 = never)
   */
  expiresAt: number;
}

/**
 * Full cache entry structure
 */
interface CacheEntry<T> {
  /**
   * The cached value
   */
  value: T;

  /**
   * Cache metadata
   */
  meta: CacheMeta;
}

/**
 * React hook for client-side caching
 *
 * @template T Type of the cached value
 * @param options Cache configuration options
 * @returns Object with cache value and management functions
 *
 * @example
 * // In-memory cache
 * const { value, setValue, clear } = useCache<string[]>({
 *   key: 'recent-searches',
 *   initialValue: []
 * });
 *
 * // Local storage cache with TTL
 * const { value, setValue, clear, isStale } = useCache<UserProfile>({
 *   key: 'user-profile',
 *   storage: 'local',
 *   ttl: 24 * 60 * 60 * 1000 // 24 hours
 * });
 */
export function useCache<T = any>(options: CacheOptions<T> = {}) {
  // Default options
  const {
    key = `cache-${Math.random().toString(36).substring(2, 9)}`,
    storage = 'memory',
    ttl = 0,
    initialValue = null,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    namespace = 'ailogo',
  } = options;

  // Full cache key with namespace
  const fullKey = `${namespace}:${key}`;

  // Create a reference for memory storage
  const memoryCache = useRef<CacheEntry<T> | null>(null);

  // State for the cache
  const [state, setState] = useState<CacheState<T>>(() => {
    try {
      // Try to load initial value from storage
      if (storage === 'local' || storage === 'session') {
        const storageType = storage === 'local' ? localStorage : sessionStorage;
        const stored = storageType.getItem(fullKey);

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const value = deserialize(parsed.value);
            const meta = parsed.meta as CacheMeta;

            // Check if the value has expired
            const now = Date.now();
            if (meta.expiresAt !== 0 && now > meta.expiresAt) {
              // Value has expired, remove it from storage
              storageType.removeItem(fullKey);

              // Return initial state with initial value
              return {
                value: initialValue as T | null,
                isStale: false,
                timestamp: now,
                expiresAt: ttl ? now + ttl : 0,
              };
            }

            // Return loaded value
            return {
              value,
              isStale: false,
              timestamp: meta.timestamp,
              expiresAt: meta.expiresAt,
            };
          } catch (error) {
            // Error parsing, remove the invalid entry
            storageType.removeItem(fullKey);

            // Log the error but continue with initial value
            handleError(error, {
              category: ErrorCategory.STORAGE,
              context: {
                operation: 'useCache.init',
                key: fullKey,
                storage,
              },
              logLevel: 'warn',
            });
          }
        }
      } else if (storage === 'memory' && memoryCache.current) {
        // Check if memory cache has expired
        const now = Date.now();
        if (memoryCache.current.meta.expiresAt !== 0 && now > memoryCache.current.meta.expiresAt) {
          // Value has expired
          memoryCache.current = null;

          // Return initial state with initial value
          return {
            value: initialValue as T | null,
            isStale: false,
            timestamp: now,
            expiresAt: ttl ? now + ttl : 0,
          };
        }

        // Return from memory cache
        return {
          value: memoryCache.current.value,
          isStale: false,
          timestamp: memoryCache.current.meta.timestamp,
          expiresAt: memoryCache.current.meta.expiresAt,
        };
      }

      // No valid cache found, use initial value
      const now = Date.now();
      return {
        value: initialValue as T | null,
        isStale: false,
        timestamp: now,
        expiresAt: ttl ? now + ttl : 0,
      };
    } catch (error) {
      // Handle any errors during initialization
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: {
          operation: 'useCache.init',
          key: fullKey,
          storage,
        },
        logLevel: 'warn',
      });

      // Return safe default state
      const now = Date.now();
      return {
        value: initialValue as T | null,
        isStale: false,
        timestamp: now,
        expiresAt: ttl ? now + ttl : 0,
      };
    }
  });

  // Function to set a new value in the cache
  const setValue = useCallback(
    (newValue: T | ((prev: T | null) => T)) => {
      try {
        setState(prevState => {
          // Calculate the new value
          const resolvedValue =
            typeof newValue === 'function' ? (newValue as Function)(prevState.value) : newValue;

          const now = Date.now();
          const expiresAt = ttl ? now + ttl : 0;

          // Update the appropriate storage
          if (storage === 'local' || storage === 'session') {
            try {
              const storageType = storage === 'local' ? localStorage : sessionStorage;
              const entry: CacheEntry<T> = {
                value: resolvedValue,
                meta: {
                  timestamp: now,
                  expiresAt,
                },
              };

              // Serialize and store
              const serialized = JSON.stringify({
                value: serialize(resolvedValue),
                meta: entry.meta,
              });

              storageType.setItem(fullKey, serialized);
            } catch (error) {
              // Log storage errors but continue
              handleError(error, {
                category: ErrorCategory.STORAGE,
                context: {
                  operation: 'useCache.setValue',
                  key: fullKey,
                  storage,
                },
                logLevel: 'warn',
              });
            }
          } else if (storage === 'memory') {
            // Update memory cache
            memoryCache.current = {
              value: resolvedValue,
              meta: {
                timestamp: now,
                expiresAt,
              },
            };
          }

          // Return new state
          return {
            value: resolvedValue,
            isStale: false,
            timestamp: now,
            expiresAt,
          };
        });
      } catch (error) {
        // Handle any errors during setValue
        handleError(error, {
          category: ErrorCategory.STORAGE,
          context: {
            operation: 'useCache.setValue',
            key: fullKey,
            storage,
          },
          logLevel: 'warn',
        });
      }
    },
    [fullKey, serialize, storage, ttl]
  );

  // Function to clear the cache
  const clear = useCallback(() => {
    try {
      const now = Date.now();

      // Clear from the appropriate storage
      if (storage === 'local' || storage === 'session') {
        const storageType = storage === 'local' ? localStorage : sessionStorage;
        storageType.removeItem(fullKey);
      }

      // Always clear memory cache
      memoryCache.current = null;

      // Update state
      setState({
        value: null,
        isStale: false,
        timestamp: now,
        expiresAt: ttl ? now + ttl : 0,
      });
    } catch (error) {
      // Handle any errors during clear
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: {
          operation: 'useCache.clear',
          key: fullKey,
          storage,
        },
        logLevel: 'warn',
      });
    }
  }, [fullKey, storage, ttl]);

  // Function to refresh the TTL without changing the value
  const refresh = useCallback(() => {
    try {
      if (!state.value) return; // Nothing to refresh

      const now = Date.now();
      const expiresAt = ttl ? now + ttl : 0;

      // Update the appropriate storage
      if (storage === 'local' || storage === 'session') {
        try {
          const storageType = storage === 'local' ? localStorage : sessionStorage;
          const stored = storageType.getItem(fullKey);

          if (stored) {
            const parsed = JSON.parse(stored);

            // Update only the meta information
            parsed.meta = {
              timestamp: now,
              expiresAt,
            };

            storageType.setItem(fullKey, JSON.stringify(parsed));
          }
        } catch (error) {
          // Log storage errors but continue
          handleError(error, {
            category: ErrorCategory.STORAGE,
            context: {
              operation: 'useCache.refresh',
              key: fullKey,
              storage,
            },
            logLevel: 'warn',
          });
        }
      } else if (storage === 'memory' && memoryCache.current) {
        // Update memory cache meta
        memoryCache.current.meta = {
          timestamp: now,
          expiresAt,
        };
      }

      // Update state
      setState(prevState => ({
        ...prevState,
        isStale: false,
        timestamp: now,
        expiresAt,
      }));
    } catch (error) {
      // Handle any errors during refresh
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: {
          operation: 'useCache.refresh',
          key: fullKey,
          storage,
        },
        logLevel: 'warn',
      });
    }
  }, [fullKey, storage, ttl, state.value]);

  // Check for expiration
  useEffect(() => {
    // If there's a TTL, set up a check for expiration
    if (ttl && state.expiresAt) {
      const now = Date.now();
      const timeUntilExpiry = state.expiresAt - now;

      if (timeUntilExpiry <= 0) {
        // Already expired
        setState(prev => ({
          ...prev,
          isStale: true,
        }));
        return;
      }

      // Set a timer to mark as stale when expires
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isStale: true,
        }));
      }, timeUntilExpiry);

      return () => clearTimeout(timer);
    }
  }, [state.expiresAt, ttl]);

  return {
    /**
     * The current value in the cache
     */
    value: state.value,

    /**
     * Function to set a new value in the cache
     */
    setValue,

    /**
     * Function to clear the cache
     */
    clear,

    /**
     * Function to refresh the TTL without changing the value
     */
    refresh,

    /**
     * Whether the current value is stale (expired)
     */
    isStale: state.isStale,

    /**
     * When the value was last set
     */
    timestamp: state.timestamp,

    /**
     * When the value will expire (0 = never)
     */
    expiresAt: state.expiresAt,

    /**
     * The key being used for the cache
     */
    key: fullKey,
  };
}

/**
 * React hook for memoizing async function results with caching
 *
 * @template T Type of the function to memoize
 * @param fn The async function to memoize
 * @param options Cache configuration options
 * @returns Memoized function and status values
 *
 * @example
 * // Memoize a fetch operation with a 5 minute cache
 * const { execute, data, loading, error } = useMemoizedAsync(
 *   async (id: string) => {
 *     const response = await fetch(`/api/products/${id}`);
 *     return response.json();
 *   },
 *   {
 *     key: 'product-details',
 *     ttl: 5 * 60 * 1000,
 *     storage: 'session'
 *   }
 * );
 *
 * // Later in your component
 * useEffect(() => {
 *   execute(productId);
 * }, [productId, execute]);
 */
export function useMemoizedAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions<Record<string, any>> = {}
) {
  // Use a cache to store results
  const {
    value: cache,
    setValue: setCache,
    clear: clearCache,
    isStale,
  } = useCache<Record<string, any>>({
    key: options.key || `memoized-${fn.name || 'async'}`,
    storage: options.storage || 'memory',
    ttl: options.ttl || 5 * 60 * 1000, // Default 5 minutes
    initialValue: {},
    namespace: options.namespace || 'ailogo:memoized',
  });

  // State for the current execution
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: any | null;
    lastArgs: any[] | null;
  }>({
    loading: false,
    error: null,
    data: null,
    lastArgs: null,
  });

  // Function to generate a cache key from arguments
  const getCacheKey = useCallback((args: any[]) => {
    try {
      return JSON.stringify(args);
    } catch (error) {
      // If serialization fails, use a simple string representation
      return args
        .map(arg => (typeof arg === 'object' ? `obj:${Object.keys(arg).join(',')}` : String(arg)))
        .join('|');
    }
  }, []);

  // Memoized execution function
  const execute = useCallback(
    (...args: Parameters<T>) => {
      const cacheKey = getCacheKey(args);

      // Set loading state
      setState(prev => ({
        ...prev,
        loading: true,
        lastArgs: args,
      }));

      // Check cache first (if not stale)
      if (cache && !isStale && cache[cacheKey]) {
        // Return cached result
        setState(prev => ({
          ...prev,
          loading: false,
          data: cache[cacheKey],
          error: null,
        }));

        return Promise.resolve(cache[cacheKey]);
      }

      // Execute the function
      return fn(...args)
        .then(result => {
          // Cache the result
          setCache(prev => ({
            ...prev,
            [cacheKey]: result,
          }));

          // Update state
          setState(prev => ({
            ...prev,
            loading: false,
            data: result,
            error: null,
          }));

          return result;
        })
        .catch(error => {
          // Update error state
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }));

          throw error;
        });
    },
    [cache, fn, getCacheKey, isStale, setCache]
  );

  // Function to invalidate a specific result
  const invalidate = useCallback(
    (...args: Parameters<T>) => {
      const cacheKey = getCacheKey(args);

      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });

      // If these were the last args used, also clear the data
      if (state.lastArgs && getCacheKey(state.lastArgs) === cacheKey) {
        setState(prev => ({
          ...prev,
          data: null,
        }));
      }
    },
    [getCacheKey, setCache, state.lastArgs]
  );

  return {
    /**
     * Execute the function with optional caching
     */
    execute,

    /**
     * The current data (from last execution or cache)
     */
    data: state.data,

    /**
     * Whether the function is currently executing
     */
    loading: state.loading,

    /**
     * Any error from the last execution
     */
    error: state.error,

    /**
     * Clear all cached results
     */
    clearCache,

    /**
     * Invalidate a specific cached result
     */
    invalidate,

    /**
     * Whether the cache is stale
     */
    isStale,

    /**
     * The last arguments used to execute the function
     */
    lastArgs: state.lastArgs,
  };
}

export default useCache;
