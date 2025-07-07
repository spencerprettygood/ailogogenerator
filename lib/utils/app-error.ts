/**
 * @file app-error.ts
 * @description Custom error class with proper JSON serialization
 */

import { nanoid } from 'nanoid';
import { ApplicationError } from '../types';
import { ErrorCategory } from './error-handler';

/**
 * AppError is a custom error class that implements the ApplicationError interface
 * and properly serializes to JSON when stringified, solving the [object Object] issue
 */
export class AppError extends Error implements ApplicationError {
  errorId: string;
  category: string;
  code: string;
  context?: Record<string, any>;
  timestamp: string;
  isOperational: boolean;
  isRetryable: boolean;
  requestId?: string;

  constructor({
    message,
    category = ErrorCategory.UNKNOWN,
    code = 'unexpected_error',
    context = {},
    isOperational = true,
    isRetryable = false,
    requestId,
  }: {
    message: string;
    category?: string;
    code?: string;
    context?: Record<string, any>;
    isOperational?: boolean;
    isRetryable?: boolean;
    requestId?: string;
  }) {
    super(message);

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    this.name = this.constructor.name;
    this.errorId = nanoid(6);
    this.category = category;
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    this.isRetryable = isRetryable;
    this.requestId = requestId;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Custom toJSON method to properly serialize the error
   * This solves the [object Object] issue when errors are stringified
   */
  toJSON() {
    return {
      errorId: this.errorId,
      message: this.message,
      category: this.category,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      isRetryable: this.isRetryable,
      requestId: this.requestId,
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined,
    };
  }

  /**
   * Custom toString method for better logging
   */
  toString() {
    return `[${this.code}] ${this.message} (${this.errorId})`;
  }
}

/**
 * Create a new AppError instance
 */
export function createAppError(params: {
  message: string;
  category?: string;
  code?: string;
  context?: Record<string, any>;
  isOperational?: boolean;
  isRetryable?: boolean;
  requestId?: string;
}): AppError {
  return new AppError(params);
}
