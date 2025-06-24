/**
 * @file error-handler.ts
 * @description Centralized error handling utility for consistent error management
 * 
 * This utility provides standardized error handling, categorization, and reporting
 * across the application, ensuring consistent user experiences and proper error tracking.
 */

import { errorReporter } from './error-reporter';
import { env } from './env';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Error categories for better organization and filtering
 */
export enum ErrorCategory {
  API = 'api',
  UI = 'ui',
  VALIDATION = 'validation',
  NETWORK = 'network',
  ANIMATION = 'animation',
  SVG = 'svg',
  STORAGE = 'storage',
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  UNKNOWN = 'unknown'
}

/**
 * Standardized error interface with additional metadata
 */
export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  originalError?: Error | unknown;
  isOperational?: boolean;
}

/**
 * Creates a standardized error object with additional metadata
 */
export function createAppError(
  message: string,
  options: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    code?: string;
    cause?: Error | unknown;
    context?: Record<string, any>;
    isOperational?: boolean;
  } = {}
): AppError {
  const {
    category = ErrorCategory.UNKNOWN,
    severity = ErrorSeverity.ERROR,
    code,
    cause,
    context,
    isOperational = true,
  } = options;

  // Create error object with enhanced properties
  const error = new Error(message) as AppError;
  error.name = `AppError[${category}]`;
  error.category = category;
  error.severity = severity;
  error.code = code;
  error.context = context;
  error.originalError = cause;
  error.isOperational = isOperational;

  // Capture stack trace
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createAppError);
  }

  return error;
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
    context?: Record<string, any>;
    category?: ErrorCategory;
    rethrow?: boolean;
    silent?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  } = {}
): AppError {
  const {
    context = {},
    category = ErrorCategory.UNKNOWN,
    rethrow = false,
    silent = false,
    logLevel = 'error',
  } = options;

  // Normalize the error to an AppError
  const appError = error instanceof Error && 'category' in error
    ? error as AppError
    : createAppError(
        error instanceof Error ? error.message : String(error),
        {
          category,
          cause: error,
          context,
          isOperational: true,
        }
      );

  // Log the error (unless silent)
  if (!silent) {
    if (logLevel === 'error') {
      console.error(`[${appError.category}] ${appError.message}`, { 
        error: appError,
        context: appError.context
      });
    } else if (logLevel === 'warn') {
      console.warn(`[${appError.category}] ${appError.message}`, {
        error: appError,
        context: appError.context
      });
    } else if (logLevel === 'info') {
      console.info(`[${appError.category}] ${appError.message}`, {
        error: appError,
        context: appError.context
      });
    } else {
      console.debug(`[${appError.category}] ${appError.message}`, {
        error: appError,
        context: appError.context
      });
    }
  }

  // Report error to monitoring service in production
  if (env.isProduction && appError.severity !== ErrorSeverity.INFO) {
    errorReporter.reportError(appError, {
      additionalInfo: appError.context
    }, appError.severity);
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
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    context?: Record<string, any>;
    category?: ErrorCategory;
    rethrow?: boolean;
    silent?: boolean;
    onError?: (error: AppError) => void;
  } = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, {
        context: { 
          ...options.context,
          functionName: fn.name,
          arguments: args.map(arg => 
            typeof arg === 'object' ? '[Object]' : String(arg)
          ).join(', ')
        },
        category: options.category,
        rethrow: false,
        silent: options.silent
      });

      // Call optional error handler
      if (options.onError) {
        options.onError(appError);
      }

      // Rethrow if requested
      if (options.rethrow) {
        throw appError;
      }

      throw appError;
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
    context?: Record<string, any>;
    category?: ErrorCategory;
    retryableErrors?: (string | RegExp)[];
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 500,
    backoffFactor = 2,
    context = {},
    category = ErrorCategory.UNKNOWN,
    retryableErrors = [],
    onRetry
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));
      lastError = appError;
      
      const isRetryable = attempt <= maxRetries && (
        retryableErrors.length === 0 ||
        retryableErrors.some(pattern => {
          if (typeof pattern === 'string') {
            return appError.message.includes(pattern);
          }
          return pattern.test(appError.message);
        })
      );

      if (!isRetryable) {
        break;
      }
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(appError, attempt);
      }
      
      // Log retry attempt
      console.warn(`[Retry ${attempt}/${maxRetries}] Operation failed, retrying in ${delayMs}ms...`, {
        error: appError.message,
        attempt,
        maxRetries
      });
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(backoffFactor, attempt - 1)));
    }
  }
  
  // If we've exhausted retries, handle the last error
  handleError(lastError!, {
    context: {
      ...context,
      retriesAttempted: maxRetries
    },
    category,
    rethrow: true
  });
  
  // This code is unreachable due to the rethrow above, but TypeScript needs it
  throw lastError;
}

export default {
  createAppError,
  handleError,
  withErrorHandling,
  tryWithRetry,
  ErrorCategory,
  ErrorSeverity
};