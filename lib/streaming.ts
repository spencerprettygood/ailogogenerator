import { GenerationProgress, GeneratedAssets } from './types';

export interface StreamingCallbacks {
  onProgress: (progress: GenerationProgress) => void;
  onPreview: (svgContent: string) => void;
  onComplete: (assets: GeneratedAssets, sessionId: string) => void;
  onError: (error: Error) => void;
}

export class StreamProcessor {
  private decoder = new TextDecoder();
  private buffer = '';

  async processStream(
    stream: ReadableStream<Uint8Array>,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const reader = stream.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining data in buffer
          if (this.buffer.trim()) {
            this.processLine(this.buffer.trim(), callbacks);
          }
          break;
        }
        
        // Decode chunk and add to buffer
        const chunk = this.decoder.decode(value, { stream: true });
        this.buffer += chunk;
        
        // Process complete lines
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            this.processLine(line.trim(), callbacks);
          }
        }
      }
    } catch (error) {
      callbacks.onError(error as Error);
    } finally {
      reader.releaseLock();
    }
  }

  private processLine(line: string, callbacks: StreamingCallbacks): void {
    try {
      const data = JSON.parse(line);
      
      if (data.error) {
        callbacks.onError(new Error(data.error));
        return;
      }
      
      if (data.stage && data.progress !== undefined) {
        callbacks.onProgress({
          stage: data.stage,
          progress: data.progress,
          message: data.message || `Processing stage ${data.stage}...`
        });
      }
      
      if (data.preview) {
        callbacks.onPreview(data.preview);
      }
      
      if (data.complete && data.assets) {
        callbacks.onComplete(data.assets, data.sessionId);
      }
      
    } catch (parseError) {
      console.warn('Failed to parse streaming data:', line, parseError);
      // Don't call onError for parse failures, just log them
    }
  }
}

export const streamProcessor = new StreamProcessor();
