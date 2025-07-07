/**
 * @file error-reporter.ts
 * @description Error reporting service for production
 *
 * This service handles structured error reporting to help diagnose
 * issues in production without exposing sensitive information.
 */

import { env } from './env';

// Define error metadata interface
interface ErrorMetadata {
  url?: string;
  component?: string;
  userId?: string;
  requestId?: string;
  additionalInfo?: Record<string, unknown>;
}

// Define error severity levels
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * ErrorReporter service for handling application errors
 */
export class ErrorReporter {
  private static instance: ErrorReporter;
  private isInitialized = false;

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Initialize error reporting service
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }

    if (env.isProduction) {
      // In a real implementation, this would initialize an error
      // reporting service like Sentry, LogRocket, etc.
      this.setupErrorHandlers();
      console.log('Error reporting service initialized in production mode');
    } else {
      console.log('Error reporting service initialized in development mode (local only)');
    }

    this.isInitialized = true;
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Browser-only error handlers
      window.addEventListener('error', event => {
        this.reportError(event.error || new Error(event.message), {
          url: window.location.href,
        });

        // Don't prevent default to allow browser's default error handling
        return false;
      });

      window.addEventListener('unhandledrejection', event => {
        this.reportError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          { url: window.location.href }
        );

        // Don't prevent default
        return false;
      });
    }
  }

  /**
   * Report an error to the error service
   * @param error The error object
   * @param metadata Additional context about the error
   * @param severity The error severity level
   */
  public reportError(
    error: Error,
    metadata: ErrorMetadata = {},
    severity: ErrorSeverity = 'error'
  ): void {
    if (!this.isInitialized) {
      this.init();
    }

    // Sanitize error data to avoid sensitive information
    const sanitizedError = {
      name: error.name,
      message: error.message,
      stack: this.sanitizeStack(error.stack || ''),
      timestamp: new Date().toISOString(),
      severity,
      ...metadata,
    };

    if (env.isProduction) {
      // In production, would send to error reporting service
      // Example: sendToErrorService(sanitizedError);

      // For now, just log to console in production
      console.error('[ErrorReporter]', sanitizedError);

      // In a real implementation, this would be:
      // Sentry.captureException(error, {
      //   extra: metadata,
      //   level: severity
      // });
    } else {
      // In development, just log to console with more details
      console.group('[ErrorReporter] Error details:');
      console.error('Error:', error);
      console.info('Metadata:', metadata);
      console.info('Severity:', severity);
      console.groupEnd();
    }
  }

  /**
   * Submit user feedback along with the last error
   * @param feedback User feedback text
   * @param metadata Additional context
   */
  public submitFeedback(feedback: string, metadata: ErrorMetadata = {}): void {
    if (!this.isInitialized) {
      this.init();
    }

    const feedbackData = {
      feedback,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    if (env.isProduction) {
      // In production, would send to feedback service
      // Example: sendToFeedbackService(feedbackData);

      console.log('[ErrorReporter] User feedback:', feedbackData);

      // In a real implementation, this would be:
      // Sentry.captureMessage(`User Feedback: ${feedback}`, {
      //   extra: metadata,
      //   level: 'info'
      // });
    } else {
      console.log('[ErrorReporter] User feedback:', feedbackData);
    }
  }

  /**
   * Remove sensitive information from stack traces
   * @param stack The error stack trace
   * @returns Sanitized stack trace
   */
  private sanitizeStack(stack: string): string {
    // Remove file paths that might contain sensitive information
    return stack
      .split('\n')
      .map(line => {
        // Keep the function names but remove full paths
        // Replace with just filename instead of full path
        return line.replace(/at\s+(.+)\s+\((.+)\/([^/]+)\)/, 'at $1 (…/$3)');
      })
      .join('\n');
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

export default errorReporter;
