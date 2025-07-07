/**
 * API Utilities
 *
 * Common utilities for API routes to ensure secure and consistent handling
 * of requests, responses, and error management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from './utils/env';

/**
 * Standard API response structure
 */
export type ApiResponse<T = any> = { success: true; data: T } | { success: false; error: ApiError };

/**
 * Standard API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * API error codes for consistent error handling
 */
export enum ApiErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_GATEWAY = 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Map API error codes to HTTP status codes
 */
const errorStatusMap: Record<ApiErrorCode, number> = {
  [ApiErrorCode.INVALID_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.RATE_LIMITED]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.BAD_GATEWAY]: 502,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ApiErrorCode.TIMEOUT]: 504,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
};

/**
 * Create a success response
 *
 * @param data The data to return
 * @returns Formatted API response with success status
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Create an error response
 *
 * @param code The error code
 * @param message User-friendly error message
 * @param details Additional error details (optional)
 * @returns Formatted API response with error status
 */
export function createErrorResponse(
  code: ApiErrorCode | string,
  message: string,
  details?: unknown
): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Handle an API request with validation and error handling
 *
 * @param req The Next.js request object
 * @param schema Zod schema for validating request body
 * @param handler Function to handle the validated request
 * @returns Next.js response
 */
export async function handleApiRequest<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
  handler: (validatedData: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Validate request body against schema
    const body = await req.json().catch(() => ({}));
    const validatedData = schema.parse(body);

    // Call handler with validated data
    return await handler(validatedData);
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(ApiErrorCode.VALIDATION_ERROR, 'Invalid request data', error.format()),
        { status: 422 }
      );
    }

    // Handle other errors
    console.error('API error:', error);

    return NextResponse.json(
      createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred',
        env.NODE_ENV === 'development' ? error : undefined
      ),
      { status: 500 }
    );
  }
}

/**
 * Convert an error to an API response
 *
 * @param error The error to convert
 * @returns API error response
 */
export function errorToApiResponse(error: unknown): ApiResponse<never> {
  if (error instanceof z.ZodError) {
    return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, 'Validation error', error.format());
  }

  if (error instanceof Error) {
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      error.message,
      env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }

  return createErrorResponse(
    ApiErrorCode.INTERNAL_ERROR,
    'An unknown error occurred',
    env.NODE_ENV === 'development' ? error : undefined
  );
}

/**
 * Send an API error response
 *
 * @param error The error to send
 * @param status Optional HTTP status code (defaults to 500)
 * @returns Next.js response
 */
export function sendErrorResponse(error: unknown, status?: number): NextResponse {
  const apiResponse = errorToApiResponse(error);

  // Determine HTTP status code
  let httpStatus = status || 500;

  if (!apiResponse.success && apiResponse.error.code in errorStatusMap) {
    httpStatus = errorStatusMap[apiResponse.error.code as ApiErrorCode];
  }

  return NextResponse.json(apiResponse, { status: httpStatus });
}

/**
 * Wrapper to ensure a function is only called on the server
 * This is an extra safeguard beyond using the server-only package
 *
 * @param fn The function to wrap
 * @returns The wrapped function that will only execute on the server
 */
export function serverOnly<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    // Verify we are in a server context
    if (typeof window !== 'undefined') {
      throw new Error(
        'This function can only be called on the server. ' +
          'You might be importing it in a client component.'
      );
    }
    return fn(...args);
  }) as T;
}
