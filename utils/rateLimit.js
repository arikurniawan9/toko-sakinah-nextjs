import { Redis } from 'redis';

let redis;

// Inisialisasi Redis connection jika tersedia
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  // Jika tidak ada Redis, gunakan objek sederhana (hanya untuk development)
  const inMemoryStore = new Map();
  redis = {
    get: async (key) => {
      const item = inMemoryStore.get(key);
      if (!item) return null;
      if (item.expire < Date.now()) {
        inMemoryStore.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key, value, seconds) => {
      inMemoryStore.set(key, {
        value,
        expire: Date.now() + (seconds * 1000)
      });
    },
    incr: async (key) => {
      const current = await this.get(key);
      const newValue = current ? parseInt(current) + 1 : 1;
      await this.set(key, newValue, 900); // 15 menit default
      return newValue;
    },
    del: async (key) => {
      inMemoryStore.delete(key);
    }
  };
}

const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => req.ip
  } = options;

  return async (handler) => {
    return async (req, res) => {
      const key = keyGenerator(req);
      const count = await redis.incr(key);
      
      if (count > max) {
        res.setHeader('Retry-After', Math.floor(windowMs / 1000));
        return res.status(statusCode).json({ error: message });
      }
      
      // Set header untuk memberi tahu sisa permintaan yang tersedia
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(max - count, 0));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toUTCString());
      
      return handler(req, res);
    };
  };
};

// Rate limiter spesifik untuk endpoint login
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maksimal 5 percobaan login per 15 menit
  message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
  keyGenerator: (req) => `${req.ip}_${req.body?.username || 'unknown'}`
});

// Rate limiter umum untuk API routes
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maksimal 100 permintaan per 15 menit
  message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
});

// Rate limiter untuk pencarian produk
export const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Maksimal 50 permintaan pencarian per 15 menit
  message: 'Terlalu banyak permintaan pencarian. Silakan coba lagi nanti.'
});

export default rateLimit;