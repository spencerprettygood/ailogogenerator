/**
 * @file performance-middleware.ts
 * @module lib/middleware/performance-middleware
 * @description Performance monitoring middleware for the AI Logo Generator
 *
 * This middleware tracks and records performance metrics for API requests.
 *
 * @author AILogoGenerator Team
 * @version 1.0.0
 * @copyright 2024
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '../utils/performance-monitor';
import { telemetry } from '../telemetry';

/**
 * @interface ResponseWithMetrics
 * @description Extended NextResponse with performance metrics
 */
interface ResponseWithMetrics extends NextResponse {
  metrics?: {
    startTime: number;
    requestSize: number;
  };
}

/**
 * @function withPerformanceMonitoring
 * @description Higher-order function that adds performance monitoring to an API route handler
 *
 * @param {Function} handler - The original API route handler
 * @returns {Function} Enhanced handler with performance monitoring
 *
 * @example
 * // In an API route file
 * import { withPerformanceMonitoring } from '@/lib/middleware/performance-middleware';
 *
 * async function handler(req: NextRequest) {
 *   // Handle the request normally
 *   return NextResponse.json({ message: 'Success' });
 * }
 *
 * export const GET = withPerformanceMonitoring(handler);
 */
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<Response | NextResponse> | Response | NextResponse
) {
  return async function (req: NextRequest): Promise<Response | NextResponse> {
    // Skip monitoring if disabled
    if (!performanceMonitor.isEnabled()) {
      return handler(req);
    }

    const startTime = Date.now();
    const url = new URL(req.url);
    const endpoint = `${req.method} ${url.pathname}`;

    // Attempt to get request body size
    let requestSize = 0;
    try {
      const clone = req.clone();
      const text = await clone.text();
      requestSize = new TextEncoder().encode(text).length;
    } catch {
      // Ignore errors in measuring request size
    }

    try {
      // Call the original handler
      const response = (await handler(req)) as ResponseWithMetrics;

      // Store metrics in the response for the after-response logic
      response.metrics = {
        startTime,
        requestSize,
      };

      return response;
    } catch (error) {
      // Record failed request
      const endTime = Date.now();

      performanceMonitor.recordAPICall({
        endpoint,
        method: req.method,
        startTime,
        endTime,
        statusCode: 500,
        requestSize,
        name: `API: ${endpoint}`,
        category: 'api',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          path: url.pathname,
          query: Object.fromEntries(url.searchParams.entries()),
        },
      });

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * @function afterResponse
 * @description Middleware to record API performance metrics after response is sent
 *
 * @param {ResponseWithMetrics} response - The response object with metrics
 * @param {NextRequest} request - The original request
 */
export function afterResponse(response: ResponseWithMetrics, request: NextRequest): void {
  // Skip if monitoring is disabled or metrics aren't present
  if (!performanceMonitor.isEnabled() || !response.metrics) {
    return;
  }

  const { startTime, requestSize } = response.metrics;
  const endTime = Date.now();
  const url = new URL(request.url);
  const endpoint = `${request.method} ${url.pathname}`;

  // Attempt to get response size
  let responseSize = 0;
  try {
    if (response.body) {
      // For streams, we can't easily measure the size
      // This is a rough estimate based on headers
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        responseSize = parseInt(contentLength, 10);
      }
    } else {
      // For JSON responses, we can estimate from the content
      const text = JSON.stringify(response);
      responseSize = new TextEncoder().encode(text).length;
    }
  } catch {
    // Ignore errors in measuring response size
  }

  // Record API call metrics
  // Record metrics in both systems for completeness
  performanceMonitor.recordAPICall({
    endpoint,
    method: request.method,
    startTime,
    endTime,
    statusCode: response.status,
    requestSize,
    responseSize,
    name: `API: ${endpoint}`,
    category: 'api',
    metadata: {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      contentType: response.headers.get('content-type') || 'unknown',
    },
  });

  // Also record in our telemetry system
  telemetry.recordEvent('api_call', {
    endpoint,
    method: request.method,
    duration: endTime - startTime,
    statusCode: response.status,
    path: url.pathname,
    contentType: response.headers.get('content-type') || 'unknown',
  });

  // Add timing metrics
  telemetry.recordMetric({
    name: `api_${request.method.toLowerCase()}_duration`,
    value: endTime - startTime,
    timestamp: endTime,
    type: 'histogram',
  });
}

/**
 * @function middleware
 * @description Next.js middleware function for performance monitoring
 * @param {NextRequest} request - The incoming request
 * @returns {NextResponse} The response (possibly modified)
 */
export function middleware(request: NextRequest): NextResponse {
  // This function will be executed for every request
  // We'll use it to set up performance monitoring

  // For now, just pass through - actual monitoring happens in withPerformanceMonitoring
  return NextResponse.next();
}
