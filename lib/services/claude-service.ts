/**
 * Claude Service
 * 
 * Secure, server-side-only service for interacting with Claude AI models.
 * Handles authentication, error management, and provides specialized methods
 * for different use cases like SVG generation and analysis.
 */

import { anthropic, AnthropicOptions } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { env } from '../utils/env';
import { logClaudeError, analyzeClaudeError, ClaudeErrorType } from '../utils/claude-error-handler';
import { ClaudeModel } from '../types-agents';
import "server-only";

// Interface for Claude request options
interface ClaudeRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: ClaudeModel;
  fallbackModels?: ClaudeModel[];
  stopSequences?: string[];
}

// Interface for Claude response structure
interface ClaudeResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  processingTime: number;
}

/**
 * Service class for handling Claude API interactions.
 * This is designed to be server-side only to protect API keys.
 */
class ClaudeService {
  private isInitialized: boolean = false;
  
  /**
   * Configure Anthropic client options with proper security and error handling
   */
  private getAnthropicConfig(model: string): AnthropicOptions {
    return {
      apiKey: env.ANTHROPIC_API_KEY, // Type-safe access to validated env variable
      retrySettings: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
      timeoutMs: 60000,
      logWarnings: true
    };
  }

  constructor() {
    try {
      // Validate that we have the API key
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('Missing ANTHROPIC_API_KEY environment variable');
      }
      
      // Print diagnostics information in development
      if (env.NODE_ENV === 'development') {
        console.log('Claude service initializing with:', {
          // Only show first few characters of the API key for debugging
          apiKey: env.ANTHROPIC_API_KEY ? `${env.ANTHROPIC_API_KEY.substring(0, 5)}...` : undefined,
          environment: env.NODE_ENV
        });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Claude service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Generate a response from Claude
   * 
   * @param prompt The user prompt to send to Claude
   * @param options Configuration options for the request
   * @returns Formatted Claude response
   */
  async generateResponse(
    prompt: string, 
    options: ClaudeRequestOptions = {}
  ): Promise<ClaudeResponse> {
    // Check if service is properly initialized
    if (!this.isInitialized) {
      throw new Error('Claude service is not properly initialized. Check your API key.');
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

  /**
   * Specialized method for generating SVG logos
   * 
   * @param prompt User prompt describing the logo to generate
   * @param systemPrompt System prompt with SVG generation instructions
   * @param options Additional configuration options
   * @returns Claude response with SVG content
   */
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

  /**
   * Specialized method for quick analysis tasks
   * 
   * @param prompt User prompt describing the analysis task
   * @param systemPrompt System prompt with analysis instructions
   * @param options Additional configuration options
   * @returns Claude response with analysis content
   */
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