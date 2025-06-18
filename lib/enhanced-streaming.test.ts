import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  EnhancedStreamProcessor, 
  StreamMessageType,
  EnhancedStreamingCallbacks,
  BaseStreamMessage,
  ProgressStreamMessage,
  PreviewStreamMessage,
  ResultStreamMessage,
  ErrorStreamMessage,
  CacheStreamMessage
} from './enhanced-streaming';

describe('EnhancedStreamProcessor', () => {
  let streamProcessor: EnhancedStreamProcessor;
  let mockCallbacks: EnhancedStreamingCallbacks;
  
  // Mock ReadableStream
  const createMockStream = (messages: any[]) => {
    const encoder = new TextEncoder();
    
    return new ReadableStream({
      start(controller) {
        messages.forEach(message => {
          controller.enqueue(encoder.encode(JSON.stringify(message) + '\n'));
        });
        controller.close();
      }
    });
  };
  
  beforeEach(() => {
    // Create a new processor with test-friendly options
    streamProcessor = new EnhancedStreamProcessor({
      autoReconnect: false,
      heartbeatInterval: 1000,
      heartbeatTimeout: 2000,
      progressUpdateInterval: 100
    });
    
    // Setup mock callbacks
    mockCallbacks = {
      onProgress: vi.fn(),
      onPreview: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn(),
      onStart: vi.fn(),
      onStageComplete: vi.fn(),
      onWarning: vi.fn(),
      onInfo: vi.fn(),
      onCache: vi.fn(),
      onEnd: vi.fn(),
      onHeartbeat: vi.fn()
    };
    
    // Mock global Date.now
    vi.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Processing messages', () => {
    it('should handle START messages', async () => {
      const mockMessages = [
        {
          type: StreamMessageType.START,
          sessionId: 'test-session-123',
          estimatedTime: 60000,
          stages: [
            { id: 'stage-a', name: 'Requirements', estimatedDuration: 5000 }
          ],
          timestamp: Date.now()
        } as BaseStreamMessage
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onStart).toHaveBeenCalledWith(
        'test-session-123',
        60000,
        expect.arrayContaining([
          expect.objectContaining({ id: 'stage-a' })
        ])
      );
    });
    
    it('should handle PROGRESS messages', async () => {
      const mockMessages = [
        {
          type: StreamMessageType.PROGRESS,
          progress: {
            currentStage: 'stage-a',
            stageProgress: 50,
            overallProgress: 25,
            statusMessage: 'Processing requirements...',
            estimatedTimeRemaining: 45000,
            elapsedTime: 15000
          },
          timestamp: Date.now()
        } as ProgressStreamMessage
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStage: 'stage-a',
          stageProgress: 50,
          overallProgress: 25,
          statusMessage: 'Processing requirements...',
          estimatedTimeRemaining: 45000,
          elapsedTime: 15000
        })
      );
    });
    
    it('should handle PREVIEW messages', async () => {
      const mockMessages = [
        {
          type: StreamMessageType.PREVIEW,
          preview: {
            stageId: 'stage-d',
            content: '<svg></svg>',
            contentType: 'svg',
            width: 300,
            height: 300
          },
          timestamp: Date.now()
        } as PreviewStreamMessage
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          stageId: 'stage-d',
          content: '<svg></svg>',
          contentType: 'svg',
          dimensions: { width: 300, height: 300 }
        })
      );
    });
    
    it('should handle ERROR messages', async () => {
      const mockMessages = [
        {
          type: StreamMessageType.ERROR,
          error: {
            message: 'Something went wrong',
            code: 'GENERATION_ERROR',
            recoverable: true,
            retryAfter: 5000
          },
          timestamp: Date.now()
        } as ErrorStreamMessage
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Something went wrong' }),
        true, // recoverable
        5000 // retryAfter
      );
    });
    
    it('should handle RESULT messages', async () => {
      const mockResult = {
        success: true,
        logoSvg: '<svg></svg>',
        logoPngUrls: {
          size256: 'url1',
          size512: 'url2',
          size1024: 'url3'
        },
        downloadUrl: 'package-url'
      };
      
      const mockMessages = [
        {
          type: StreamMessageType.RESULT,
          result: mockResult,
          sessionId: 'test-session-123',
          metrics: {
            totalTime: 60000,
            tokensUsed: 1000
          },
          timestamp: Date.now()
        } as ResultStreamMessage
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onComplete).toHaveBeenCalledWith(
        mockResult,
        'test-session-123',
        expect.objectContaining({ totalTime: 60000, tokensUsed: 1000 })
      );
      
      // Should also call onEnd automatically
      expect(mockCallbacks.onEnd).toHaveBeenCalledWith('success');
    });
    
    it('should handle CACHE messages', async () => {
      const mockMessages = [
        {
          type: StreamMessageType.CACHE,
          cached: true,
          source: 'full',
          message: 'Retrieved from cache',
          timestamp: Date.now()
        } as CacheStreamMessage
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onCache).toHaveBeenCalledWith(true, 'full');
    });
    
    it('should handle legacy message formats', async () => {
      // Create legacy format messages
      const mockMessages = [
        {
          type: 'progress',
          progress: {
            currentStage: 'A',
            stageProgress: 60,
            overallProgress: 30,
            statusMessage: 'Processing...'
          }
        },
        {
          preview: '<svg></svg>'
        },
        {
          complete: true,
          assets: {
            logoSvg: '<svg></svg>',
            downloadUrl: 'url'
          },
          sessionId: 'legacy-session'
        }
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      // Should handle legacy progress
      expect(mockCallbacks.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStage: 'A',
          stageProgress: 60,
          overallProgress: 30
        })
      );
      
      // Should handle legacy preview
      expect(mockCallbacks.onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '<svg></svg>',
          contentType: 'svg'
        })
      );
      
      // Should handle legacy completion
      expect(mockCallbacks.onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          logoSvg: '<svg></svg>',
          downloadUrl: 'url'
        }),
        'legacy-session'
      );
    });
  });
  
  describe('Connection handling', () => {
    it('should handle stream ending gracefully', async () => {
      const mockMessages = [
        { type: StreamMessageType.START, sessionId: 'test' },
        { type: StreamMessageType.END, status: 'success' }
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onEnd).toHaveBeenCalledWith('success');
    });
    
    it('should handle heartbeat messages', async () => {
      const mockMessages = [
        { type: StreamMessageType.HEARTBEAT }
      ];
      
      const mockStream = createMockStream(mockMessages);
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onHeartbeat).toHaveBeenCalled();
    });
    
    it('should handle empty lines', async () => {
      // Create a stream with empty lines between messages
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: StreamMessageType.START }) + '\n\n'));
          controller.enqueue(encoder.encode('\n'));
          controller.enqueue(encoder.encode(JSON.stringify({ type: StreamMessageType.END, status: 'success' })));
          controller.close();
        }
      });
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onStart).toHaveBeenCalled();
      expect(mockCallbacks.onEnd).toHaveBeenCalledWith('success');
    });
  });
  
  describe('Error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      // Create a stream with invalid JSON
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('{ invalid json }\n'));
          controller.enqueue(encoder.encode(JSON.stringify({ type: StreamMessageType.END, status: 'success' }) + '\n'));
          controller.close();
        }
      });
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      // Should continue processing after invalid JSON
      expect(mockCallbacks.onEnd).toHaveBeenCalledWith('success');
    });
    
    it('should handle network errors and call onError', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          throw new Error('Network error');
        }
      });
      
      await streamProcessor.processStream(mockStream, mockCallbacks);
      
      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Network error' })
      );
    });
  });
  
  describe('Cancellation', () => {
    it('should allow cancellation of processing', async () => {
      // Create a slow stream
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        async pull(controller) {
          // Simulate a slow stream that takes time to produce data
          await new Promise(resolve => setTimeout(resolve, 100));
          controller.enqueue(encoder.encode(JSON.stringify({ type: StreamMessageType.PROGRESS })));
        }
      });
      
      // Start processing in the background
      const processingPromise = streamProcessor.processStream(mockStream, mockCallbacks);
      
      // Cancel processing
      streamProcessor.cancel();
      
      // Wait for processing to complete
      await processingPromise;
      
      // Should have called onError with cancellation message
      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('cancel') })
      );
    });
  });
});