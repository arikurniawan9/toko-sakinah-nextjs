// lib/rateLimit.js
import { Redis } from 'redis';

let redis;

// Inisialisasi Redis client
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  // Jika tidak ada Redis URL, gunakan memory storage untuk development
  const memoryStore = new Map();
  
  export async function rateLimit({
    key,
    limit = 10,
    window = 60 * 1000, // 1 minute in milliseconds
  }) {
    const now = Date.now();
    const requestKey = `rateLimit:${key}`;
    const requests = memoryStore.get(requestKey) || [];
    
    // Hapus permintaan yang lebih lama dari window
    const validRequests = requests.filter(timestamp => now - timestamp < window);
    
    if (validRequests.length >= limit) {
      const timeSinceFirstRequest = now - validRequests[0];
      const timeToWait = window - timeSinceFirstRequest;
      
      return {
        success: false,
        resetTime: new Date(now + timeToWait),
      };
    }
    
    // Tambahkan permintaan baru
    validRequests.push(now);
    memoryStore.set(requestKey, validRequests);
    
    return {
      success: true,
      remaining: limit - validRequests.length,
      resetTime: new Date(now + window),
    };
  }

  export async function resetRateLimit(key) {
    const requestKey = `rateLimit:${key}`;
    memoryStore.delete(requestKey);
  }
  
  export async function closeRedis() {
    // No operation for memory store
  }
} else {
  // Gunakan Redis untuk production
  export async function rateLimit({
    key,
    limit = 10,
    window = 60 * 1000, // 1 minute in milliseconds
  }) {
    const requestKey = `rateLimit:${key}`;
    const now = Date.now();
    const windowStart = now - window;
    
    // Gunakan Redis pipeline untuk efisiensi
    const pipeline = redis.multi();
    
    // Hapus entri yang lebih lama dari window
    pipeline.zremrangebyscore(requestKey, 0, windowStart);
    
    // Cek jumlah permintaan dalam window
    pipeline.zcard(requestKey);
    
    // Tambahkan permintaan baru
    pipeline.zadd(requestKey, now, `${now}`);
    
    // Set expire pada key
    pipeline.expire(requestKey, Math.ceil(window / 1000));
    
    const [_, count] = await pipeline.exec();
    const requestCount = count[1][1];
    
    if (requestCount >= limit) {
      // Hitung kapan akan reset
      const oldestRequest = await redis.zrange(requestKey, 0, 0, 'WITHSCORES');
      if (oldestRequest.length > 0) {
        const oldestTimestamp = parseInt(oldestRequest[1]);
        const resetTime = new Date(oldestTimestamp + window);
        
        return {
          success: false,
          resetTime: resetTime,
        };
      }
    }
    
    return {
      success: true,
      remaining: limit - requestCount,
      resetTime: new Date(now + window),
    };
  }

  export async function resetRateLimit(key) {
    const requestKey = `rateLimit:${key}`;
    await redis.del(requestKey);
  }
  
  export async function closeRedis() {
    if (redis) {
      await redis.quit();
    }
  }
}