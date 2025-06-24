import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from './route';
import { CacheManager } from '@/lib/utils/cache-manager';
import { MultiAgentOrchestrator } from '@/lib/agents/orchestrator';

// Mock dependencies
vi.mock('@/lib/utils/security-utils', () => ({
  InputSanitizer: {
    sanitizeBrief: vi.fn(input => input)
  },
  RateLimiter: {
    check: vi.fn(() => ({ allowed: true }))
  }
}));

vi.mock('@/lib/agents/orchestrator', () => ({
  MultiAgentOrchestrator: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      success: true,
      result: {
        logoSvg: '<svg></svg>',
        downloadUrl: '/api/download?file=test.zip'
      },
      metrics: {
        totalExecutionTime: 5000,
        totalTokensUsed: 1000
      }
    })
  }))
}));

vi.mock('@/lib/utils/cache-manager', () => {
  const mockInstance = {
    getGenerationResult: vi.fn(),
    cacheGenerationResult: vi.fn(),
    cacheProgress: vi.fn(),
    getStats: vi.fn().mockReturnValue({
      enabled: true,
      counts: { generation: 5 },
      maxSizes: { generation: 100 },
      ttls: { generation: 3600000 },
      totalSize: 5
    })
  };
  
  return {
    CacheManager: {
      getInstance: vi.fn(() => mockInstance)
    }
  };
});

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-session-id')
}));

// Mock TextEncoder
global.TextEncoder = class TextEncoder {
  encode(text: string) {
    return new Uint8Array([...text].map(c => c.charCodeAt(0)));
  }
};

// Mock ReadableStream
class MockReadableStream extends ReadableStream {
  controller: { enqueue?: (chunk: unknown) => void; close?: () => void };
  
  constructor(options: { start?: (controller: { enqueue: (chunk: unknown) => void; close: () => void }) => void }) {
    const controller = {} as { enqueue: (chunk: unknown) => void; close: () => void };
    super({
      start(c) {
        Object.assign(controller, c);
        if (options?.start) options.start(c);
      }
    });
    this.controller = controller;
  }
}

// @ts-expect-error - Mock ReadableStream
global.ReadableStream = MockReadableStream;

describe('Logo Generation API Route', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('https://example.com/api/generate-logo', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Create a logo for my company',
        images: []
      })
    });
    
    // Mock response JSON method
    vi.spyOn(NextResponse, 'json').mockImplementation((body, options) => {
      return new NextResponse(JSON.stringify(body), options);
    });
    
    // Mock process.env
    process.env.NODE_ENV = 'development';
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('POST handler', () => {
    it('should stream logo generation results', async () => {
      // Setup cache miss
      CacheManager.getInstance().getGenerationResult.mockReturnValue(null);
      
      // Execute the handler
      const response = await POST(mockRequest);
      
      // Check response headers
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      
      // Verify orchestrator was called with correct parameters
      expect(MultiAgentOrchestrator).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Create a logo for my company'
        }),
        expect.objectContaining({
          maxConcurrentAgents: 2,
          timeoutMs: 180000,
          retryFailedAgents: true,
          debugMode: true
        }),
        expect.any(Function)
      );
      
      // Verify cache operations
      expect(CacheManager.getInstance().getGenerationResult).toHaveBeenCalled();
      expect(CacheManager.getInstance().cacheGenerationResult).toHaveBeenCalled();
    });
    
    it('should return cached results when available', async () => {
      // Setup cache hit
      const mockCachedResult = {
        success: true,
        logoSvg: '<svg>cached</svg>',
        downloadUrl: '/api/download?file=cached.zip'
      };
      
      CacheManager.getInstance().getGenerationResult.mockReturnValue(mockCachedResult);
      
      // Execute the handler
      const response = await POST(mockRequest);
      
      // Verify cache was checked
      expect(CacheManager.getInstance().getGenerationResult).toHaveBeenCalled();
      
      // Verify orchestrator was NOT called
      expect(MultiAgentOrchestrator.prototype.execute).not.toHaveBeenCalled();
      
      // Stream should contain cached notice
      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('cached');
      expect(text).toContain('true');
    });
    
    it('should handle invalid requests properly', async () => {
      // Create request with empty prompt
      const invalidRequest = new NextRequest('https://example.com/api/generate-logo', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '',
          images: []
        })
      });
      
      // Execute the handler
      const response = await POST(invalidRequest);
      
      // Check that the response is an error stream
      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('error');
      expect(text).toContain('A text prompt is required');
    });
    
    it('should handle rate limiting', async () => {
      // Mock rate limiter to deny the request - using import instead of require
      const { RateLimiter } = await import('@/lib/utils/security-utils');
      RateLimiter.check.mockReturnValueOnce({ 
        allowed: false, 
        retryAfter: 60000 
      });
      
      // Execute the handler
      const response = await POST(mockRequest);
      
      // Check that the response is a rate limit error
      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('error');
      expect(text).toContain('Rate limit exceeded');
      expect(text).toContain('retryAfterSeconds');
    });
  });
  
  describe('GET handler', () => {
    it('should return cache statistics in development mode', async () => {
      // Execute the handler
      const response = await GET(mockRequest);
      
      // Parse the response
      const body = await response.json();
      
      // Check the response contains cache stats
      expect(body).toHaveProperty('cache');
      expect(body.cache).toHaveProperty('enabled');
      expect(body.cache).toHaveProperty('counts');
    });
    
    it('should not return stats in production mode', async () => {
      // Set to production mode
      process.env.NODE_ENV = 'production';
      
      // Execute the handler
      const response = await GET(mockRequest);
      
      // Parse the response
      const body = await response.json();
      
      // Check the response contains error
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('development mode');
    });
  });
});