interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  public set<T>(key: string, data: T, ttlMs: number = 3600000): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const bibleCache = new SimpleCache();
