import { anthropic, AnthropicOptions } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { env, validateEnv, config } from '../utils/env';
import { logClaudeError, analyzeClaudeError, ClaudeErrorType } from '../utils/claude-error-handler';

// Validate environment variables on import (server-side only)
if (!config.isClient && !validateEnv()) {
  console.error('Error: Required environment variables are missing. Check your .env.local file.');
  if (typeof window === 'undefined') { // Only exit in Node.js environment
    process.exit(1);
  }
}

import { ClaudeModel } from '../types-agents';

interface ClaudeRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: ClaudeModel;
  fallbackModels?: ClaudeModel[];
  stopSequences?: string[];
}

interface ClaudeResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  processingTime: number;
}

class ClaudeService {
  private isInitialized: boolean = false;
  
  // Configure Anthropic client options
  private getAnthropicConfig(model: string): AnthropicOptions {
    return {
      apiKey: env.ANTHROPIC_API_KEY || '',
      // Add these parameters to handle retries and timeouts
      retrySettings: {
        maxRetries: 3,         // Number of retries for failed requests
        initialDelayMs: 1000,  // Start with 1 second delay
        maxDelayMs: 10000,    // Maximum 10 second delay between retries
      },
      timeoutMs: 60000,       // 60-second timeout for requests
      logWarnings: true       // Log warnings to console
    };
  }

  constructor() {
    // Only initialize on server-side to confirm environment variables are available
    if (!config.isClient) {
      try {
        // Validate that we have the API key
        if (!env.ANTHROPIC_API_KEY) {
          throw new Error('Missing ANTHROPIC_API_KEY environment variable');
        }
        
        // Print diagnostics information in development
        if (config.isDevelopment) {
          console.log('Claude service initializing in server mode with:', {
            apiKey: env.ANTHROPIC_API_KEY ? `${env.ANTHROPIC_API_KEY.substring(0, 10)}...` : undefined,
            environment: env.NODE_ENV,
            appUrl: env.NEXT_PUBLIC_APP_URL
          });
        }
        
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize Claude service:', error);
        this.isInitialized = false;
      }
    } else {
      // Client-side initialization (will rely on API routes)
      console.log('Claude service initialized in client mode - API calls will use server endpoints');
      this.isInitialized = true;
    }
  }

  async generateResponse(
    prompt: string, 
    options: ClaudeRequestOptions = {}
  ): Promise<ClaudeResponse> {
    // Check if service is properly initialized
    if (!this.isInitialized) {
      throw new Error('Claude service is not properly initialized. Check your API key.');
    }
    
    // Client-side handling
    if (config.isClient) {
      return this.generateResponseViaAPI(prompt, options);
    }
    
    const startTime = Date.now();
    
    const {
      systemPrompt = "You are a helpful AI assistant.",
      temperature = 0.7,
      maxTokens = 1024,
      model = 'claude-3-5-sonnet-20240620',
      stopSequences = [],
    } = options;
    
    try {
      // Sanitize and validate input
      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Invalid prompt: Must provide a non-empty string');
      }
      
      // Create messages array in the format expected by Anthropic model
      const messages: { role: 'user'; content: string }[] = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Add more detailed logging before API call
      console.log('Calling Claude API with:', {
        model,
        system_length: systemPrompt.length,
        input_length: prompt.length,
        temperature,
        max_tokens: maxTokens
      });

      // Implement a fallback mechanism to handle model compatibility issues
      let attemptedModel = model;
      let result;
      // Create a list of models to try, starting with the specified model and then the fallbacks
      const fallbackModels = options.fallbackModels || ['claude-3-sonnet-20240229'];
      const modelsToTry = [attemptedModel, ...fallbackModels];
      
      // Keep track of errors for better reporting
      const errors: Record<string, unknown> = {};
      
      // Try each model in sequence until one succeeds
      for (let i = 0; i < modelsToTry.length; i++) {
        attemptedModel = modelsToTry[i];
        try {
          console.log(`Attempting to use model: ${attemptedModel}`);
          
          result = await generateText({
            model: anthropic(attemptedModel, this.getAnthropicConfig(attemptedModel)),
            messages: messages,
            system: systemPrompt,
            maxOutputTokens: maxTokens,
            temperature: temperature,
            stopSequences: stopSequences,
          });
          
          // If successful, break out of the loop
          console.log(`Successfully used model: ${attemptedModel}`);
          break;
        } catch (modelError) {
          // Store the error for this model
          errors[attemptedModel] = modelError;
          
          // Log the error
          console.warn(`Failed with model ${attemptedModel}`, modelError);
          
          // If this is the last model to try, rethrow the error
          if (i === modelsToTry.length - 1) {
            console.error('All models failed:', errors);
            throw new Error(`All Claude models failed. Last error: ${modelError instanceof Error ? modelError.message : String(modelError)}`);
          }
          
          // Otherwise, continue to the next model
          console.log(`Trying next fallback model: ${i < modelsToTry.length - 1 ? modelsToTry[i + 1] : 'none available'}`);
        }
      }
      
      // Create a simplified response format that matches our existing interface
      return {
        content: result.text,
        tokensUsed: {
          // AI SDK v5 doesn't provide token usage details directly
          // These are placeholder values
          input: 0,
          output: 0,
          total: 0,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      // Use our specialized error handler for better diagnostics
      const errorInfo = analyzeClaudeError(error);
      
      // Enhanced error logging with structured information
      logClaudeError(error, {
        timestamp: new Date().toISOString(),
        model: model,
        prompt_length: prompt.length,
        error_type: errorInfo.type
      });
      
      // For model errors, we'll have already tried a fallback in the try/catch above
      // For other errors, we need to provide better error information
      let errorMessage = `Failed to generate response from Claude: ${errorInfo.message}`;
      
      if (errorInfo.type === ClaudeErrorType.AUTHENTICATION) {
        errorMessage = 'API key error: Check your ANTHROPIC_API_KEY environment variable';
      } else if (errorInfo.type === ClaudeErrorType.MODEL_NOT_FOUND) {
        errorMessage = `Model error: The requested model "${model}" is not available or doesn't exist`;
      }
      
      throw new Error(errorMessage);
    }
  }
  
  // Method to handle client-side API calls via server endpoints
  private async generateResponseViaAPI(
    prompt: string,
    options: ClaudeRequestOptions
  ): Promise<ClaudeResponse> {
    const startTime = Date.now();
    
    try {
      // Make a request to the server-side API endpoint
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          options,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error (${response.status}): ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Return formatted response
      return {
        content: data.content || '',
        tokensUsed: data.tokensUsed || { input: 0, output: 0, total: 0 },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('API Request Error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Specialized method for generating SVG logos
  async generateSVG(
    prompt: string,
    systemPrompt: string,
    options: Partial<ClaudeRequestOptions> = {}
  ): Promise<ClaudeResponse> {
    return this.generateResponse(prompt, {
      systemPrompt,
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.5,
      maxTokens: 4000,
      ...options
    });
  }

  // Specialized method for quick analysis tasks
  async analyze(
    prompt: string,
    systemPrompt: string,
    options: Partial<ClaudeRequestOptions> = {}
  ): Promise<ClaudeResponse> {
    return this.generateResponse(prompt, {
      systemPrompt,
      // Use a more stable model as the default model was failing
      model: 'claude-3-sonnet-20240229',
      temperature: 0.3,
      maxTokens: 1000,
      ...options
    });
  }
}

// Export singleton instance
export const claudeService = new ClaudeService();