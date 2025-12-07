import { NextResponse } from 'next/server';
import { Redis } from 'redis';

// Inisialisasi Redis connection
let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  // Untuk development, gunakan Map sederhana
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
      const current = await redis.get(key);
      const newValue = current ? parseInt(current) + 1 : 1;
      await redis.set(key, newValue, 900); // 15 menit
      return newValue;
    },
    del: async (key) => {
      inMemoryStore.delete(key);
    }
  };
}

export async function POST(request) {
  try {
    const { username, ip } = await request.json();
    
    // Validasi input
    if (!username || !ip) {
      return NextResponse.json({ error: 'Username dan IP diperlukan' }, { status: 400 });
    }
    
    // Gunakan IP dan username untuk membuat key
    const key = `login_attempts:${ip}:${username}`;
    const count = await redis.incr(key);
    
    // Set nilai maksimum percobaan login
    const maxAttempts = 5;
    const windowMinutes = 15;
    
    if (count > maxAttempts) {
      // Hitung waktu reset (dalam detik)
      const remainingTime = Math.floor((Date.now() + 15 * 60 * 1000 - Date.now()) / 1000);
      
      return NextResponse.json({
        blocked: true,
        message: `Terlalu banyak percobaan login. Akun Anda diblokir sementara selama ${windowMinutes} menit.`,
        resetAfter: remainingTime,
        attempts: count
      }, { status: 429 });
    }
    
    return NextResponse.json({
      blocked: false,
      attempts: count,
      remaining: maxAttempts - count
    });
  } catch (error) {
    console.error('Error checking login attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { username, ip } = await request.json();
    
    if (!username || !ip) {
      return NextResponse.json({ error: 'Username dan IP diperlukan' }, { status: 400 });
    }
    
    // Hapus counter percobaan login
    const key = `login_attempts:${ip}:${username}`;
    await redis.del(key);
    
    return NextResponse.json({ message: 'Login attempts reset' });
  } catch (error) {
    console.error('Error resetting login attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}