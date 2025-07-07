import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheManager, CacheType, CacheItem } from '../../utils/cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    // Reset the singleton instance for each test
    // @ts-expect-error - accessing private property for testing
    CacheManager.instance = undefined;
    cacheManager = CacheManager.getInstance();

    // Configure with test-friendly settings
    cacheManager.configure({
      enabled: true,
      ttl: {
        generation: 1000, // 1 second for easier testing
        intermediate: 1000,
        asset: 1000,
        progress: 1000,
        response: 1000,
      },
    });

    // Clear the cache for each test
    cacheManager.clear();

    // Mock crypto for deterministic hashing
    vi.spyOn(crypto, 'createHash').mockImplementation(() => {
      return {
        update: () => ({
          digest: () => 'test-hash',
        }),
      } as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should allow configuration of TTLs and max sizes', () => {
      cacheManager.configure({
        ttl: {
          generation: 5000,
          intermediate: 2000,
          asset: 10000,
          progress: 1000,
          response: 3000,
        },
      });

      const stats = cacheManager.getStats();

      expect(stats.ttls.generation).toBe(5000);
      expect(stats.ttls.intermediate).toBe(2000);
      expect(stats.maxSizes.generation).toBe(10);
      expect(stats.maxSizes.intermediate).toBe(20);
    });

    it('should allow enabling and disabling the cache', () => {
      cacheManager.setEnabled(false);

      // Set an item while disabled
      cacheManager.set('test', { data: 'value' }, 'generation');

      // Should not be stored
      expect(cacheManager.get('test', 'generation')).toBeNull();

      // Enable the cache
      cacheManager.setEnabled(true);

      // Set an item while enabled
      cacheManager.set('test', { data: 'value' }, 'generation');

      // Should be stored
      expect(cacheManager.get('test', 'generation')).toEqual({ data: 'value' });
    });
  });

  describe('Cache key generation', () => {
    it('should generate consistent cache keys for identical briefs', () => {
      const brief1 = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [{ name: 'image1.png', size: 1000, type: 'image/png', lastModified: 123 }],
      };

      const brief2 = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [{ name: 'image1.png', size: 1000, type: 'image/png', lastModified: 123 }],
      };

      const key1 = cacheManager.getCacheKey(brief1);
      const key2 = cacheManager.getCacheKey(brief2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different briefs', () => {
      // Mock createHash to call the real implementation
      vi.spyOn(crypto, 'createHash').mockRestore();

      const brief1 = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [],
      };

      const brief2 = {
        prompt: 'Create a logo for a different company',
        image_uploads: [],
      };

      const key1 = cacheManager.getCacheKey(brief1);
      const key2 = cacheManager.getCacheKey(brief2);

      expect(key1).not.toBe(key2);
    });

    it('should consider image metadata in key generation', () => {
      // Mock createHash to call the real implementation
      vi.spyOn(crypto, 'createHash').mockRestore();

      const brief1 = {
        prompt: 'Create a logo',
        image_uploads: [{ name: 'image1.png', size: 1000, type: 'image/png', lastModified: 123 }],
      };

      const brief2 = {
        prompt: 'Create a logo',
        image_uploads: [{ name: 'image2.png', size: 2000, type: 'image/png', lastModified: 456 }],
      };

      const key1 = cacheManager.getCacheKey(brief1);
      const key2 = cacheManager.getCacheKey(brief2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Cache operations', () => {
    it('should store and retrieve values correctly', () => {
      // Store a value
      cacheManager.set('key1', 'value1', 'generation');

      // Retrieve the value
      expect(cacheManager.get('key1', 'generation')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cacheManager.get('non-existent', 'generation')).toBeNull();
    });

    it('should return null for expired items', async () => {
      // Store a value
      cacheManager.set('expire-test', 'value', 'generation');

      // Wait for it to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should return null
      expect(cacheManager.get('expire-test', 'generation')).toBeNull();
    });

    it('should evict oldest items when max size is reached', () => {
      // Fill the cache beyond capacity
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'generation');
      cacheManager.set('key3', 'value3', 'generation');
      cacheManager.set('key4', 'value4', 'generation'); // This should evict key1

      // First item should be evicted
      expect(cacheManager.get('key1', 'generation')).toBeNull();

      // Newer items should still be present
      expect(cacheManager.get('key2', 'generation')).toBe('value2');
      expect(cacheManager.get('key3', 'generation')).toBe('value3');
      expect(cacheManager.get('key4', 'generation')).toBe('value4');
    });

    it('should invalidate specific items', () => {
      // Store values
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'generation');

      // Invalidate one item
      cacheManager.invalidate('key1', 'generation');

      // Check results
      expect(cacheManager.get('key1', 'generation')).toBeNull();
      expect(cacheManager.get('key2', 'generation')).toBe('value2');
    });

    it('should invalidate all items of a specific type', () => {
      // Store values of different types
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'intermediate');

      // Invalidate one type
      cacheManager.invalidateType('generation');

      // Check results
      expect(cacheManager.get('key1', 'generation')).toBeNull();
      expect(cacheManager.get('key2', 'intermediate')).toBe('value2');
    });

    it('should clear all items from the cache', () => {
      // Store values of different types
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'intermediate');

      // Clear the cache
      cacheManager.clear();

      // Check all items are gone
      expect(cacheManager.get('key1', 'generation')).toBeNull();
      expect(cacheManager.get('key2', 'intermediate')).toBeNull();

      // Check counts are reset
      const stats = cacheManager.getStats();
      expect(stats.counts.generation).toBe(0);
      expect(stats.counts.intermediate).toBe(0);
    });
  });

  describe('Specialized caching methods', () => {
    it('should cache and retrieve generation results', () => {
      const brief = { prompt: 'Create a logo', image_uploads: [] };
      const result = {
        success: true,
        logoSvg: '<svg></svg>',
        brandName: 'TestBrand',
      };

      // Cache the result
      cacheManager.cacheGenerationResult(brief, result);

      // Retrieve the result
      const cached = cacheManager.getGenerationResult(brief);

      expect(cached).toEqual(result);
    });

    it('should cache and retrieve intermediate results', () => {
      const sessionId = 'test-session';
      const stageId = 'stage-d';
      const data = { svg: '<svg></svg>' };

      // Cache the result
      cacheManager.cacheIntermediateResult(sessionId, stageId, data);

      // Retrieve the result
      const cached = cacheManager.getIntermediateResult(sessionId, stageId);

      expect(cached).toEqual(data);
    });

    it('should cache and retrieve progress information', () => {
      const sessionId = 'test-session';
      const progress = {
        currentStage: 'stage-d',
        stageProgress: 75,
        overallProgress: 50,
        statusMessage: 'Generating SVG...',
      };

      // Cache the progress
      cacheManager.cacheProgress(sessionId, progress);

      // Retrieve the progress
      const cached = cacheManager.getProgress(sessionId);

      expect(cached).toEqual(progress);
    });
  });

  describe('Cache statistics', () => {
    it('should track correct item counts per type', () => {
      // Add items of different types
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'generation');
      cacheManager.set('key3', 'value3', 'intermediate');
      cacheManager.set('key4', 'value4', 'asset');

      // Get stats
      const stats = cacheManager.getStats();

      // Check counts
      expect(stats.counts.generation).toBe(2);
      expect(stats.counts.intermediate).toBe(1);
      expect(stats.counts.asset).toBe(1);
      expect(stats.counts.progress).toBe(0);

      // Check total
      expect(stats.totalSize).toBe(4);
    });

    it('should update counts when items are invalidated', () => {
      // Add items
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'generation');

      // Invalidate one
      cacheManager.invalidate('key1', 'generation');

      // Check count decreased
      const stats = cacheManager.getStats();
      expect(stats.counts.generation).toBe(1);
    });

    it('should report correct configuration values', () => {
      // Configure with specific values
      cacheManager.configure({
        ttl: {
          generation: 5000,
        },
      });

      // Get stats
      const stats = cacheManager.getStats();

      // Check configuration values
      expect(stats.ttls.generation).toBe(5000);
      expect(stats.enabled).toBe(true);
    });
  });

  describe('Cleanup mechanism', () => {
    it('should clean up expired items during access', () => {
      // Add an item
      cacheManager.set('expire-test', 'value', 'generation');

      // Mock cache internals to simulate expiration
      // @ts-expect-error - accessing private property for testing
      const internalCache = cacheManager.cache;

      // Manually expire the item
      internalCache.set('generation:expire-test', {
        data: 'value',
        expiresAt: Date.now() - 1000, // expired 1 second ago
        createdAt: Date.now() - 2000,
        key: 'expire-test',
        type: 'generation',
      });

      // Access should clean up the expired item
      expect(cacheManager.get('expire-test', 'generation')).toBeNull();

      // Check the count decreased
      const stats = cacheManager.getStats();
      expect(stats.counts.generation).toBe(0);
    });
  });
});
