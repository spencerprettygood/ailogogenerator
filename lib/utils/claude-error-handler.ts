/**
 * @file claude-error-handler.ts
 * @description Specialized error handling for Claude API errors
 * 
 * This module provides utilities for handling and diagnosing Claude API errors,
 * with specific handling for common error scenarios.
 */

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
}

/**
 * Analyzes an error from the Claude API and categorizes it
 * 
 * @param error - The error thrown by the Claude API
 * @returns Categorized error information with handling suggestions
 */
export function analyzeClaudeError(error: unknown): ClaudeErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Default error info
  const defaultErrorInfo: ClaudeErrorInfo = {
    type: ClaudeErrorType.UNKNOWN,
    message: errorMessage,
    originalError: error,
    isRetryable: false
  };
  
  // Authentication errors
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('token')
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.AUTHENTICATION,
      message: 'Authentication failed. Check your API key and permissions.',
      isRetryable: false,
      suggestedAction: 'Verify your ANTHROPIC_API_KEY environment variable is correct and valid.'
    };
  }
  
  // Rate limit errors
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429')
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.RATE_LIMIT,
      message: 'Rate limit exceeded. Too many requests in a short time period.',
      isRetryable: true,
      suggestedAction: 'Wait before retrying and consider implementing exponential backoff.'
    };
  }
  
  // Model not found errors
  if (
    errorMessage.includes('model') && 
    (errorMessage.includes('not found') || 
     errorMessage.includes('does not exist') ||
     errorMessage.includes('unavailable'))
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.MODEL_NOT_FOUND,
      message: 'The specified model was not found or is unavailable.',
      isRetryable: false,
      suggestedAction: 'Try using a different model version that is currently available.'
    };
  }
  
  // Context window errors
  if (
    errorMessage.includes('context') && 
    (errorMessage.includes('length') || 
     errorMessage.includes('window') ||
     errorMessage.includes('too long'))
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.CONTEXT_WINDOW,
      message: 'Input exceeds the model\'s context window.',
      isRetryable: false,
      suggestedAction: 'Reduce the size of your input or use a model with a larger context window.'
    };
  }
  
  // Content policy violations
  if (
    errorMessage.includes('content') && 
    (errorMessage.includes('policy') || 
     errorMessage.includes('violation') ||
     errorMessage.includes('prohibited'))
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.CONTENT_POLICY,
      message: 'Content policy violation detected.',
      isRetryable: false,
      suggestedAction: 'Review your content to ensure it complies with Anthropic\'s content policies.'
    };
  }
  
  // Server errors (usually temporary)
  if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('503') ||
    errorMessage.includes('service unavailable')
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.SERVER_ERROR,
      message: 'Server error or service temporarily unavailable.',
      isRetryable: true,
      suggestedAction: 'Retry after a short delay. If the problem persists, check Anthropic status page.'
    };
  }
  
  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('deadline exceeded')
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.TIMEOUT,
      message: 'Request timed out.',
      isRetryable: true,
      suggestedAction: 'Retry with a simpler prompt or increase the timeout setting.'
    };
  }
  
  // Invalid request format
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('format') ||
    errorMessage.includes('parameter') ||
    errorMessage.includes('bad request')
  ) {
    return {
      ...defaultErrorInfo,
      type: ClaudeErrorType.INVALID_REQUEST,
      message: 'Invalid request format or parameters.',
      isRetryable: false,
      suggestedAction: 'Check your request format and parameters for errors.'
    };
  }
  
  // Return default unknown error if no specific case matches
  return {
    ...defaultErrorInfo,
    suggestedAction: 'Check logs for more details or contact Anthropic support if the issue persists.'
  };
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
  logClaudeError,
  isRetryableClaudeError,
  ClaudeErrorType
};