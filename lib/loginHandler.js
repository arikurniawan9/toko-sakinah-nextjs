import { logLogin } from './auditLogger';
import { authOptions } from './authOptions';

// Fungsi yang membungkus authOptions untuk menambahkan logging login
export async function handleLogin(credentials, req) {
  try {
    // Gunakan fungsi authorize dari authOptions
    const user = await authOptions.providers[0].authorize(credentials);
    
    if (user) {
      // Jika login berhasil, log aktivitas login
      if (user.id) {
        await logLogin(user.id, req, {
          role: user.role,
          storeAccess: user.storeAccess,
          isGlobalRole: user.isGlobalRole
        });
      }
    }
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    // Log error login jika diperlukan
    throw error;
  }
}