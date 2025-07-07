/**
 * @file cache-middleware.ts
 * @description HTTP response caching middleware for API routes
 *
 * This middleware provides HTTP response caching for API routes,
 * allowing frequently accessed endpoints to be served from cache
 * rather than recomputing the response each time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from '../utils/cache-manager';
import { ErrorCategory, handleError } from '../utils/error-handler';
import { env } from '../utils/env';

/**
 * Cache type specifically for API responses
 */
export type ApiCacheType = 'response';

/**
 * Options for configuring the caching behavior
 */
export interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   * @default 60000 (1 minute)
   */
  ttl?: number;

  /**
   * Whether to vary the cache by the user's session
   * @default false
   */
  varyByUser?: boolean;

  /**
   * Whether to vary the cache by specific headers
   * @default []
   */
  varyByHeaders?: string[];

  /**
   * Whether to vary the cache by query parameters
   * @default true
   */
  varyByQuery?: boolean;

  /**
   * Whether to disable caching in development mode
   * @default true
   */
  disableInDevelopment?: boolean;

  /**
   * A custom key generator function
   */
  keyGenerator?: (req: NextRequest) => string;

  /**
   * Keys to exclude from the cache
   */
  excludeKeys?: string[];
}

/**
 * Defaults for cache options
 */
const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 60 * 1000, // 1 minute
  varyByUser: false,
  varyByHeaders: [],
  varyByQuery: true,
  disableInDevelopment: true,
};

/**
 * Generate a cache key for an API request
 */
function generateCacheKey(req: NextRequest, options: CacheOptions): string {
  // If a custom key generator is provided, use it
  if (options.keyGenerator) {
    return options.keyGenerator(req);
  }

  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  // Start with the method and path
  const keyParts = [`${method}:${path}`];

  // Add query parameters if configured
  if (options.varyByQuery && url.search) {
    keyParts.push(url.search);
  }

  // Add specified headers if configured
  if (options.varyByHeaders && options.varyByHeaders.length > 0) {
    const headerValues = options.varyByHeaders.map(header => {
      const value = req.headers.get(header) || '';
      return `${header}=${value}`;
    });

    if (headerValues.length > 0) {
      keyParts.push(headerValues.join('&'));
    }
  }

  // Add user session if configured
  if (options.varyByUser) {
    const sessionId =
      req.cookies.get('session')?.value || req.headers.get('x-session-id') || 'anonymous';
    keyParts.push(`user=${sessionId}`);
  }

  return keyParts.join('|');
}

/**
 * Middleware to cache API responses
 *
 * @param handler The API route handler
 * @param options Cache configuration options
 * @returns A handler with caching capabilities
 *
 * @example
 * // Basic usage with default options (1 minute TTL)
 * export const GET = withCache(async (req) => {
 *   // Expensive operation...
 *   return NextResponse.json({ data });
 * });
 *
 * // Advanced usage with custom options
 * export const GET = withCache(
 *   async (req) => {
 *     // Expensive operation...
 *     return NextResponse.json({ data });
 *   },
 *   {
 *     ttl: 5 * 60 * 1000, // 5 minutes
 *     varyByUser: true,
 *     varyByHeaders: ['x-api-version']
 *   }
 * );
 */
export function withCache(
  handler: (req: NextRequest) => Promise<Response> | Response,
  options: CacheOptions = {}
) {
  // Merge with default options
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get the cache manager instance
  const cacheManager = CacheManager.getInstance();

  return async function (req: NextRequest): Promise<Response> {
    try {
      // Skip caching for non-GET methods
      if (req.method !== 'GET') {
        return await handler(req);
      }

      // Skip caching in development if configured
      if (opts.disableInDevelopment && env.isDevelopment) {
        return await handler(req);
      }

      // Skip caching if requested in headers
      if (req.headers.get('x-cache-control') === 'no-cache') {
        return await handler(req);
      }

      // Generate cache key
      const cacheKey = generateCacheKey(req, opts);

      // Check if this key should be excluded
      if (opts.excludeKeys && opts.excludeKeys.includes(cacheKey)) {
        return await handler(req);
      }

      // Try to get from cache
      const cachedResponse = cacheManager.get<Response>(cacheKey, 'response');

      if (cachedResponse) {
        // Clone the cached response
        const response = cachedResponse.clone();

        // Add cache-related headers
        response.headers.set('x-cache', 'hit');

        return response;
      }

      // Cache miss - execute the handler
      const response = await handler(req);

      // Only cache successful responses
      if (response.ok && response.status < 400) {
        // Clone the response to store in cache
        const clonedResponse = response.clone();

        // Store in cache
        cacheManager.set(cacheKey, clonedResponse, 'response');

        // Add cache-related headers
        response.headers.set('x-cache', 'miss');
      }

      return response;
    } catch (error) {
      // Handle errors
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: {
          operation: 'withCache',
          url: req.url,
          method: req.method,
        },
        logLevel: 'error',
        rethrow: true,
      });

      // If error handling rethrows, this won't be reached,
      // but TypeScript requires a return
      throw error;
    }
  };
}

/**
 * Middleware to invalidate API response cache entries
 *
 * @param pattern Pattern to match cache keys against
 * @returns A handler that invalidates matching cache entries
 *
 * @example
 * // Invalidate all product cache entries
 * export const POST = invalidateCache('GET:/api/products');
 */
export function invalidateCache(pattern: string | RegExp) {
  return async function (req: NextRequest): Promise<Response> {
    try {
      const cacheManager = CacheManager.getInstance();
      let count = 0;

      // Get all response cache keys
      const cache = cacheManager['cache'] as Map<string, any>;
      const keyPrefix = 'response:';

      // Iterate through all cache entries
      for (const [key, _] of Array.from(cache.entries())) {
        if (key.startsWith(keyPrefix)) {
          const cacheKey = key.substring(keyPrefix.length);

          // Check if the key matches the pattern
          const matches =
            typeof pattern === 'string' ? cacheKey.includes(pattern) : pattern.test(cacheKey);

          if (matches) {
            cacheManager.invalidate(cacheKey, 'response');
            count++;
          }
        }
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: `Invalidated ${count} cache entries matching ${pattern}`,
        count,
      });
    } catch (error) {
      // Handle errors
      handleError(error, {
        category: ErrorCategory.STORAGE,
        context: {
          operation: 'invalidateCache',
          pattern: String(pattern),
        },
        logLevel: 'error',
        rethrow: false,
      });

      // Return error response
      return NextResponse.json(
        {
          success: false,
          message: `Error invalidating cache: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 }
      );
    }
  };
}

export const cacheMiddleware = {
  withCache,
  invalidateCache,
};

export default cacheMiddleware;
