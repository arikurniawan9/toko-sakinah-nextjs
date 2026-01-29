# Best Practices Manajemen Environment Variables

## 1. Prinsip Dasar Keamanan

### JANGAN pernah:
- Commit file .env ke repository publik
- Share credential database ke pihak tidak berwenang
- Gunakan credential yang sama untuk development dan production
- Hardcode credential di dalam kode

### SELALU lakukan:
- Gunakan .gitignore untuk file sensitif
- Gunakan strong, random secrets
- Rotasi credential secara berkala
- Gunakan environment variables berbeda untuk tiap environment

## 2. Struktur File Environment

```
├── .env                    # Production (DIIGNORE!)
├── .env.example          # Template untuk developer
├── .env.local            # Local development (DIIGNORE!)
├── .env.test             # Testing environment
└── .env.staging          # Staging environment
```

## 3. File .env.example (Aman untuk di-commit)

```
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-super-secret-jwt-token-here-change-this"
NEXTAUTH_URL="http://localhost:3000"

# Redis Configuration (optional)
REDIS_URL="redis://localhost:6379"
```

## 4. Konfigurasi untuk Deployment

### Vercel Environment Variables:
- Masuk ke Project Settings > Environment Variables
- Tambahkan variabel sesuai environment (Production, Preview, Development)

### Netlify Environment Variables:
- Site Settings > Build & Deploy > Environment
- Tambahkan variabel di sana

### Heroku Environment Variables:
- Settings > Config Vars
- Gunakan heroku config:set untuk CLI

## 5. Validasi Environment Variables

Tambahkan validasi di kode untuk memastikan environment variables tersedia:

```javascript
// Validasi environment variables penting
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
}
```

## 6. Pengelolaan untuk Tim

### Untuk Developer Baru:
1. Copy .env.example ke .env.local
2. Isi dengan credential development
3. Jangan commit .env.local

### Untuk Production:
1. Gunakan credential khusus production
2. Batasi akses ke environment variables
3. Gunakan tools seperti Doppler atau Vault untuk manajemen credential

## 7. Checklist Sebelum Deployment

- [ ] .env tidak di-commit ke repository
- [ ] Environment variables di platform deployment sudah diisi
- [ ] NEXTAUTH_SECRET cukup kuat dan acak
- [ ] NEXTAUTH_URL sudah diupdate ke domain production
- [ ] Database dapat diakses dari server deployment
- [ ] Backup credential disimpan dengan aman

## 8. Recovery Plan

Jika credential bocor:
1. Segera rotasi semua credential
2. Update di semua environment
3. Audit akses database
4. Ganti password dan secret keys
5. Monitor aktivitas mencurigakan