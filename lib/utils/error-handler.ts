/**
 * Simple error handler for personal use
 * Provides consistent error handling across the app
 */

import { logger } from './logger';
import type { ErrorInfo } from 'react';

export enum ErrorCategory {
  VALIDATION = 'validation',
  GENERATION = 'generation',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  CLAUDE_API = 'claude_api',
  TIMEOUT = 'timeout',
  UI = 'ui',
  SVG = 'svg',
  DOWNLOAD = 'download',
  STORAGE = 'storage',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CLAUDE_API_ERROR = 'CLAUDE_API_ERROR',
  TIMEOUT = 'TIMEOUT',
}

export type HttpStatusCode = number;

export interface AppErrorOptions {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  code?: string | ErrorCode;
  statusCode?: number;
  cause?: unknown;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public code?: string | ErrorCode;
  public statusCode?: number;
  public isOperational: boolean;
  public category?: ErrorCategory;
  public severity?: ErrorSeverity;
  public context?: Record<string, unknown>;
  public cause?: unknown;

  constructor(
    message: string,
    options?: AppErrorOptions | string | number
  ) {
    super(message);
    this.name = 'AppError';
    this.isOperational = true;

    if (typeof options === 'string') {
      // Legacy support: createAppError(message, code)
      this.code = options;
    } else if (typeof options === 'number') {
      // Legacy support: createAppError(message, statusCode)
      this.statusCode = options;
    } else if (options) {
      // New format: createAppError(message, options)
      this.code = options.code;
      this.statusCode = options.statusCode;
      this.category = options.category;
      this.severity = options.severity;
      this.context = options.context;
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(error: unknown, context?: string): string {
  let message = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    message = error.message;
    logger.error(`${context ? `[${context}] ` : ''}${error.message}`, error.stack);
  } else if (typeof error === 'string') {
    message = error;
    logger.error(`${context ? `[${context}] ` : ''}${error}`);
  } else {
    logger.error(`${context ? `[${context}] ` : ''}Unknown error:`, error);
  }
  
  return message;
}

export function wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new AppError(handleError(error, fn.name));
    }
  }) as T;
}

export function createAppError(message: string, options?: AppErrorOptions | string, statusCode?: number): AppError {
  if (typeof options === 'string' && statusCode !== undefined) {
    // Legacy support: createAppError(message, code, statusCode)
    return new AppError(message, { code: options, statusCode });
  }
  return new AppError(message, options);
}

// Export HttpStatusCode type for compatibility
export type { HttpStatusCode } from './http-status';

// ErrorFactory for backward compatibility
export const ErrorFactory = {
  createValidationError: (message: string, context?: Record<string, unknown>) => 
    createAppError(message, { category: ErrorCategory.VALIDATION, code: ErrorCode.VALIDATION_ERROR, context }),
  
  createNetworkError: (message: string, context?: Record<string, unknown>) => 
    createAppError(message, { category: ErrorCategory.NETWORK, code: ErrorCode.NETWORK_ERROR, context }),
  
  createGenerationError: (message: string, context?: Record<string, unknown>) => 
    createAppError(message, { category: ErrorCategory.GENERATION, code: ErrorCode.INTERNAL_ERROR, context }),
  
  createUnknownError: (message: string, context?: Record<string, unknown>) => 
    createAppError(message, { category: ErrorCategory.UNKNOWN, code: ErrorCode.UNKNOWN_ERROR, context }),
};

// Additional helper for error boundary
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: ErrorInfo) => {
    logger.error(`Error in ${componentName}:`, error, errorInfo);
    return createAppError(`Component error in ${componentName}: ${error.message}`, {
      category: ErrorCategory.UI,
      context: { componentName, errorInfo }
    });
  };
}