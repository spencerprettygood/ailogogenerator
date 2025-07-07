/**
 * @file route.ts
 * @description API route for clearing and managing cache
 *
 * This route provides endpoints for clearing and managing the application's
 * various caches, including the CacheManager, memoization caches, and more.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/middleware/error-middleware';
import { CacheManager } from '@/lib/utils/cache-manager';
import { extendedCacheManager } from '@/lib/utils/cache-manager-extended';
import { clearAllMemoizationCaches, getMemoizationStats } from '@/lib/utils/memoize';
import { ErrorCategory, ErrorFactory } from '@/lib/utils/error-handler';

/**
 * GET /api/clear-cache
 * Get cache statistics
 */
export const GET = createApiHandler(async (req: NextRequest) => {
  // Only allow in development mode unless explicitly enabled
  if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_CACHE_MANAGEMENT !== 'true') {
    throw ErrorFactory.forbidden(
      'Endpoint only available in development mode or when explicitly enabled'
    );
  }

  const url = new URL(req.url);
  const includeDetailed = url.searchParams.get('detailed') === 'true';
  const includeMemStats = url.searchParams.get('memory') === 'true';

  // Get basic cache stats
  const cacheManager = CacheManager.getInstance();
  const basicStats = cacheManager.getStats();

  // Get memoization stats
  const memoStats = getMemoizationStats();

  const response: any = {
    cache: basicStats,
    memoization: {
      count: Object.keys(memoStats).length,
      functions: memoStats,
    },
  };

  // Add detailed stats if requested
  if (includeDetailed) {
    response.detailedCache = extendedCacheManager.getDetailedStats();
  }

  // Add memory stats if requested
  if (includeMemStats && typeof process !== 'undefined') {
    try {
      const memoryUsage = process.memoryUsage();
      response.memory = {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        usagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      };
    } catch (error) {
      response.memory = { error: 'Memory stats not available' };
    }
  }

  return response;
});

/**
 * POST /api/clear-cache
 * Clear cache based on request parameters
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow in development mode unless explicitly enabled
    if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_CACHE_MANAGEMENT !== 'true') {
      return NextResponse.json(
        {
          error: 'Endpoint only available in development mode or when explicitly enabled',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));

    // Determine what to clear
    const clearAll = body.clearAll === true;
    const clearTypes = Array.isArray(body.types) ? body.types : [];
    const clearMemoization = body.clearMemoization === true;

    const cacheManager = CacheManager.getInstance();
    let clearedTypes: string[] = [];

    // Clear specified cache types
    if (clearAll || (!clearAll && clearTypes.length === 0 && !clearMemoization)) {
      // Default behavior - clear everything
      cacheManager.clear();
      clearedTypes = ['generation', 'intermediate', 'asset', 'progress'];
    } else if (clearTypes.length > 0) {
      const validTypes = ['generation', 'intermediate', 'asset', 'progress'];

      // Clear each type
      for (const type of clearTypes) {
        if (validTypes.includes(type)) {
          cacheManager.invalidateType(type as any);
          clearedTypes.push(type);
        }
      }
    }

    // Clear memoization caches if requested
    if (clearMemoization) {
      clearAllMemoizationCaches();
    }

    // Return success
    return NextResponse.json({
      success: true,
      cleared: {
        cacheTypes: clearedTypes,
        memoization: clearMemoization,
      },
      stats: cacheManager.getStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
