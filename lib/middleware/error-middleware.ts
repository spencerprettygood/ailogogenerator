import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard error codes used by the API
 */
export enum ErrorCode {
  BAD_REQUEST = 'bad_request',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  METHOD_NOT_ALLOWED = 'method_not_allowed',
  CONFLICT = 'conflict',
  RATE_LIMITED = 'rate_limited',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  TIMEOUT = 'timeout',
  VALIDATION_ERROR = 'validation_error'
}

/**
 * Custom API error class with standardized error handling
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  requestId: string;
  help?: string;
  
  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    help?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.help = help;
    this.requestId = crypto.randomUUID().slice(0, 8);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  
  // Factory methods for common errors
  static badRequest(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(400, ErrorCode.BAD_REQUEST, message, details, help);
  }
  
  static unauthorized(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(401, ErrorCode.UNAUTHORIZED, message, details, help);
  }
  
  static forbidden(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(403, ErrorCode.FORBIDDEN, message, details, help);
  }
  
  static notFound(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(404, ErrorCode.NOT_FOUND, message, details, help);
  }
  
  static methodNotAllowed(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(405, ErrorCode.METHOD_NOT_ALLOWED, message, details, help);
  }
  
  static rateLimited(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(429, ErrorCode.RATE_LIMITED, message, details, help);
  }
  
  static internal(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(500, ErrorCode.INTERNAL_SERVER_ERROR, message, details, help);
  }
  
  static serviceUnavailable(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(503, ErrorCode.SERVICE_UNAVAILABLE, message, details, help);
  }
  
  static timeout(message: string, details?: unknown, help?: string): ApiError {
    return new ApiError(504, ErrorCode.TIMEOUT, message, details, help);
  }
};

/**
 * Middleware wrapper for error handling in API routes
 * This function wraps an API handler and provides consistent error handling
 */
/**
 * Improved error handling middleware for API routes
 * This function wraps an API handler and provides consistent error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<Response> | Response
) {
  return async function(req: NextRequest): Promise<Response> {
    try {
      // Attempt to execute the handler
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      
      // If it's already an ApiError, use it directly
      if (error instanceof ApiError) {
        const errorResponse = {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            requestId: error.requestId,
            ...(error.details && { details: error.details }),
            ...(error.help && { help: error.help })
          }
        };
        
        // Add stack trace in development
        if (process.env.NODE_ENV === 'development') {
          errorResponse.error.stack = error.stack;
        }
        
        return NextResponse.json(errorResponse, { status: error.statusCode });
      }
      
      // Handle regular Error objects
      let statusCode = 500;
      let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      
      // Try to determine appropriate status code from error message
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('not found')) {
          statusCode = 404;
          errorCode = ErrorCode.NOT_FOUND;
        } else if (msg.includes('unauthorized') || msg.includes('unauthenticated')) {
          statusCode = 401;
          errorCode = ErrorCode.UNAUTHORIZED;
        } else if (msg.includes('forbidden')) {
          statusCode = 403;
          errorCode = ErrorCode.FORBIDDEN;
        } else if (msg.includes('bad request') || msg.includes('invalid')) {
          statusCode = 400;
          errorCode = ErrorCode.BAD_REQUEST;
        } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
          statusCode = 429;
          errorCode = ErrorCode.RATE_LIMITED;
        } else if (msg.includes('timeout')) {
          statusCode = 504;
          errorCode = ErrorCode.TIMEOUT;
        } else if (msg.includes('validation')) {
          statusCode = 400;
          errorCode = ErrorCode.VALIDATION_ERROR;
        }
      }
      
      // Create error response
      const errorResponse = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: errorCode,
          requestId: crypto.randomUUID().slice(0, 8),
        }
      };
      
      // Add detailed info in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', error);
        if (error instanceof Error) {
          errorResponse.error.stack = error.stack;
        }
      }
      
      // Add error tracking in production
      if (process.env.NODE_ENV === 'production') {
        // Here you would typically send the error to your error tracking service
        // Example: await reportErrorToService(error, req);
      }
      
      // Return formatted error response
      return NextResponse.json(
        errorResponse,
        { status: statusCode }
      );
    }
  };
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  message: string, 
  statusCode = 500, 
  errorCode = ErrorCode.INTERNAL_SERVER_ERROR,
  additionalData?: Record<string, any>
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: errorCode,
        requestId: crypto.randomUUID().slice(0, 8),
        ...additionalData
      }
    },
    { status: statusCode }
  );
}

/**
 * Wrapper for API route handlers with standardized error handling
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
    
    // Otherwise, convert to a JSON response
    return NextResponse.json({
      success: true,
      data: result
    });
  });
}