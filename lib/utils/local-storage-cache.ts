/**
 * A simple LocalStorage-based cache with TTL support.
 */
export class LocalStorageCache {
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    const itemStr = window.localStorage.getItem(this.getKey(key));
    if (!itemStr) {
      return null;
    }
    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();
      if (now > item.expiry) {
        window.localStorage.removeItem(this.getKey(key));
        return null;
      }
      return item.value;
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const expiry = new Date(now.getTime() + ttlSeconds * 1000).getTime();
    const item = {
      value,
      expiry,
    };
    try {
      window.localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
    }
  }

  public async del(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(this.getKey(key));
  }

  public async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    Object.keys(window.localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        window.localStorage.removeItem(key);
      }
    });
  }
}
