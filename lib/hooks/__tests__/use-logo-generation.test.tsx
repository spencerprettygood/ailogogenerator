import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogoGeneration } from '../use-logo-generation';
import { logoAPI } from '../../api';
import { streamProcessor } from '../../streaming';

// Mock dependencies
vi.mock('../../api', () => ({
  logoAPI: {
    generateLogo: vi.fn(),
    downloadPackage: vi.fn(),
  },
}));

vi.mock('../../streaming', () => ({
  streamProcessor: {
    processStream: vi.fn(),
  },
}));

describe('useLogoGeneration', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock stream return value
    (logoAPI.generateLogo as any).mockResolvedValue(new ReadableStream());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLogoGeneration());

    expect(result.current).toEqual(
      expect.objectContaining({
        isGenerating: false,
        progress: null,
        preview: null,
        assets: null,
        sessionId: null,
        error: null,
        fromCache: false,
      })
    );
  });

  it('should handle generateLogo action', async () => {
    // Setup mock implementation
    (streamProcessor.processStream as any).mockImplementation((stream, callbacks) => {
      // Simulate progress update
      callbacks.onProgress({
        status: 'generating',
        currentStage: 'stage-a',
        stageProgress: 50,
        progress: 25,
        message: 'Processing requirements',
      });

      // Simulate completion
      callbacks.onComplete({ logoSvg: '<svg></svg>' }, 'test-session-123');
    });

    const { result } = renderHook(() => useLogoGeneration());

    await act(async () => {
      await result.current.generateLogo('Create a logo', []);
    });

    // Verify API was called
    expect(logoAPI.generateLogo).toHaveBeenCalledWith('Create a logo', []);

    // Verify stream was processed
    expect(streamProcessor.processStream).toHaveBeenCalled();

    // Check final state
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toEqual({
      status: 'generating',
      currentStage: 'stage-a',
      stageProgress: 50,
      progress: 25,
      message: 'Processing requirements',
    });
    expect(result.current.assets).toEqual({ logoSvg: '<svg></svg>' });
    expect(result.current.sessionId).toBe('test-session-123');
  });

  it('should handle errors', async () => {
    // Setup error case
    (logoAPI.generateLogo as any).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useLogoGeneration());

    await act(async () => {
      await result.current.generateLogo('Create a logo', []);
    });

    // Check error state
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API error');
  });

  it('should handle streaming errors', async () => {
    // Setup streaming error
    (streamProcessor.processStream as any).mockImplementation((stream, callbacks) => {
      callbacks.onError(new Error('Stream error'));
    });

    const { result } = renderHook(() => useLogoGeneration());

    await act(async () => {
      await result.current.generateLogo('Create a logo', []);
    });

    // Check error state
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Stream error');
  });

  it('should handle previews', async () => {
    // Setup preview
    (streamProcessor.processStream as any).mockImplementation((stream, callbacks) => {
      callbacks.onPreview({
        stageId: 'stage-d',
        content: '<svg>preview</svg>',
        contentType: 'svg',
        timestamp: Date.now(),
      });
    });

    const { result } = renderHook(() => useLogoGeneration());

    await act(async () => {
      await result.current.generateLogo('Create a logo', []);
    });

    // Check preview
    expect(result.current.preview).toBe('<svg>preview</svg>');
  });

  it('should handle cached results', async () => {
    // Setup cache hit
    (streamProcessor.processStream as any).mockImplementation((stream, callbacks) => {
      callbacks.onCache?.(true);

      // Immediately complete with cache result
      callbacks.onProgress({
        status: 'completed',
        currentStage: 'cached',
        stageProgress: 100,
        progress: 100,
        message: 'Retrieved from cache',
      });

      callbacks.onComplete({ logoSvg: '<svg>cached</svg>' }, 'cached-session');
    });

    const { result } = renderHook(() => useLogoGeneration());

    await act(async () => {
      await result.current.generateLogo('Create a logo', []);
    });

    // Check cache state
    expect(result.current.fromCache).toBe(true);
    expect(result.current.progress?.currentStage).toBe('cached');
    expect(result.current.progress?.progress).toBe(100);
    expect(result.current.assets?.logos?.[0]?.svgCode || (result.current.assets as any)?.logoSvg).toBe('<svg>cached</svg>');
  });

  it('should reset state correctly', async () => {
    // Setup successful generation
    (streamProcessor.processStream as any).mockImplementation((stream, callbacks) => {
      callbacks.onProgress({
        status: 'generating',
        currentStage: 'stage-a',
        stageProgress: 50,
        progress: 25,
        message: 'Processing',
      });

      callbacks.onComplete({ logoSvg: '<svg></svg>' }, 'test-session');
    });

    const { result } = renderHook(() => useLogoGeneration());

    // Generate a logo
    await act(async () => {
      await result.current.generateLogo('Create a logo', []);
    });

    // Verify state was updated
    expect(result.current.assets).not.toBeNull();

    // Reset state
    act(() => {
      result.current.reset();
    });

    // Verify state was reset
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.assets).toBeNull();
    expect(result.current.sessionId).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.fromCache).toBe(false);
  });
});
