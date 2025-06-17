import Anthropic from '@anthropic-ai/sdk';

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
  private anthropic: Anthropic;
  
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async generateResponse(
    prompt: string, 
    options: ClaudeRequestOptions = {}
  ): Promise<ClaudeResponse> {
    const startTime = Date.now();
    
    const {
      systemPrompt = "You are a helpful AI assistant.",
      temperature = 0.7,
      maxTokens = 1024,
      model = 'claude-3-5-sonnet-20240620',
      stopSequences = [],
    } = options;
    
    try {
      // Create messages array in the format expected by Anthropic's API
      const apiMessages = [
        {
          role: 'user' as const, // Explicitly type as 'user' literal type
          content: prompt
        }
      ];

      const response = await this.anthropic.messages.create({
        model: model,
        messages: apiMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        stop_sequences: stopSequences,
        system: systemPrompt, // Use the system parameter directly
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
      console.error('Claude API Error:', error);
      throw new Error(`Failed to generate response from Claude: ${error instanceof Error ? error.message : String(error)}`);
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
