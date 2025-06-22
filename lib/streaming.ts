import { GenerationProgress, GeneratedAssets } from './types';

export interface StreamingCallbacks {
  onProgress: (progress: GenerationProgress) => void;
  onPreview: (svgContent: string) => void;
  onComplete: (assets: GeneratedAssets, sessionId: string) => void;
  onError: (error: Error) => void;
  onCache?: (isCached: boolean) => void;
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
        callbacks.onError(new Error(data.error.message || data.error));
        return;
      }
      
      // Handle cache status
      if (data.type === 'cache' && callbacks.onCache) {
        callbacks.onCache(data.cached === true);
        
        // If we're retrieving from cache, also update the preview
        if (data.cached === true && data.result?.logoSvg) {
          callbacks.onPreview(data.result.logoSvg);
        }
      }
      
      // Handle progress updates
      if (data.type === 'progress' && data.progress) {
        callbacks.onProgress({
          currentStage: data.progress.currentStage,
          stageProgress: data.progress.stageProgress,
          overallProgress: data.progress.overallProgress,
          statusMessage: data.progress.statusMessage,
          // Backward compatibility
          stage: data.progress.currentStage,
          progress: data.progress.stageProgress,
          message: data.progress.statusMessage
        });
      }
      
      // Handle SVG preview
      if (data.type === 'svg_preview' && data.previewSvg) {
        callbacks.onPreview(data.previewSvg);
      } else if (data.preview) {
        // Backward compatibility
        callbacks.onPreview(data.preview);
      }
      
      // Handle result
      if (data.type === 'result' && data.result) {
        callbacks.onComplete(data.result, data.result.sessionId);
      } else if (data.complete && data.assets) {
        // Backward compatibility
        callbacks.onComplete(data.assets, data.sessionId);
      }
      
    } catch (parseError) {
      console.warn('Failed to parse streaming data:', line, parseError);
      // Don't call onError for parse failures, just log them
    }
  }
}

export const streamProcessor = new StreamProcessor();
