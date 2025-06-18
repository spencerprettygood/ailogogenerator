/**
 * Enhanced Streaming Implementation
 * 
 * This module provides advanced streaming capabilities for the AI Logo Generator,
 * with features such as:
 * - Reliable message delivery with auto-reconnect
 * - Detailed stage-based progress tracking
 * - Real-time previews at multiple stages
 * - Intelligent time estimation
 * - Advanced error handling and recovery
 */

import { GenerationProgress, GeneratedAssets, LogoStage, StagePreview } from './types';
import { estimateRemainingTime } from './time-estimation';

/**
 * Types of messages that can be streamed from the server
 */
export enum StreamMessageType {
  START = 'start',
  PROGRESS = 'progress',
  PREVIEW = 'preview',
  STAGE_COMPLETE = 'stage_complete',
  RESULT = 'result',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  CACHE = 'cache',
  HEARTBEAT = 'heartbeat',
  END = 'end'
}

/**
 * Base interface for all stream messages
 */
export interface BaseStreamMessage {
  type: StreamMessageType;
  timestamp?: number;
  sessionId?: string;
}

/**
 * Start message indicating the beginning of a generation
 */
export interface StartStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.START;
  sessionId: string;
  estimatedTime?: number;
  stages?: LogoStage[];
}

/**
 * Progress update message
 */
export interface ProgressStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.PROGRESS;
  progress: {
    currentStage: string;
    stageProgress: number;
    overallProgress: number;
    statusMessage: string;
    estimatedTimeRemaining?: number;
    elapsedTime?: number;
  };
}

/**
 * Preview message with partial results
 */
export interface PreviewStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.PREVIEW;
  preview: {
    stageId: string;
    content: string;
    contentType: 'svg' | 'png' | 'html';
    width?: number;
    height?: number;
  };
}

/**
 * Stage completion message
 */
export interface StageCompleteStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.STAGE_COMPLETE;
  stage: {
    id: string;
    name: string;
    duration: number;
    success: boolean;
  };
  nextStage?: {
    id: string;
    name: string;
    estimatedDuration: number;
  };
}

/**
 * Final result message
 */
export interface ResultStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.RESULT;
  result: GeneratedAssets;
  metrics?: {
    totalTime: number;
    tokensUsed: number;
    stages: Record<string, {
      duration: number;
      tokensUsed: number;
    }>;
  };
}

/**
 * Error message
 */
export interface ErrorStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.ERROR;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    recoverable?: boolean;
    retryAfter?: number;
  };
}

/**
 * Warning message
 */
export interface WarningStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.WARNING;
  warning: {
    message: string;
    code?: string;
  };
}

/**
 * Info message
 */
export interface InfoStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.INFO;
  info: {
    message: string;
    details?: unknown;
  };
}

/**
 * Cache status message
 */
export interface CacheStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.CACHE;
  cached: boolean;
  source?: 'full' | 'partial';
  message?: string;
}

/**
 * Heartbeat message to keep connection alive
 */
export interface HeartbeatStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.HEARTBEAT;
}

/**
 * End message indicating completion of streaming
 */
export interface EndStreamMessage extends BaseStreamMessage {
  type: StreamMessageType.END;
  status: 'success' | 'error' | 'cancelled';
}

/**
 * Union type of all possible stream messages
 */
export type StreamMessage =
  | StartStreamMessage
  | ProgressStreamMessage
  | PreviewStreamMessage
  | StageCompleteStreamMessage
  | ResultStreamMessage
  | ErrorStreamMessage
  | WarningStreamMessage
  | InfoStreamMessage
  | CacheStreamMessage
  | HeartbeatStreamMessage
  | EndStreamMessage;

/**
 * Callbacks for handling stream events
 */
export interface EnhancedStreamingCallbacks {
  onStart?: (sessionId: string, estimatedTime: number, stages: LogoStage[]) => void;
  onProgress: (progress: GenerationProgress) => void;
  onPreview: (preview: StagePreview) => void;
  onStageComplete?: (stageId: string, stageName: string, duration: number) => void;
  onComplete: (assets: GeneratedAssets, sessionId: string, metrics?: any) => void;
  onError: (error: Error, recoverable?: boolean, retryAfter?: number) => void;
  onWarning?: (message: string, code?: string) => void;
  onInfo?: (message: string, details?: unknown) => void;
  onCache?: (isCached: boolean, source?: 'full' | 'partial') => void;
  onEnd?: (status: 'success' | 'error' | 'cancelled') => void;
  onHeartbeat?: () => void;
}

/**
 * Configuration options for enhanced streaming
 */
export interface EnhancedStreamingOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  progressUpdateInterval?: number;
  enableTimeEstimation?: boolean;
}

/**
 * Enhanced stream processor with advanced features
 */
export class EnhancedStreamProcessor {
  private decoder = new TextDecoder();
  private buffer = '';
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private lastHeartbeat = 0;
  private options: EnhancedStreamingOptions;
  private startTime = 0;
  private stageStartTimes: Record<string, number> = {};
  private stages: LogoStage[] = [];
  private currentStage = '';
  private abortController?: AbortController;
  private stageHistory: Record<string, { 
    startTime: number, 
    endTime?: number, 
    progress: number,
    previews: number
  }> = {};

  /**
   * Create a new EnhancedStreamProcessor
   * @param options Configuration options
   */
  constructor(options: EnhancedStreamingOptions = {}) {
    // Default options
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 3,
      reconnectDelay: 1000,
      heartbeatInterval: 15000, // 15 seconds
      heartbeatTimeout: 30000, // 30 seconds
      progressUpdateInterval: 250, // 250 ms
      enableTimeEstimation: true,
      ...options
    };
  }

  /**
   * Process a stream with enhanced features
   * @param streamOrUrl ReadableStream or URL to fetch
   * @param callbacks Callbacks for stream events
   * @param requestInit Optional fetch options if URL is provided
   */
  async processStream(
    streamOrUrl: ReadableStream<Uint8Array> | string,
    callbacks: EnhancedStreamingCallbacks,
    requestInit?: RequestInit
  ): Promise<void> {
    this.startTime = Date.now();
    this.stageStartTimes = {};
    this.stageHistory = {};
    this.reconnectAttempts = 0;
    this.abortController = new AbortController();
    
    try {
      // Handle URL or stream
      let stream: ReadableStream<Uint8Array>;
      if (typeof streamOrUrl === 'string') {
        // Create abort controller for fetch
        const abortController = new AbortController();
        this.abortController = abortController;
        
        // Fetch from URL
        const response = await fetch(streamOrUrl, {
          ...requestInit,
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        if (!response.body) {
          throw new Error('Response has no body');
        }
        
        stream = response.body;
      } else {
        stream = streamOrUrl;
      }
      
      // Start heartbeat checker if enabled
      this.startHeartbeatChecker(callbacks);
      
      // Process the stream
      await this.processStreamInternal(stream, callbacks);
    } catch (error) {
      // Handle potential reconnect if enabled
      if (
        this.options.autoReconnect &&
        this.reconnectAttempts < (this.options.maxReconnectAttempts || 3) &&
        error instanceof Error &&
        (
          error.name === 'AbortError' || 
          error.name === 'NetworkError' || 
          error.message.includes('network') ||
          error.message.includes('connection')
        )
      ) {
        this.reconnectAttempts++;
        const delay = this.options.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Reconnecting (attempt ${this.reconnectAttempts}) in ${delay}ms...`);
        
        // Wait before reconnecting
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Try again with the same parameters
        return this.processStream(streamOrUrl, callbacks, requestInit);
      }
      
      // If we reach here, either reconnect is disabled, max attempts reached, or error is not recoverable
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Clean up
      this.stopHeartbeatChecker();
    }
  }

  /**
   * Internal stream processing method
   */
  private async processStreamInternal(
    stream: ReadableStream<Uint8Array>,
    callbacks: EnhancedStreamingCallbacks
  ): Promise<void> {
    const reader = stream.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        // Update last heartbeat time
        this.lastHeartbeat = Date.now();
        
        if (done) {
          // Process any remaining data in buffer
          if (this.buffer.trim()) {
            this.processLine(this.buffer.trim(), callbacks);
          }
          
          // Send end event if not already sent
          callbacks.onEnd?.('success');
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
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process a single line from the stream
   */
  private processLine(line: string, callbacks: EnhancedStreamingCallbacks): void {
    try {
      const message = JSON.parse(line) as StreamMessage;
      
      // Process based on message type
      switch (message.type) {
        case StreamMessageType.START:
          this.handleStartMessage(message as StartStreamMessage, callbacks);
          break;
          
        case StreamMessageType.PROGRESS:
          this.handleProgressMessage(message as ProgressStreamMessage, callbacks);
          break;
          
        case StreamMessageType.PREVIEW:
          this.handlePreviewMessage(message as PreviewStreamMessage, callbacks);
          break;
          
        case StreamMessageType.STAGE_COMPLETE:
          this.handleStageCompleteMessage(message as StageCompleteStreamMessage, callbacks);
          break;
          
        case StreamMessageType.RESULT:
          this.handleResultMessage(message as ResultStreamMessage, callbacks);
          break;
          
        case StreamMessageType.ERROR:
          this.handleErrorMessage(message as ErrorStreamMessage, callbacks);
          break;
          
        case StreamMessageType.WARNING:
          this.handleWarningMessage(message as WarningStreamMessage, callbacks);
          break;
          
        case StreamMessageType.INFO:
          this.handleInfoMessage(message as InfoStreamMessage, callbacks);
          break;
          
        case StreamMessageType.CACHE:
          this.handleCacheMessage(message as CacheStreamMessage, callbacks);
          break;
          
        case StreamMessageType.HEARTBEAT:
          this.handleHeartbeatMessage(message as HeartbeatStreamMessage, callbacks);
          break;
          
        case StreamMessageType.END:
          this.handleEndMessage(message as EndStreamMessage, callbacks);
          break;
          
        default:
          // Handle legacy/unknown message formats
          this.handleLegacyMessage(message, callbacks);
          break;
      }
    } catch (parseError) {
      console.warn('Failed to parse streaming data:', line, parseError);
      // Don't call onError for parse failures, just log them
    }
  }

  /**
   * Handle START message
   */
  private handleStartMessage(message: StartStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    // Store session ID and stages for reference
    if (message.stages) {
      this.stages = message.stages;
    }
    
    // Call start callback
    callbacks.onStart?.(
      message.sessionId,
      message.estimatedTime || 120000, // Default to 2 minutes if not provided
      this.stages
    );
  }

  /**
   * Handle PROGRESS message
   */
  private handleProgressMessage(message: ProgressStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    const { progress } = message;
    
    // Track current stage for time estimation
    if (progress.currentStage !== this.currentStage) {
      // Record start time for new stage
      this.stageStartTimes[progress.currentStage] = Date.now();
      this.currentStage = progress.currentStage;
      
      // Record in stage history
      this.stageHistory[progress.currentStage] = {
        startTime: Date.now(),
        progress: progress.stageProgress,
        previews: 0
      };
    } else {
      // Update progress in stage history
      if (this.stageHistory[progress.currentStage]) {
        this.stageHistory[progress.currentStage].progress = progress.stageProgress;
      }
    }
    
    // Calculate estimated time remaining if not provided
    let estimatedTimeRemaining = progress.estimatedTimeRemaining;
    if (this.options.enableTimeEstimation && estimatedTimeRemaining === undefined) {
      estimatedTimeRemaining = estimateRemainingTime(
        this.stages,
        progress.currentStage,
        progress.stageProgress,
        this.stageHistory
      );
    }
    
    // Create enhanced progress object
    const enhancedProgress: GenerationProgress = {
      currentStage: progress.currentStage,
      stageProgress: progress.stageProgress,
      overallProgress: progress.overallProgress,
      statusMessage: progress.statusMessage,
      estimatedTimeRemaining,
      elapsedTime: Date.now() - this.startTime,
      // For backward compatibility
      stage: progress.currentStage,
      progress: progress.stageProgress,
      message: progress.statusMessage
    };
    
    // Call progress callback
    callbacks.onProgress(enhancedProgress);
  }

  /**
   * Handle PREVIEW message
   */
  private handlePreviewMessage(message: PreviewStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    const { preview } = message;
    
    // Track preview count for this stage
    if (this.stageHistory[preview.stageId]) {
      this.stageHistory[preview.stageId].previews++;
    }
    
    // Convert to StagePreview format
    const stagePreview: StagePreview = {
      stageId: preview.stageId,
      content: preview.content,
      contentType: preview.contentType,
      timestamp: Date.now(),
      dimensions: preview.width && preview.height ? { 
        width: preview.width, 
        height: preview.height 
      } : undefined
    };
    
    // Call preview callback
    callbacks.onPreview(stagePreview);
  }

  /**
   * Handle STAGE_COMPLETE message
   */
  private handleStageCompleteMessage(message: StageCompleteStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    const { stage, nextStage } = message;
    
    // Update stage history
    if (this.stageHistory[stage.id]) {
      this.stageHistory[stage.id].endTime = Date.now();
    }
    
    // Prepare for next stage if available
    if (nextStage) {
      this.stageStartTimes[nextStage.id] = Date.now();
      this.currentStage = nextStage.id;
      
      // Initialize next stage in history
      this.stageHistory[nextStage.id] = {
        startTime: Date.now(),
        progress: 0,
        previews: 0
      };
    }
    
    // Call stage complete callback
    callbacks.onStageComplete?.(stage.id, stage.name, stage.duration);
  }

  /**
   * Handle RESULT message
   */
  private handleResultMessage(message: ResultStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    // Call complete callback
    callbacks.onComplete(message.result, message.sessionId || '', message.metrics);
    
    // Automatically call end if not already called
    callbacks.onEnd?.('success');
  }

  /**
   * Handle ERROR message
   */
  private handleErrorMessage(message: ErrorStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    const { error } = message;
    
    // Create Error object
    const errorObj = new Error(error.message);
    if (error.code) {
      // @ts-ignore - Adding code property
      errorObj.code = error.code;
    }
    
    // Call error callback
    callbacks.onError(errorObj, error.recoverable, error.retryAfter);
    
    // If error is not recoverable, also call end
    if (!error.recoverable) {
      callbacks.onEnd?.('error');
    }
  }

  /**
   * Handle WARNING message
   */
  private handleWarningMessage(message: WarningStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    const { warning } = message;
    
    // Call warning callback if available
    callbacks.onWarning?.(warning.message, warning.code);
  }

  /**
   * Handle INFO message
   */
  private handleInfoMessage(message: InfoStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    const { info } = message;
    
    // Call info callback if available
    callbacks.onInfo?.(info.message, info.details);
  }

  /**
   * Handle CACHE message
   */
  private handleCacheMessage(message: CacheStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    // Call cache callback if available
    callbacks.onCache?.(message.cached, message.source);
  }

  /**
   * Handle HEARTBEAT message
   */
  private handleHeartbeatMessage(message: HeartbeatStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    // Update last heartbeat time
    this.lastHeartbeat = Date.now();
    
    // Call heartbeat callback if available
    callbacks.onHeartbeat?.();
  }

  /**
   * Handle END message
   */
  private handleEndMessage(message: EndStreamMessage, callbacks: EnhancedStreamingCallbacks): void {
    // Call end callback
    callbacks.onEnd?.(message.status);
    
    // Clean up resources
    this.stopHeartbeatChecker();
  }

  /**
   * Handle legacy message formats for backward compatibility
   */
  private handleLegacyMessage(message: any, callbacks: EnhancedStreamingCallbacks): void {
    // Legacy error handling
    if (message.error) {
      callbacks.onError(new Error(message.error.message || message.error));
      return;
    }
    
    // Legacy progress updates
    if (message.type === 'progress' && message.progress) {
      callbacks.onProgress({
        currentStage: message.progress.currentStage,
        stageProgress: message.progress.stageProgress,
        overallProgress: message.progress.overallProgress,
        statusMessage: message.progress.statusMessage,
        // For backward compatibility
        stage: message.progress.currentStage,
        progress: message.progress.stageProgress,
        message: message.progress.statusMessage
      });
    }
    
    // Legacy preview handling
    if (message.type === 'svg_preview' && message.previewSvg) {
      callbacks.onPreview({
        stageId: 'svg_generation',
        content: message.previewSvg,
        contentType: 'svg',
        timestamp: Date.now()
      });
    } else if (message.preview) {
      callbacks.onPreview({
        stageId: 'unknown',
        content: message.preview,
        contentType: 'svg',
        timestamp: Date.now()
      });
    }
    
    // Legacy result handling
    if (message.type === 'result' && message.result) {
      callbacks.onComplete(message.result, message.result.sessionId || '');
    } else if (message.complete && message.assets) {
      callbacks.onComplete(message.assets, message.sessionId || '');
    }
    
    // Legacy cache handling
    if (message.type === 'cache' && callbacks.onCache) {
      callbacks.onCache(message.cached === true);
    }
  }

  /**
   * Start the heartbeat checker
   */
  private startHeartbeatChecker(callbacks: EnhancedStreamingCallbacks): void {
    if (!this.options.heartbeatInterval || !this.options.heartbeatTimeout) {
      return;
    }
    
    this.lastHeartbeat = Date.now();
    
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;
      
      // Check if we've exceeded the heartbeat timeout
      if (timeSinceLastHeartbeat > this.options.heartbeatTimeout!) {
        // Connection might be dead
        callbacks.onError(
          new Error(`Connection timeout: No response for ${timeSinceLastHeartbeat}ms`),
          true // Recoverable
        );
        
        // Stop the timer
        this.stopHeartbeatChecker();
        
        // Abort the connection if possible
        if (this.abortController) {
          this.abortController.abort('Heartbeat timeout');
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop the heartbeat checker
   */
  private stopHeartbeatChecker(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Cancel the current stream processing
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort('User cancelled');
    }
    
    this.stopHeartbeatChecker();
  }
}

// Export singleton instance
export const enhancedStreamProcessor = new EnhancedStreamProcessor();