interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL;
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiry
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache para conteúdo HTML de páginas
export const htmlCache = new SimpleCache<string>(600000); // 10 minutes

// Cache para verificação de URLs de imagem
export const imageUrlCache = new SimpleCache<boolean>(1800000); // 30 minutes

// Cache para dimensões de imagens
export const imageDimensionsCache = new SimpleCache<{width: number, height: number}>(3600000); // 1 hour
