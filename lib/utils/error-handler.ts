/**
 * Simple error handler for personal use
 * Provides consistent error handling across the app
 */

import { logger } from './logger';

export enum ErrorCategory {
  VALIDATION = 'validation',
  GENERATION = 'generation',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
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
}

export type HttpStatusCode = number;

export class AppError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public statusCode?: number,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
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

export function createAppError(message: string, code?: string, statusCode?: number): AppError {
  return new AppError(message, code, statusCode);
}