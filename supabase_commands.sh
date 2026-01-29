# Supabase Migration Commands
# Jalankan perintah ini untuk migrasi ke Supabase

# 1. Generate Prisma Client
npx prisma generate

# 2. Pull schema dari database (cek apakah koneksi berhasil)
cross-env DATABASE_URL="postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require" npx prisma db pull

# 3. Jika pull berhasil, push schema ke database
cross-env DATABASE_URL="postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require" npx prisma db push

# 4. Generate client lagi setelah push
cross-env DATABASE_URL="postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require" npx prisma generate