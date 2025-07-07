/**
 * @file error-handler.ts
 * @description Centralized error handling utility for consistent error management
 *
 * This utility provides standardized error handling, categorization, and reporting
 * across the application, ensuring consistent user experiences and proper error tracking.
 */

import { errorReporter, ErrorSeverity as ReporterSeverity } from './error-reporter';
import { env } from './env';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Error categories for better organization and filtering
 */
// Unified ErrorCategory enum for all error handling (sync with lib/types.ts)
export enum ErrorCategory {
  // Infrastructure errors
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  STORAGE = 'storage',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  RESOURCE_EXHAUSTED = 'resource_exhausted',

  // Application logic errors
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',

  // Resource errors
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',

  // External service errors
  API = 'api',
  CLAUDE_API = 'claude_api',
  EXTERNAL = 'external',

  // Client errors
  UI = 'ui',
  USER_INPUT = 'user_input',
  RENDERING = 'rendering',
  SVG = 'svg',
  SVG_PARSING = 'svg_parsing',
  SVG_VALIDATION = 'svg_validation',
  SVG_RENDERING = 'svg_rendering',
  ANIMATION = 'animation',
  DOWNLOAD = 'download',

  // System errors
  INTERNAL = 'internal',
  UNEXPECTED = 'unexpected',

  // Unknown/generic errors
  UNKNOWN = 'unknown',

  // API error categories for middleware mapping
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
}

/**
 * HTTP status codes for standard error responses
 */
export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  BAD_REQUEST = 'bad_request',
  VALIDATION_FAILED = 'validation_failed',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  METHOD_NOT_ALLOWED = 'method_not_allowed',
  CONFLICT = 'conflict',
  RATE_LIMITED = 'rate_limited',
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  SVG_ERROR = 'svg_error',
  ANIMATION_ERROR = 'animation_error',
  CLAUDE_API_ERROR = 'claude_api_error',
  UNEXPECTED_ERROR = 'unexpected_error',
}

/**
 * Maps error categories to default HTTP status codes
 */
const categoryToStatusCode: Record<ErrorCategory, HttpStatusCode> = {
  [ErrorCategory.VALIDATION]: HttpStatusCode.BAD_REQUEST,
  [ErrorCategory.AUTHENTICATION]: HttpStatusCode.UNAUTHORIZED,
  [ErrorCategory.AUTHORIZATION]: HttpStatusCode.FORBIDDEN,
  [ErrorCategory.NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ErrorCategory.CONFLICT]: HttpStatusCode.CONFLICT,
  [ErrorCategory.RATE_LIMIT]: HttpStatusCode.TOO_MANY_REQUESTS,
  [ErrorCategory.TIMEOUT]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ErrorCategory.NETWORK]: HttpStatusCode.BAD_GATEWAY,
  [ErrorCategory.API]: HttpStatusCode.BAD_GATEWAY,
  [ErrorCategory.CLAUDE_API]: HttpStatusCode.BAD_GATEWAY,
  [ErrorCategory.EXTERNAL]: HttpStatusCode.BAD_GATEWAY,
  [ErrorCategory.SVG]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ErrorCategory.SVG_PARSING]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ErrorCategory.SVG_VALIDATION]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ErrorCategory.SVG_RENDERING]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ErrorCategory.ANIMATION]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ErrorCategory.DATABASE]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.STORAGE]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.BUSINESS_LOGIC]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.RESOURCE_EXHAUSTED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [ErrorCategory.UI]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.USER_INPUT]: HttpStatusCode.BAD_REQUEST,
  [ErrorCategory.RENDERING]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.DOWNLOAD]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.UNEXPECTED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.INTERNAL]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCategory.UNKNOWN]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  // API error categories for middleware mapping
  [ErrorCategory.VALIDATION_ERROR]: HttpStatusCode.BAD_REQUEST,
  [ErrorCategory.AUTHENTICATION_ERROR]: HttpStatusCode.UNAUTHORIZED,
  [ErrorCategory.INTERNAL_SERVER_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
};

/**
 * Maps error categories to default error codes
 */
const categoryToErrorCode: Record<ErrorCategory, ErrorCode> = {
  [ErrorCategory.VALIDATION]: ErrorCode.VALIDATION_FAILED,
  [ErrorCategory.AUTHENTICATION]: ErrorCode.UNAUTHORIZED,
  [ErrorCategory.AUTHORIZATION]: ErrorCode.FORBIDDEN,
  [ErrorCategory.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [ErrorCategory.CONFLICT]: ErrorCode.CONFLICT,
  [ErrorCategory.RATE_LIMIT]: ErrorCode.RATE_LIMITED,
  [ErrorCategory.TIMEOUT]: ErrorCode.TIMEOUT,
  [ErrorCategory.NETWORK]: ErrorCode.NETWORK_ERROR,
  [ErrorCategory.API]: ErrorCode.SERVICE_UNAVAILABLE,
  [ErrorCategory.CLAUDE_API]: ErrorCode.CLAUDE_API_ERROR,
  [ErrorCategory.EXTERNAL]: ErrorCode.SERVICE_UNAVAILABLE,
  [ErrorCategory.SVG]: ErrorCode.SVG_ERROR,
  [ErrorCategory.SVG_PARSING]: ErrorCode.SVG_ERROR,
  [ErrorCategory.SVG_VALIDATION]: ErrorCode.SVG_ERROR,
  [ErrorCategory.SVG_RENDERING]: ErrorCode.SVG_ERROR,
  [ErrorCategory.ANIMATION]: ErrorCode.ANIMATION_ERROR,
  [ErrorCategory.DATABASE]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.STORAGE]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.BUSINESS_LOGIC]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.RESOURCE_EXHAUSTED]: ErrorCode.RATE_LIMITED,
  [ErrorCategory.UI]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.USER_INPUT]: ErrorCode.BAD_REQUEST,
  [ErrorCategory.RENDERING]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.DOWNLOAD]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.UNEXPECTED]: ErrorCode.UNEXPECTED_ERROR,
  [ErrorCategory.INTERNAL]: ErrorCode.INTERNAL_ERROR,
  [ErrorCategory.UNKNOWN]: ErrorCode.UNEXPECTED_ERROR,
  // API error categories for middleware mapping
  [ErrorCategory.VALIDATION_ERROR]: ErrorCode.VALIDATION_FAILED,
  [ErrorCategory.AUTHENTICATION_ERROR]: ErrorCode.UNAUTHORIZED,
  [ErrorCategory.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
};

/**
 * Determines if an error should be retried based on its category
 */
const retryableCategories = new Set([
  ErrorCategory.NETWORK,
  ErrorCategory.TIMEOUT,
  ErrorCategory.RATE_LIMIT,
  ErrorCategory.API,
  ErrorCategory.CLAUDE_API,
  ErrorCategory.EXTERNAL,
]);

/**
 * Standardized error interface with additional metadata
 */
export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: ErrorCode;
  statusCode: HttpStatusCode;
  context?: Record<string, unknown>;
  originalError?: Error | unknown;
  isOperational: boolean;
  isRetryable: boolean;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  stackId?: string;
}

/**
 * Creates a standardized error object with additional metadata
 */
export function createAppError(
  message: string,
  options: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    code?: ErrorCode;
    statusCode?: HttpStatusCode;
    cause?: Error | unknown;
    context?: Record<string, unknown>;
    isOperational?: boolean;
    isRetryable?: boolean;
    requestId?: string;
    userId?: string;
  } = {}
): AppError {
  const category = options.category || ErrorCategory.UNKNOWN;

  // Create error object with enhanced properties
  const error = new Error(message) as AppError;
  error.name = `AppError[${category}]`;
  error.category = category;
  error.severity = options.severity || ErrorSeverity.ERROR;
  error.code = options.code || categoryToErrorCode[category];
  error.statusCode = options.statusCode || categoryToStatusCode[category];
  error.context = options.context || {};
  error.originalError = options.cause;
  error.isOperational = options.isOperational !== undefined ? options.isOperational : true;
  error.isRetryable =
    options.isRetryable !== undefined ? options.isRetryable : retryableCategories.has(category);
  error.timestamp = new Date();
  error.requestId = options.requestId || crypto.randomUUID().slice(0, 8);
  error.userId = options.userId;
  error.stackId = crypto.randomUUID().slice(0, 6);

  // Capture stack trace
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createAppError);
  }

  return error;
}

/**
 * Maps severity from our enum to error reporter's enum
 */
function mapSeverityToReporter(severity: ErrorSeverity): ReporterSeverity {
  switch (severity) {
    case ErrorSeverity.FATAL:
      return 'fatal';
    case ErrorSeverity.ERROR:
      return 'error';
    case ErrorSeverity.WARNING:
      return 'warning';
    case ErrorSeverity.INFO:
      return 'info';
    default:
      return 'error';
  }
}

/**
 * Handles an error with consistent logging, reporting, and optional propagation
 * @param error The error to handle
 * @param options Additional handling options
 * @returns The original error or a wrapped AppError for propagation
 */
export function handleError<T extends Error | unknown>(
  error: T,
  options: {
    context?: Record<string, unknown>;
    category?: ErrorCategory;
    rethrow?: boolean;
    silent?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    userId?: string;
    requestId?: string;
  } = {}
): AppError {
  const {
    context = {},
    category,
    rethrow = false,
    silent = false,
    logLevel = 'error',
    userId,
    requestId,
  } = options;

  // Normalize the error to an AppError
  const appError =
    error instanceof Error && 'category' in error && typeof (error as any).severity !== 'undefined'
      ? (error as unknown as AppError)
      : createAppError(error instanceof Error ? error.message : String(error), {
          category,
          cause: error,
          context,
          isOperational: true,
          userId,
          requestId,
        });

  // Merge context if the error already had context
  if (context && Object.keys(context).length > 0) {
    appError.context = { ...appError.context, ...context };
  }

  // Log the error (unless silent)
  if (!silent) {
    const errorMeta = {
      errorId: appError.stackId,
      category: appError.category,
      code: appError.code,
      context: appError.context,
      timestamp: appError.timestamp.toISOString(),
      isOperational: appError.isOperational,
      isRetryable: appError.isRetryable,
      ...(appError.requestId && { requestId: appError.requestId }),
      ...(appError.userId && { userId: appError.userId }),
    };

    if (logLevel === 'error') {
      console.error(`[${appError.category}] ${appError.message}`, errorMeta);
    } else if (logLevel === 'warn') {
      console.warn(`[${appError.category}] ${appError.message}`, errorMeta);
    } else if (logLevel === 'info') {
      console.info(`[${appError.category}] ${appError.message}`, errorMeta);
    } else {
      console.debug(`[${appError.category}] ${appError.message}`, errorMeta);
    }
  }

  // Report error to monitoring service in production only
  if (env.isProduction) {
    if (appError.severity !== ErrorSeverity.INFO) {
      errorReporter.reportError(
        appError,
        {
          additionalInfo: {
            ...appError.context,
            category: appError.category,
            code: appError.code,
            statusCode: appError.statusCode,
            isOperational: appError.isOperational,
            isRetryable: appError.isRetryable,
            errorId: appError.stackId,
            ...(appError.requestId && { requestId: appError.requestId }),
            ...(appError.userId && { userId: appError.userId }),
          },
        },
        mapSeverityToReporter(appError.severity)
      );
    }
  }

  // Rethrow if requested
  if (rethrow) {
    throw appError;
  }

  return appError;
}

/**
 * Wraps an async function with consistent error handling
 * @param fn The async function to wrap
 * @param options Error handling options
 * @returns A wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    context?: Record<string, unknown>;
    category?: ErrorCategory;
    rethrow?: boolean;
    silent?: boolean;
  } = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return (await fn(...args)) as Awaited<ReturnType<T>>;
    } catch (error) {
      const appError = handleError(error, {
        context: {
          ...options.context,
          functionName: fn.name,
          arguments: args
            .map(arg => (typeof arg === 'object' ? '[Object]' : String(arg)))
            .join(', '),
        },
        category: options.category,
        rethrow: false,
        silent: options.silent,
      });
      if (options.rethrow) throw appError;
      return Promise.reject(appError) as Promise<Awaited<ReturnType<T>>>;
    }
  };
}

/**
 * Attempts to execute an operation with retries and consistent error handling
 * @param operation The operation to attempt
 * @param options Retry and error handling options
 * @returns The result of the operation or throws after exhausting retries
 */
export async function tryWithRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffFactor?: number;
    context?: Record<string, unknown>;
    category?: ErrorCategory;
    retryableErrors?: Array<string | RegExp | ((error: Error) => boolean)>;
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
    retryCondition?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 500,
    backoffFactor = 2,
    context = {},
    category = ErrorCategory.UNKNOWN,
    retryableErrors = [],
    onRetry,
    retryCondition,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));
      lastError = appError;

      // Determine if error is retryable
      const isRetryable =
        attempt <= maxRetries &&
        // If a custom retry condition is provided, use it
        ((retryCondition && retryCondition(appError)) ||
          // If the error is an AppError with isRetryable property
          (appError as AppError).isRetryable ||
          // Or if it matches any of the retryable patterns
          (retryableErrors.length > 0 &&
            retryableErrors.some(pattern => {
              if (typeof pattern === 'function') {
                return pattern(appError);
              }
              if (typeof pattern === 'string') {
                return appError.message.includes(pattern);
              }
              return pattern.test(appError.message);
            })));

      if (!isRetryable) {
        break;
      }

      // Calculate backoff delay
      const currentDelayMs = delayMs * Math.pow(backoffFactor, attempt - 1);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(appError, attempt, currentDelayMs);
      }

      // Log retry attempt
      console.warn(
        `[Retry ${attempt}/${maxRetries}] Operation failed, retrying in ${currentDelayMs}ms...`,
        {
          error: appError.message,
          attempt,
          maxRetries,
          delay: currentDelayMs,
          category: (appError as AppError).category || category,
        }
      );

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelayMs));
    }
  }

  // If we've exhausted retries, handle the last error
  handleError(lastError!, {
    context: {
      ...context,
      retriesAttempted: maxRetries,
    },
    category,
    rethrow: true,
  });

  // This code is unreachable due to the rethrow above, but TypeScript needs it
  throw lastError;
}

/**
 * Creates specialized error factories for common error types
 */
export const ErrorFactory = {
  validation: (message: string, context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      code: ErrorCode.VALIDATION_FAILED,
      context,
    }),

  notFound: (resource: string, id?: string | number) =>
    createAppError(`${resource} not found${id ? `: ${id}` : ''}`, {
      category: ErrorCategory.NOT_FOUND,
      code: ErrorCode.NOT_FOUND,
      context: { resource, id },
    }),

  unauthorized: (message = 'Unauthorized access', context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.AUTHENTICATION,
      code: ErrorCode.UNAUTHORIZED,
      context,
    }),

  forbidden: (message = 'Access forbidden', context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.AUTHORIZATION,
      code: ErrorCode.FORBIDDEN,
      context,
    }),

  network: (message: string, context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.NETWORK,
      code: ErrorCode.NETWORK_ERROR,
      isRetryable: true,
      context,
    }),

  timeout: (operation: string, durationMs?: number) =>
    createAppError(
      `Operation timed out: ${operation}${durationMs ? ` after ${durationMs}ms` : ''}`,
      {
        category: ErrorCategory.TIMEOUT,
        code: ErrorCode.TIMEOUT,
        isRetryable: true,
        context: { operation, durationMs },
      }
    ),

  rateLimit: (message = 'Rate limit exceeded', context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.RATE_LIMIT,
      code: ErrorCode.RATE_LIMITED,
      isRetryable: true,
      context,
    }),

  svg: (message: string, subCategory?: ErrorCategory, context?: Record<string, unknown>) =>
    createAppError(message, {
      category: subCategory || ErrorCategory.SVG,
      code: ErrorCode.SVG_ERROR,
      context,
    }),

  animation: (message: string, context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.ANIMATION,
      code: ErrorCode.ANIMATION_ERROR,
      context,
    }),

  claudeApi: (message: string, context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.CLAUDE_API,
      code: ErrorCode.CLAUDE_API_ERROR,
      isRetryable: true,
      context,
    }),

  internal: (message: string, context?: Record<string, unknown>) =>
    createAppError(message, {
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      isOperational: false,
      context,
    }),

  unexpected: (error: unknown, context?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : String(error);
    return createAppError(`Unexpected error: ${message}`, {
      category: ErrorCategory.UNEXPECTED,
      severity: ErrorSeverity.ERROR,
      code: ErrorCode.UNEXPECTED_ERROR,
      isOperational: false,
      cause: error,
      context,
    });
  },
};

/**
 * Create an error boundary event handler for React components
 * @returns An error handler function for React error boundaries
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    handleError(error, {
      context: {
        component: componentName,
        componentStack: errorInfo.componentStack,
        ui: true,
      },
      category: ErrorCategory.UI,
    });
  };
}

export default {
  createAppError,
  handleError,
  withErrorHandling,
  tryWithRetry,
  ErrorFactory,
  createErrorBoundaryHandler,
  ErrorCategory,
  ErrorSeverity,
  ErrorCode,
  HttpStatusCode,
};
