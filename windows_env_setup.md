# Konfigurasi untuk mengganti environment variable sistem di Windows

# Jika Anda menggunakan PowerShell, jalankan perintah berikut sebagai Administrator:
# [System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require", "Machine")

# Jika Anda menggunakan Command Prompt (cmd) sebagai Administrator:
# setx /M DATABASE_URL "postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require"

# ATAU

# Anda bisa mengganti environment variable lewat GUI Windows:
# 1. Tekan Win + R, ketik "sysdm.cpl", tekan Enter
# 2. Klik tab "Advanced", lalu "Environment Variables..."
# 3. Di bagian "System Variables", cari variabel "DATABASE_URL"
# 4. Jika ada, klik "Edit..." dan ganti valuenya ke:
#    postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require
# 5. Jika tidak ada, klik "New..." dan buat variabel baru dengan nama "DATABASE_URL"
#    dan value seperti di atas
# 6. Restart command prompt/terminal Anda

# Setelah mengganti environment variable sistem, restart terminal Anda dan coba lagi:
# echo %DATABASE_URL%

# Baru kemudian coba:
# npx prisma db pull