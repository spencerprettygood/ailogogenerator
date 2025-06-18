import Anthropic from '@anthropic-ai/sdk';
import { env, validateEnv, config } from '../utils/env';

// Validate environment variables on import (server-side only)
if (!config.isClient && !validateEnv()) {
  console.error('Error: Required environment variables are missing. Check your .env.local file.');
  if (typeof window === 'undefined') { // Only exit in Node.js environment
    process.exit(1);
  }
}

interface ClaudeRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: 'claude-3-5-sonnet-20240620' | 'claude-3-5-haiku-20240307';
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
  private anthropic: Anthropic | null = null;
  private isInitialized: boolean = false;
  
  constructor() {
    // Only initialize on server-side
    if (!config.isClient) {
      try {
        this.anthropic = new Anthropic({
          apiKey: env.ANTHROPIC_API_KEY || '',
          dangerouslyAllowBrowser: false, // Safer default - handle browser usage explicitly
        });
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
      
      // Create messages array in the format expected by Anthropic's API
      const apiMessages = [
        {
          role: 'user' as const, // Explicitly type as 'user' literal type
          content: prompt
        }
      ];

      // Add request ID for better tracking
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      if (!this.anthropic) {
        throw new Error('Anthropic client not initialized');
      }
      
      const response = await this.anthropic.messages.create({
        model: model,
        messages: apiMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        stop_sequences: stopSequences,
        system: systemPrompt, // Use the system parameter directly
        metadata: {
          // Store tracking information in allowed metadata format
          request_id: requestId,
          env: env.NODE_ENV || 'development'
        }
      });

      // Safely extract content, checking its structure first
      const content = response.content && 
                     response.content.length > 0 && 
                     response.content[0].type === 'text' 
                       ? response.content[0].text 
                       : '';
      
      return {
        content,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      // Enhanced error logging with structured information
      console.error('Claude API Error:', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        model: model,
        prompt_length: prompt.length,
      });
      
      // Check for specific error types
      if (error instanceof Error && 'status' in error) {
        const apiError = error as Anthropic.APIError;
        
        // Handle rate limiting
        if (apiError.status === 429) {
          throw new Error(`Rate limit exceeded. Please try again later. (${apiError.message})`);
        }
        
        // Handle authentication errors
        if (apiError.status === 401) {
          throw new Error(`Authentication error: Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.`);
        }
        
        // Handle other API errors
        throw new Error(`Claude API error (${apiError.status}): ${apiError.message}`);
      }
      
      // Handle other errors
      throw new Error(`Failed to generate response from Claude: ${error instanceof Error ? error.message : String(error)}`);
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
    systemPrompt: string
  ): Promise<ClaudeResponse> {
    return this.generateResponse(prompt, {
      systemPrompt,
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.5,
      maxTokens: 4000,
    });
  }

  // Specialized method for quick analysis tasks
  async analyze(
    prompt: string,
    systemPrompt: string
  ): Promise<ClaudeResponse> {
    return this.generateResponse(prompt, {
      systemPrompt,
      model: 'claude-3-5-haiku-20240307',
      temperature: 0.3,
      maxTokens: 1000,
    });
  }
}

// Export singleton instance
export const claudeService = new ClaudeService();