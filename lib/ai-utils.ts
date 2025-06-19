/**
 * Simple utility functions to replace the 'ai' package
 * This eliminates the OpenTelemetry dependency
 */

import { telemetry } from './telemetry';

/**
 * Generate a unique ID (replacement for generateId from 'ai')
 * @returns A unique string ID
 */
export function generateId(): string {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Type definitions for streamText function
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamTextOptions {
  model: any; // The AI model to use
  messages: Message[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Stream text from an AI model (replacement for streamText from 'ai')
 * @param options The options for text streaming
 * @returns A response object with streaming capabilities
 */
export async function streamText(options: StreamTextOptions) {
  const { model, messages, system, maxTokens, temperature } = options;
  
  // Add the system message if provided
  const fullMessages = system 
    ? [{ role: 'system', content: system }, ...messages] 
    : messages;
  
  // Start telemetry timing
  const endTimer = telemetry.startTimer('ai_stream_text');
  
  try {
    // Use the model's streaming capability directly
    const stream = await model.messages.stream({
      messages: fullMessages,
      max_tokens: maxTokens,
      temperature: temperature || 0.7,
    });
    
    // End telemetry timing on success
    endTimer();
    
    // Return a response object that mimics the 'ai' package interface
    return {
      toDataStreamResponse: () => {
        // Create a TransformStream to properly format the response
        const encoder = new TextEncoder();
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        
        // Process the stream and write to the TransformStream
        (async () => {
          try {
            for await (const chunk of stream) {
              const text = chunk.delta?.text || '';
              const data = { text };
              
              // Format as a Server-Sent Event
              const sseFormattedData = `data: ${JSON.stringify(data)}\n\n`;
              await writer.write(encoder.encode(sseFormattedData));
            }
            
            // End the stream
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            await writer.close();
          } catch (error) {
            telemetry.recordError(error as Error, 'streamText');
            await writer.abort(error);
          }
        })();
        
        // Return a Response object with the readable stream
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    };
  } catch (error) {
    // Record telemetry on error
    endTimer();
    telemetry.recordError(error as Error, 'streamText');
    throw error;
  }
}