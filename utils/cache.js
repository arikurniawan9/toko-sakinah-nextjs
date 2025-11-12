// utils/cache.js - Simple in-memory cache utility
class SimpleCache {
  constructor(ttl = 5 * 60 * 1000) { // Default TTL: 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance for products
export const productCache = new SimpleCache(10 * 60 * 1000); // 10 minutes TTL for products

export default SimpleCache;