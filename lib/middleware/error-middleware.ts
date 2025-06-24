import { NextRequest, NextResponse } from 'next/server';
import { 
  AppError, 
  ErrorCategory, 
  ErrorCode, 
  HttpStatusCode, 
  createAppError,
  handleError
} from '@/lib/utils/error-handler';
import { env } from '@/lib/utils/env';

/**
 * Middleware wrapper for error handling in API routes
 * This function wraps an API handler and provides consistent error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<Response> | Response
) {
  return async function(req: NextRequest): Promise<Response> {
    const requestId = crypto.randomUUID().slice(0, 8);
    const url = new URL(req.url);
    
    try {
      // Add a request ID header for tracking
      const response = await handler(req);
      
      // Add request ID to the response headers if it's not already there
      if (response instanceof Response && !response.headers.has('x-request-id')) {
        response.headers.set('x-request-id', requestId);
      }
      
      return response;
    } catch (error) {
      // Handle the error with our standardized error handler
      const appError = handleError(error, {
        context: { 
          url: url.toString(),
          method: req.method,
          path: url.pathname,
          query: Object.fromEntries(url.searchParams.entries())
        },
        requestId,
        rethrow: false,
        silent: false
      });
      
      // Create standardized error response
      const errorResponse = {
        success: false,
        error: {
          message: appError.message,
          code: appError.code,
          requestId: appError.requestId,
          ...(appError.context && { details: appError.context }),
          ...(process.env.NODE_ENV === 'development' && { stack: appError.stack })
        }
      };
      
      // Return formatted error response
      const response = NextResponse.json(
        errorResponse,
        { status: appError.statusCode }
      );
      
      // Add request ID to the response headers
      response.headers.set('x-request-id', requestId);
      
      return response;
    }
  };
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  message: string, 
  options: {
    statusCode?: HttpStatusCode,
    errorCode?: ErrorCode,
    requestId?: string,
    additionalData?: Record<string, any>
  } = {}
) {
  const { 
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR, 
    errorCode = ErrorCode.INTERNAL_ERROR,
    requestId = crypto.randomUUID().slice(0, 8),
    additionalData = {}
  } = options;
  
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: errorCode,
        requestId,
        ...additionalData
      }
    },
    { 
      status: statusCode,
      headers: {
        'x-request-id': requestId
      }
    }
  );
}

/**
 * Wrapper for API route handlers with standardized error handling and response formatting
 * @param handler - The API route handler function
 * @returns A function that handles errors consistently
 */
export function createApiHandler<T>(
  handler: (req: NextRequest) => Promise<T>,
) {
  return withErrorHandling(async (req: NextRequest) => {
    const result = await handler(req);
    
    // If result is already a Response, return it
    if (result instanceof Response) {
      return result;
    }
    
    // Otherwise, convert to a JSON response with standard format
    return NextResponse.json({
      success: true,
      data: result,
      requestId: req.headers.get('x-request-id') || crypto.randomUUID().slice(0, 8)
    });
  });
}

/**
 * Factory function to create specialized API error handlers
 */
export const apiErrorFactory = {
  badRequest: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.USER_INPUT,
      statusCode: HttpStatusCode.BAD_REQUEST,
      code: ErrorCode.BAD_REQUEST,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  unauthorized: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.AUTHENTICATION,
      statusCode: HttpStatusCode.UNAUTHORIZED,
      code: ErrorCode.UNAUTHORIZED,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  forbidden: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.AUTHORIZATION,
      statusCode: HttpStatusCode.FORBIDDEN,
      code: ErrorCode.FORBIDDEN,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  notFound: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.NOT_FOUND,
      statusCode: HttpStatusCode.NOT_FOUND,
      code: ErrorCode.NOT_FOUND,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  methodNotAllowed: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.USER_INPUT,
      statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
      code: ErrorCode.METHOD_NOT_ALLOWED,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  conflict: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.CONFLICT,
      statusCode: HttpStatusCode.CONFLICT,
      code: ErrorCode.CONFLICT,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  rateLimited: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.RATE_LIMIT,
      statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
      code: ErrorCode.RATE_LIMITED,
      isRetryable: true,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  internal: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.INTERNAL,
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      isOperational: false,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  serviceUnavailable: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.EXTERNAL,
      statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      isRetryable: true,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  timeout: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.TIMEOUT,
      statusCode: HttpStatusCode.GATEWAY_TIMEOUT,
      code: ErrorCode.TIMEOUT,
      isRetryable: true,
      context: details ? { details } : undefined,
      requestId
    });
  },
  
  validation: (message: string, details?: unknown, requestId?: string) => {
    return createAppError(message, {
      category: ErrorCategory.VALIDATION,
      statusCode: HttpStatusCode.BAD_REQUEST,
      code: ErrorCode.VALIDATION_FAILED,
      context: details ? { details } : undefined,
      requestId
    });
  }
};

export default {
  withErrorHandling,
  createErrorResponse,
  createApiHandler,
  apiErrorFactory
};