// Cache management with consistency checking and automatic recovery

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string;
  enableChecksum?: boolean;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Set data in cache
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: options.version || '1.0',
      checksum: options.enableChecksum ? this.generateChecksum(data) : undefined,
    };
    
    this.cache.set(key, entry);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }
  
  // Get data from cache
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const ttl = options.ttl || this.DEFAULT_TTL;
    let entry = this.cache.get(key);
    
    // Try to load from localStorage if not in memory
    if (!entry) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          this.cache.set(key, entry!);
        }
      } catch (error) {
        console.warn('Failed to load cache from localStorage:', error);
      }
    }
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > ttl) {
      this.delete(key);
      return null;
    }
    
    // Check version compatibility
    if (options.version && entry.version !== options.version) {
      console.warn(`Cache version mismatch for ${key}`);
      this.delete(key);
      return null;
    }
    
    // Verify checksum if enabled
    if (options.enableChecksum && entry.checksum) {
      const currentChecksum = this.generateChecksum(entry.data);
      if (currentChecksum !== entry.checksum) {
        console.error(`Cache corruption detected for ${key}`);
        this.delete(key);
        return null;
      }
    }
    
    return entry.data;
  }
  
  // Check if cache exists and is valid
  has(key: string, ttl?: number): boolean {
    return this.get(key, { ttl }) !== null;
  }
  
  // Delete cache entry
  delete(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove cache from localStorage:', error);
    }
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear();
    
    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
  
  // Clear expired entries
  clearExpired(ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach((key) => this.delete(key));
  }
  
  // Generate checksum for data integrity
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([, entry]) => 
        now - entry.timestamp <= this.DEFAULT_TTL
      ).length,
      expiredEntries: entries.filter(([, entry]) => 
        now - entry.timestamp > this.DEFAULT_TTL
      ).length,
      totalSize: new Blob([JSON.stringify(Array.from(this.cache.entries()))]).size,
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Cache decorator for functions
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  options: CacheOptions = {}
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache
    const cached = cacheManager.get<R>(key, options);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    cacheManager.set(key, result, options);
    
    return result;
  };
}

// Automatic cache cleanup on interval
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs: number = 60000): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    cacheManager.clearExpired();
  }, intervalMs);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
