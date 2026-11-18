interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = 60_000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const memoryCache = new MemoryCache();

export const CACHE_KEYS = {
  SETTINGS: 'public:site_settings',
  SERVICES: 'public:services',
  SECTIONS_PUBLIC: 'public:sections_with_works:public',
  SECTIONS_PREVIEW: 'public:sections_with_works:preview',
  PORTFOLIO_BUNDLE_PUBLIC: 'public:portfolio_bundle:public',
  PORTFOLIO_BUNDLE_PREVIEW: 'public:portfolio_bundle:preview',
} as const;

/**
 * On-demand cache invalidator called by admin actions.
 * Clears all cached public portfolio data so edits/publishes appear instantly.
 */
export function invalidatePublicCache(): void {
  memoryCache.invalidatePrefix('public:');
}
