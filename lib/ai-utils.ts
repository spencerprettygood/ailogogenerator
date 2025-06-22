/**
 * AI utilities that wrap the AI SDK v5 Alpha functions
 * Provides compatibility with our existing codebase
 */

import { telemetry } from './telemetry';
import {
  streamText as aiStreamText,
  generateText as aiGenerateText,
  convertToModelMessages,
  type ModelMessage
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

/**
 * Generate a unique ID for messages and other objects
 * @returns A unique string ID
 */
export function generateId(): string {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Type definitions for our message formats
 */
export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | ContentPart[];
}

type ContentPart = {
  type: 'text' | 'image' | 'file' | 'tool-call' | 'tool-result';
  text?: string;
  image?: string | Uint8Array | ArrayBuffer;
  data?: any;
  mediaType?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  result?: any;
};

interface StreamOptions {
  model: string;
  provider: 'openai' | 'anthropic';
  messages: Message[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: Record<string, any>;
}

/**
 * Get the appropriate model provider based on the provider name
 */
function getModelProvider(provider: string, modelName: string) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return openai(modelName);
    case 'anthropic':
      return anthropic(modelName);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Convert our Message format to AI SDK's ModelMessage format
 */
function convertMessages(messages: Message[]): ModelMessage[] {
  return messages.map(msg => {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: msg.content
      };
    } else {
      return {
        role: msg.role,
        content: msg.content.map(part => {
          if (part.type === 'text') {
            return {
              type: 'text',
              text: part.text || ''
            };
          } else if (part.type === 'image') {
            return {
              type: 'image',
              image: part.image || ''
            };
          } else if (part.type === 'file') {
            return {
              type: 'file',
              mediaType: part.mediaType || 'application/octet-stream',
              data: part.data
            };
          } else if (part.type === 'tool-call') {
            return {
              type: 'tool-call',
              toolCallId: part.toolCallId || '',
              toolName: part.toolName || '',
              args: part.args || {}
            };
          } else if (part.type === 'tool-result') {
            return {
              type: 'tool-result',
              toolCallId: part.toolCallId || '',
              toolName: part.toolName || '',
              result: part.result || {}
            };
          }
          return { type: 'text', text: '' };
        })
      };
    }
  });
}

/**
 * Stream text from an AI model using AI SDK v5
 * @param options The options for text streaming
 * @returns A response object with streaming capabilities
 */
export async function streamText(options: StreamOptions) {
  const { model, provider, messages, system, maxTokens, temperature, tools } = options;
  
  // Start telemetry timing
  const endTimer = telemetry.startTimer('ai_stream_text');
  
  try {
    // Get the appropriate model provider
    const modelProvider = getModelProvider(provider, model);
    
    // Convert messages to AI SDK format
    const convertedMessages = convertMessages(messages);
    
    // Use AI SDK's streamText function
    const result = await aiStreamText({
      model: modelProvider,
      messages: convertedMessages,
      system,
      maxOutputTokens: maxTokens,
      temperature,
      tools,
    });
    
    // End telemetry timing on success
    endTimer();
    
    return result;
  } catch (error) {
    // Record telemetry on error
    endTimer();
    telemetry.recordError(error as Error, 'streamText');
    throw error;
  }
}

/**
 * Generate text from an AI model using AI SDK v5
 * @param options The options for text generation
 * @returns The generated text
 */
export async function generateText(options: StreamOptions) {
  const { model, provider, messages, system, maxTokens, temperature, tools } = options;
  
  // Start telemetry timing
  const endTimer = telemetry.startTimer('ai_generate_text');
  
  try {
    // Get the appropriate model provider
    const modelProvider = getModelProvider(provider, model);
    
    // Convert messages to AI SDK format
    const convertedMessages = convertMessages(messages);
    
    // Use AI SDK's generateText function
    const { text } = await aiGenerateText({
      model: modelProvider,
      messages: convertedMessages,
      system,
      maxOutputTokens: maxTokens,
      temperature,
      tools,
    });
    
    // End telemetry timing on success
    endTimer();
    
    return text;
  } catch (error) {
    // Record telemetry on error
    endTimer();
    telemetry.recordError(error as Error, 'generateText');
    throw error;
  }
}