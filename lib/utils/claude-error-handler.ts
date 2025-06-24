/**
 * @file claude-error-handler.ts
 * @description Specialized error handling for Claude API errors
 * 
 * This module provides utilities for handling and diagnosing Claude API errors,
 * with specific handling for common error scenarios, integrated with the
 * application's standardized error handling system.
 */

import { 
  createAppError, 
  ErrorCategory, 
  ErrorCode, 
  ErrorSeverity,
  HttpStatusCode
} from './error-handler';

/**
 * Common error types from the Claude API
 */
export enum ClaudeErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  INVALID_REQUEST = 'invalid_request',
  MODEL_NOT_FOUND = 'model_not_found',
  CONTEXT_WINDOW = 'context_window',
  CONTENT_POLICY = 'content_policy',
  SERVER_ERROR = 'server_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Interface for a categorized Claude error
 */
export interface ClaudeErrorInfo {
  type: ClaudeErrorType;
  message: string;
  originalError: unknown;
  isRetryable: boolean;
  suggestedAction?: string;
  errorCategory: ErrorCategory;
  errorCode: ErrorCode;
  statusCode: HttpStatusCode;
  severity: ErrorSeverity;
}

/**
 * Maps Claude error types to our application's error categories
 */
const claudeErrorTypeToCategory: Record<ClaudeErrorType, ErrorCategory> = {
  [ClaudeErrorType.AUTHENTICATION]: ErrorCategory.AUTHENTICATION,
  [ClaudeErrorType.RATE_LIMIT]: ErrorCategory.RATE_LIMIT,
  [ClaudeErrorType.INVALID_REQUEST]: ErrorCategory.VALIDATION,
  [ClaudeErrorType.MODEL_NOT_FOUND]: ErrorCategory.CLAUDE_API,
  [ClaudeErrorType.CONTEXT_WINDOW]: ErrorCategory.VALIDATION,
  [ClaudeErrorType.CONTENT_POLICY]: ErrorCategory.VALIDATION,
  [ClaudeErrorType.SERVER_ERROR]: ErrorCategory.CLAUDE_API,
  [ClaudeErrorType.TIMEOUT]: ErrorCategory.TIMEOUT,
  [ClaudeErrorType.UNKNOWN]: ErrorCategory.UNKNOWN
};

/**
 * Maps Claude error types to our application's error codes
 */
const claudeErrorTypeToCode: Record<ClaudeErrorType, ErrorCode> = {
  [ClaudeErrorType.AUTHENTICATION]: ErrorCode.UNAUTHORIZED,
  [ClaudeErrorType.RATE_LIMIT]: ErrorCode.RATE_LIMITED,
  [ClaudeErrorType.INVALID_REQUEST]: ErrorCode.VALIDATION_FAILED,
  [ClaudeErrorType.MODEL_NOT_FOUND]: ErrorCode.CLAUDE_API_ERROR,
  [ClaudeErrorType.CONTEXT_WINDOW]: ErrorCode.VALIDATION_FAILED,
  [ClaudeErrorType.CONTENT_POLICY]: ErrorCode.VALIDATION_FAILED,
  [ClaudeErrorType.SERVER_ERROR]: ErrorCode.CLAUDE_API_ERROR,
  [ClaudeErrorType.TIMEOUT]: ErrorCode.TIMEOUT,
  [ClaudeErrorType.UNKNOWN]: ErrorCode.CLAUDE_API_ERROR
};

/**
 * Maps Claude error types to HTTP status codes
 */
const claudeErrorTypeToStatusCode: Record<ClaudeErrorType, HttpStatusCode> = {
  [ClaudeErrorType.AUTHENTICATION]: HttpStatusCode.UNAUTHORIZED,
  [ClaudeErrorType.RATE_LIMIT]: HttpStatusCode.TOO_MANY_REQUESTS,
  [ClaudeErrorType.INVALID_REQUEST]: HttpStatusCode.BAD_REQUEST,
  [ClaudeErrorType.MODEL_NOT_FOUND]: HttpStatusCode.BAD_REQUEST,
  [ClaudeErrorType.CONTEXT_WINDOW]: HttpStatusCode.BAD_REQUEST,
  [ClaudeErrorType.CONTENT_POLICY]: HttpStatusCode.BAD_REQUEST,
  [ClaudeErrorType.SERVER_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ClaudeErrorType.TIMEOUT]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ClaudeErrorType.UNKNOWN]: HttpStatusCode.INTERNAL_SERVER_ERROR
};

/**
 * Maps Claude error types to severity levels
 */
const claudeErrorTypeToSeverity: Record<ClaudeErrorType, ErrorSeverity> = {
  [ClaudeErrorType.AUTHENTICATION]: ErrorSeverity.ERROR,
  [ClaudeErrorType.RATE_LIMIT]: ErrorSeverity.WARNING,
  [ClaudeErrorType.INVALID_REQUEST]: ErrorSeverity.WARNING,
  [ClaudeErrorType.MODEL_NOT_FOUND]: ErrorSeverity.ERROR,
  [ClaudeErrorType.CONTEXT_WINDOW]: ErrorSeverity.WARNING,
  [ClaudeErrorType.CONTENT_POLICY]: ErrorSeverity.WARNING,
  [ClaudeErrorType.SERVER_ERROR]: ErrorSeverity.ERROR,
  [ClaudeErrorType.TIMEOUT]: ErrorSeverity.WARNING,
  [ClaudeErrorType.UNKNOWN]: ErrorSeverity.ERROR
};

/**
 * Determines which Claude error types are retryable
 */
const retryableClaudeErrors = new Set([
  ClaudeErrorType.RATE_LIMIT,
  ClaudeErrorType.SERVER_ERROR,
  ClaudeErrorType.TIMEOUT
]);

/**
 * Analyzes an error from the Claude API and categorizes it
 * 
 * @param error - The error thrown by the Claude API
 * @returns Categorized error information with handling suggestions
 */
export function analyzeClaudeError(error: unknown): ClaudeErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Determine Claude error type based on message patterns
  let errorType = ClaudeErrorType.UNKNOWN;
  
  // Authentication errors
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('token')
  ) {
    errorType = ClaudeErrorType.AUTHENTICATION;
  }
  // Rate limit errors
  else if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429')
  ) {
    errorType = ClaudeErrorType.RATE_LIMIT;
  }
  // Model not found errors
  else if (
    errorMessage.includes('model') && 
    (errorMessage.includes('not found') || 
     errorMessage.includes('does not exist') ||
     errorMessage.includes('unavailable'))
  ) {
    errorType = ClaudeErrorType.MODEL_NOT_FOUND;
  }
  // Context window errors
  else if (
    errorMessage.includes('context') && 
    (errorMessage.includes('length') || 
     errorMessage.includes('window') ||
     errorMessage.includes('too long'))
  ) {
    errorType = ClaudeErrorType.CONTEXT_WINDOW;
  }
  // Content policy violations
  else if (
    errorMessage.includes('content') && 
    (errorMessage.includes('policy') || 
     errorMessage.includes('violation') ||
     errorMessage.includes('prohibited'))
  ) {
    errorType = ClaudeErrorType.CONTENT_POLICY;
  }
  // Server errors (usually temporary)
  else if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('503') ||
    errorMessage.includes('service unavailable')
  ) {
    errorType = ClaudeErrorType.SERVER_ERROR;
  }
  // Timeout errors
  else if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('deadline exceeded')
  ) {
    errorType = ClaudeErrorType.TIMEOUT;
  }
  // Invalid request format
  else if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('format') ||
    errorMessage.includes('parameter') ||
    errorMessage.includes('bad request')
  ) {
    errorType = ClaudeErrorType.INVALID_REQUEST;
  }
  
  // Determine if the error is retryable
  const isRetryable = retryableClaudeErrors.has(errorType);
  
  // Map to our application's error categories
  const errorCategory = claudeErrorTypeToCategory[errorType];
  const errorCode = claudeErrorTypeToCode[errorType];
  const statusCode = claudeErrorTypeToStatusCode[errorType];
  const severity = claudeErrorTypeToSeverity[errorType];
  
  // Create appropriate error message based on type
  let message: string;
  let suggestedAction: string | undefined;
  
  switch (errorType) {
    case ClaudeErrorType.AUTHENTICATION:
      message = 'Authentication failed. Check your API key and permissions.';
      suggestedAction = 'Verify your ANTHROPIC_API_KEY environment variable is correct and valid.';
      break;
    case ClaudeErrorType.RATE_LIMIT:
      message = 'Rate limit exceeded. Too many requests in a short time period.';
      suggestedAction = 'Wait before retrying and consider implementing exponential backoff.';
      break;
    case ClaudeErrorType.MODEL_NOT_FOUND:
      message = 'The specified Claude model was not found or is unavailable.';
      suggestedAction = 'Try using a different model version that is currently available.';
      break;
    case ClaudeErrorType.CONTEXT_WINDOW:
      message = 'Input exceeds the Claude model\'s context window.';
      suggestedAction = 'Reduce the size of your input or use a model with a larger context window.';
      break;
    case ClaudeErrorType.CONTENT_POLICY:
      message = 'Content policy violation detected in Claude request.';
      suggestedAction = 'Review your content to ensure it complies with Anthropic\'s content policies.';
      break;
    case ClaudeErrorType.SERVER_ERROR:
      message = 'Claude API server error or service temporarily unavailable.';
      suggestedAction = 'Retry after a short delay. If the problem persists, check Anthropic status page.';
      break;
    case ClaudeErrorType.TIMEOUT:
      message = 'Claude API request timed out.';
      suggestedAction = 'Retry with a simpler prompt or increase the timeout setting.';
      break;
    case ClaudeErrorType.INVALID_REQUEST:
      message = 'Invalid Claude API request format or parameters.';
      suggestedAction = 'Check your request format and parameters for errors.';
      break;
    default:
      message = `Claude API error: ${errorMessage}`;
      suggestedAction = 'Check logs for more details or contact Anthropic support if the issue persists.';
  }
  
  return {
    type: errorType,
    message,
    originalError: error,
    isRetryable,
    suggestedAction,
    errorCategory,
    errorCode,
    statusCode,
    severity
  };
}

/**
 * Creates a standardized AppError from a Claude API error
 * 
 * @param error - The error from the Claude API
 * @param context - Additional context about the request
 * @returns A standardized AppError for consistent handling
 */
export function createClaudeError(error: unknown, context: Record<string, unknown> = {}) {
  const errorInfo = analyzeClaudeError(error);
  
  return createAppError(errorInfo.message, {
    category: errorInfo.errorCategory,
    severity: errorInfo.severity,
    code: errorInfo.errorCode,
    statusCode: errorInfo.statusCode,
    cause: error,
    context: {
      ...context,
      claudeErrorType: errorInfo.type,
      suggestedAction: errorInfo.suggestedAction,
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    }
  });
}

/**
 * Logs detailed error information for Claude API errors
 * 
 * @param error - The error from the Claude API
 * @param context - Additional context about the request
 */
export function logClaudeError(error: unknown, context: Record<string, unknown> = {}): void {
  const errorInfo = analyzeClaudeError(error);
  
  console.error(`Claude API Error [${errorInfo.type}]:`, {
    message: errorInfo.message,
    suggestedAction: errorInfo.suggestedAction,
    isRetryable: errorInfo.isRetryable,
    category: errorInfo.errorCategory,
    code: errorInfo.errorCode,
    statusCode: errorInfo.statusCode,
    severity: errorInfo.severity,
    context,
    originalError: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error)
  });
}

/**
 * Determines if an error from Claude API is retryable
 * 
 * @param error - The error from the Claude API
 * @returns Whether the error is retryable
 */
export function isRetryableClaudeError(error: unknown): boolean {
  return analyzeClaudeError(error).isRetryable;
}

export default {
  analyzeClaudeError,
  createClaudeError,
  logClaudeError,
  isRetryableClaudeError,
  ClaudeErrorType
};