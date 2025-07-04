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
      let streamEnded = false;
      let lastProgressUpdate = Date.now();
      
      while (!streamEnded) {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            streamEnded = true;
            // Process any remaining data in buffer
            if (this.buffer.trim()) {
              this.processLine(this.buffer.trim(), callbacks);
            }
            break;
          }
          
          // Check for timeout between chunks
          const now = Date.now();
          if (now - lastProgressUpdate > 60000) { // 60-second timeout
            console.warn('Stream timeout detected - no data received for 60 seconds');
            callbacks.onError(new Error('Stream timeout - no data received for 60 seconds'));
            break;
          }
          lastProgressUpdate = now;
          
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
        } catch (readError) {
          console.error('Error reading from stream:', readError);
          callbacks.onError(new Error(`Stream read error: ${readError instanceof Error ? readError.message : String(readError)}`));
          break;
        }
      }
    } catch (error) {
      console.error('Fatal error in stream processing:', error);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      try {
        reader.releaseLock();
      } catch (releaseLockError) {
        console.warn('Error releasing reader lock:', releaseLockError);
      }
    }
  }

  private processLine(line: string, callbacks: StreamingCallbacks): void {
    // Enhanced JSON stream processing to handle concatenated JSON objects
    try {
      // First attempt to parse the entire line as a single JSON object
      try {
        const data = JSON.parse(line);
        this.processJsonData(data, callbacks);
        return; // Successfully processed as a single JSON object
      } catch (singleParseError) {
        // If single parse fails, the line might contain multiple concatenated JSON objects
        // Continue to the advanced processing below
        console.debug('Single JSON parse failed, attempting to process concatenated objects:', 
          singleParseError instanceof Error ? singleParseError.message : String(singleParseError));
      }
      
      // Advanced processing for concatenated JSON objects
      let processedCount = 0;
      let remainingText = line;
      
      while (remainingText.length > 0) {
        // Find the position of the first opening brace
        const firstBracePos = remainingText.indexOf('{');
        if (firstBracePos === -1) break; // No more JSON objects
        
        // Trim anything before the first brace
        remainingText = remainingText.substring(firstBracePos);
        
        // Find the matching closing brace using a JSON object depth counter
        let depth = 0;
        let closingBracePos = -1;
        
        for (let i = 0; i < remainingText.length; i++) {
          const char = remainingText[i];
          if (char === '{') depth++;
          else if (char === '}') {
            depth--;
            if (depth === 0) {
              closingBracePos = i;
              break;
            }
          }
        }
        
        if (closingBracePos === -1) break; // No complete JSON object found
        
        // Extract the JSON object string
        const jsonStr = remainingText.substring(0, closingBracePos + 1);
        
        // Parse and process this JSON object
        try {
          const data = JSON.parse(jsonStr);
          this.processJsonData(data, callbacks);
          processedCount++;
        } catch (parseError) {
          console.warn(`Failed to parse JSON segment [${processedCount + 1}]:`, jsonStr.substring(0, 100), parseError);
        }
        
        // Move to the remainder of the text
        remainingText = remainingText.substring(closingBracePos + 1);
      }
      
      if (processedCount === 0) {
        // If we couldn't process any JSON objects, log the issue
        console.warn('Failed to parse streaming data:', line.substring(0, 150) + (line.length > 150 ? '...' : ''));
      } else {
        console.debug(`Successfully processed ${processedCount} JSON objects from concatenated stream`);
      }
    } catch (error) {
      console.error('Error in stream processing:', error);
      // Don't call onError for parsing failures, just log them
    }
  }

  /**
   * Process a single JSON data object and invoke the appropriate callback
   */
  private processJsonData(data: any, callbacks: StreamingCallbacks): void {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid JSON data format, expected an object:', data);
      return;
    }
    
    // Handle error messages
    if (data.error) {
      const errorMessage = data.error.message || (typeof data.error === 'string' ? data.error : 'Unknown error');
      try {
        callbacks.onError(new Error(errorMessage));
      } catch (callbackError) {
        console.error('Error invoking error callback:', callbackError);
      }
      return;
    }
    
    // Handle cache status
    if (data.type === 'cache' && callbacks.onCache) {
      try {
        callbacks.onCache(data.cached === true);
        
        // If we're retrieving from cache, also update the preview
        if (data.cached === true && data.result?.logoSvg) {
          callbacks.onPreview(data.result.logoSvg);
        }
      } catch (cacheCallbackError) {
        console.error('Error in cache callback:', cacheCallbackError);
      }
    }
    
    // Handle progress updates
    if (data.type === 'progress' && data.progress) {
      try {
        callbacks.onProgress({
          currentStageId: data.progress.currentStageId || data.progress.currentStage || '',
          currentStage: data.progress.currentStage || data.progress.currentStageId || '', // Backward compatibility
          stageProgress: typeof data.progress.stageProgress === 'number' ? data.progress.stageProgress : 0,
          overallProgress: typeof data.progress.overallProgress === 'number' ? 
            data.progress.overallProgress : (typeof data.progress.progress === 'number' ? data.progress.progress : 0),
          statusMessage: data.progress.statusMessage || data.progress.message || 'Processing...',
          // Backward compatibility
          stage: data.progress.currentStage || '',
          progress: data.progress.stageProgress || 0,
          message: data.progress.statusMessage || 'Processing...',
          status: 'completed'
        });
      } catch (progressError) {
        console.error('Error processing progress update:', progressError, data);
      }
    }
    
    // Handle SVG preview
    if ((data.type === 'svg_preview' || data.type === 'preview') && (data.previewSvg || data.preview)) {
      try {
        callbacks.onPreview(data.previewSvg || data.preview);
      } catch (previewError) {
        console.error('Error in preview callback:', previewError);
      }
    } else if (data.preview) {
      // Backward compatibility
      try {
        callbacks.onPreview(data.preview);
      } catch (legacyPreviewError) {
        console.error('Error in legacy preview callback:', legacyPreviewError);
      }
    }
    
    // Handle result
    if (data.type === 'result' && data.result) {
      try {
        callbacks.onComplete(data.result, data.result.sessionId || data.sessionId || '');
      } catch (resultError) {
        console.error('Error processing result data:', resultError, data);
        try {
          callbacks.onError(new Error('Failed to process generation result'));
        } catch (errorCallbackError) {
          console.error('Error in error callback after result failure:', errorCallbackError);
        }
      }
    } else if (data.complete && data.assets) {
      // Backward compatibility
      try {
        callbacks.onComplete(data.assets, data.sessionId || '');
      } catch (assetError) {
        console.error('Error processing assets data:', assetError, data);
        try {
          callbacks.onError(new Error('Failed to process generation assets'));
        } catch (errorCallbackError) {
          console.error('Error in error callback after assets failure:', errorCallbackError);
        }
      }
    }
  }
}

export const streamProcessor = new StreamProcessor();
