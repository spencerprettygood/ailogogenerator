/**
 * @file cache-adapter.ts
 * @description Cache adapter interfaces and implementations
 *
 * This file provides a cache adapter interface and implementations
 * for different storage backends (memory, Redis, DynamoDB, etc.)
 */

import { env } from './env';

/**
 * Cache item interface
 */
export interface CacheItem<T> {
  key: string;
  data: T;
  expiresAt: number;
  createdAt: number;
  type: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cache adapter interface
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<CacheItem<T> | null>;
  set<T>(key: string, item: CacheItem<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(type?: string): Promise<void>;
  keys(type?: string): Promise<string[]>;
  size(type?: string): Promise<number>;
}

/**
 * Memory cache adapter (for development and testing)
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, any> = new Map();

  async get<T>(key: string): Promise<CacheItem<T> | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined;

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item;
  }

  async set<T>(key: string, item: CacheItem<T>): Promise<void> {
    this.cache.set(key, item);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(type?: string): Promise<void> {
    if (!type) {
      this.cache.clear();
      return;
    }

    // Clear only items of specified type
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (item.type === type) {
        this.cache.delete(key);
      }
    }
  }

  async keys(type?: string): Promise<string[]> {
    if (!type) {
      return Array.from(this.cache.keys());
    }

    // Return only keys of specified type
    const keys: string[] = [];
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (item.type === type) {
        keys.push(key);
      }
    }
    return keys;
  }

  async size(type?: string): Promise<number> {
    if (!type) {
      return this.cache.size;
    }

    // Count only items of specified type
    let count = 0;
    for (const item of Array.from(this.cache.values())) {
      if (item.type === type) {
        count++;
      }
    }
    return count;
  }
}

/**
 * External Redis cache adapter
 * For production use with serverless functions
 */

import { createClient, RedisClientType } from 'redis';
import { z } from 'zod';

export class RedisCacheAdapter implements CacheAdapter {
  private client: RedisClientType;
  private prefix: string;

  constructor(redisUrl?: string, prefix = 'ailogo:') {
    this.prefix = prefix;

    // Validate redisUrl strictly for production
    const redisUrlSchema = z.string().url();
    if (!redisUrl || !redisUrlSchema.safeParse(redisUrl).success) {
      throw new Error('REDIS_URL is missing or invalid. Cannot initialize RedisCacheAdapter.');
    }

    this.client = createClient({ url: redisUrl });
    let connected = false;
    this.client.on('error', (err) => {
      // Fail fast in production
      console.error('Redis connection error:', err);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    });
    this.client.connect()
      .then(() => {
        connected = true;
        console.info('Redis connected successfully.');
      })
      .catch((err) => {
        console.error('Failed to connect to Redis:', err);
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      });
    // Optionally, block further cache operations until connected in production
    if (process.env.NODE_ENV === 'production' && !connected) {
      throw new Error('Redis connection not established.');
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<CacheItem<T> | null> {
    const fullKey = this.getFullKey(key);
    const data = await this.client.get(fullKey);

    if (!data) {
      return null;
    }

    try {
      const item = JSON.parse(data as string) as CacheItem<T>;

      // Check if expired
      if (item.expiresAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return item;
    } catch (error) {
      console.error(`[Redis Cache] Error parsing cache data for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, item: CacheItem<T>): Promise<void> {
    const fullKey = this.getFullKey(key);
    const data = JSON.stringify(item);

    // Calculate TTL in seconds
    const ttl = Math.ceil((item.expiresAt - Date.now()) / 1000);

    if (ttl <= 0) {
      // Already expired
      return;
    }

    // Set with TTL
    await this.client.set(fullKey, data, { EX: ttl });
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.client.del(fullKey);
    return result > 0;
  }

  async has(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  async clear(type?: string): Promise<void> {
    if (!type) {
      // Clear all cache with this prefix
      const keys = await this.client.keys(`${this.prefix}*`);

      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return;
    }

    // Clear only items of specified type
    // This requires getting all keys and checking their type
    const allKeys = await this.client.keys(`${this.prefix}*`);

    for (const fullKey of allKeys) {
      const data = await this.client.get(fullKey);

      if (!data) continue;

      try {
        const item = JSON.parse(data as string);

        if (item.type === type) {
          await this.client.del(fullKey);
        }
      } catch (error) {
        // Skip invalid items
        continue;
      }
    }
  }

  async keys(type?: string): Promise<string[]> {
    const allKeys = await this.client.keys(`${this.prefix}*`);
    const keys: string[] = [];

    // Remove prefix from keys
    const prefixLength = this.prefix.length;

    if (!type) {
      return allKeys.map((key: string) => key.substring(prefixLength));
    }

    // Filter by type
    for (const fullKey of allKeys) {
      const data = await this.client.get(fullKey);

      if (!data) continue;

      try {
        const item = JSON.parse(data as string);

        if (item.type === type) {
          keys.push(fullKey.substring(prefixLength));
        }
      } catch (error) {
        // Skip invalid items
        continue;
      }
    }

    return keys;
  }

  async size(type?: string): Promise<number> {
    const keys = await this.keys(type);
    return keys.length;
  }
}

/**
 * Factory function to create the appropriate cache adapter
 * based on environment configuration
 */
export function createCacheAdapter(): CacheAdapter {
  // Use Redis in production, memory in development
  if (env.isProduction) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required in production');
    }
    return new RedisCacheAdapter(redisUrl);
  }

  return new MemoryCacheAdapter();
}

// Export default adapter instance
export const cacheAdapter = createCacheAdapter();
export default cacheAdapter;
