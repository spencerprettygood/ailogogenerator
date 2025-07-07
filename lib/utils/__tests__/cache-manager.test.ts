import { CacheManager, CacheType } from '../cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    // Reset the singleton instance for each test
    // @ts-expect-error - accessing private property for testing
    CacheManager.instance = undefined;
    cacheManager = CacheManager.getInstance();
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
    cacheManager.clear();
  });

  describe('Basic functionality', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should set and get values from the cache', () => {
      const key = 'test-key';
      const data = { test: 'value' };
      const type: CacheType = 'generation';

      cacheManager.set(key, data, type);

      const retrieved = cacheManager.get(key, type);
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = cacheManager.get('non-existent-key', 'generation');
      expect(retrieved).toBeNull();
    });

    it('should respect TTL and expire items', async () => {
      const key = 'expiring-key';
      const data = { test: 'value' };

      cacheManager.set(key, data, 'generation');

      // Initially, the item should be in the cache
      expect(cacheManager.get(key, 'generation')).toEqual(data);

      // Wait for the TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Now the item should be expired
      expect(cacheManager.get(key, 'generation')).toBeNull();
    });
  });

  describe('Size limits and eviction', () => {
    it('should respect max size limits and evict the oldest items', () => {
      // Configure with a small max size
      cacheManager.configure({
        defaultTTL: 3000,
      });

      // Add more items than the max size
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key-${i}`, { value: i }, 'generation');

        // Small delay to ensure creation times are different
        jest.advanceTimersByTime(10);
      }

      // The oldest items should have been evicted
      expect(cacheManager.get('key-0', 'generation')).toBeNull();
      expect(cacheManager.get('key-1', 'generation')).toBeNull();

      // The newer items should still be in the cache
      expect(cacheManager.get('key-2', 'generation')).not.toBeNull();
      expect(cacheManager.get('key-3', 'generation')).not.toBeNull();
      expect(cacheManager.get('key-4', 'generation')).not.toBeNull();
    });
  });

  describe('Cache key generation', () => {
    it('should generate consistent cache keys for the same brief', () => {
      const brief1 = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [],
      };

      const brief2 = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [],
      };

      const key1 = cacheManager.getCacheKey(brief1);
      const key2 = cacheManager.getCacheKey(brief2);

      expect(key1).toEqual(key2);
    });

    it('should generate different cache keys for different briefs', () => {
      const brief1 = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [],
      };

      const brief2 = {
        prompt: 'Create a logo for a food company',
        image_uploads: [],
      };

      const key1 = cacheManager.getCacheKey(brief1);
      const key2 = cacheManager.getCacheKey(brief2);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('Specialized caching methods', () => {
    it('should cache and retrieve generation results', () => {
      const brief = {
        prompt: 'Create a logo for a tech company',
        image_uploads: [],
      };

      const result = {
        success: true,
        brandName: 'TechCorp',
        logoSvg: '<svg></svg>',
        logoPngUrls: {
          size256: 'url1',
          size512: 'url2',
          size1024: 'url3',
        },
        monochromeVariants: {
          blackSvg: '<svg></svg>',
          whiteSvg: '<svg></svg>',
        },
        faviconIcoUrl: 'url4',
        brandGuidelinesUrl: 'url5',
        downloadUrl: 'url6',
      };

      cacheManager.cacheGenerationResult(brief, result);

      const retrieved = cacheManager.getGenerationResult(brief);
      expect(retrieved).toEqual(result);
    });

    it('should cache and retrieve intermediate results', () => {
      const sessionId = 'test-session';
      const stageId = 'stage-d';
      const data = { svg: '<svg></svg>' };

      cacheManager.cacheIntermediateResult(sessionId, stageId, data);

      const retrieved = cacheManager.getIntermediateResult(sessionId, stageId);
      expect(retrieved).toEqual(data);
    });

    it('should cache and retrieve progress information', () => {
      const sessionId = 'test-session';
      const progress = {
        currentStage: 'stage-d',
        stageProgress: 75,
        overallProgress: 50,
        statusMessage: 'Generating SVG...',
      };

      cacheManager.cacheProgress(sessionId, progress);

      const retrieved = cacheManager.getProgress(sessionId);
      expect(retrieved).toEqual(progress);
    });
  });

  describe('Cache management', () => {
    it('should clear the entire cache', () => {
      // Add some items to the cache
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'intermediate');

      // Clear the cache
      cacheManager.clear();

      // Verify everything is gone
      expect(cacheManager.get('key1', 'generation')).toBeNull();
      expect(cacheManager.get('key2', 'intermediate')).toBeNull();

      // Verify stats are reset
      const stats = cacheManager.getStats();
      expect(stats.counts.generation).toBe(0);
      expect(stats.counts.intermediate).toBe(0);
    });

    it('should invalidate specific items', () => {
      // Add some items to the cache
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'generation');

      // Invalidate one item
      cacheManager.invalidate('key1', 'generation');

      // Verify the invalidated item is gone
      expect(cacheManager.get('key1', 'generation')).toBeNull();

      // Verify the other item is still there
      expect(cacheManager.get('key2', 'generation')).toBe('value2');
    });

    it('should invalidate all items of a specific type', () => {
      // Add items of different types
      cacheManager.set('key1', 'value1', 'generation');
      cacheManager.set('key2', 'value2', 'intermediate');

      // Invalidate one type
      cacheManager.invalidateType('generation');

      // Verify the items of that type are gone
      expect(cacheManager.get('key1', 'generation')).toBeNull();

      // Verify items of other types are still there
      expect(cacheManager.get('key2', 'intermediate')).toBe('value2');
    });

    it('should not cache when disabled', () => {
      // Disable the cache
      cacheManager.setEnabled(false);

      // Try to add an item
      cacheManager.set('key1', 'value1', 'generation');

      // Verify it wasn't added
      expect(cacheManager.get('key1', 'generation')).toBeNull();
    });
  });
});
