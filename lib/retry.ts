import { APIError } from './api'; // Import APIError

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface AIResponse {
  content: { text: string }[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// AI-specific retry wrapper for backward compatibility
export async function callAIWithRetry(
  aiRequestConfig: any,
  retryConfig: Partial<RetryConfig> = {}
): Promise<AIResponse> {
  // For now, this is just a wrapper around withRetry that handles AI-specific requests
  return withRetry<AIResponse>(async () => {
    // Implementation would call AI service with aiRequestConfig
    // For now, this is a placeholder to fix type errors
    return {
      content: [{ text: '{}' }],
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    };
  }, retryConfig);
}
