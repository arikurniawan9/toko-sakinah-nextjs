Judul: Buat aplikasi kasir toko pakaian (Next.js 14 App Router + Tailwind CSS + Prisma + SQLite -> migrasi ke PostgreSQL/Supabase). Tema: ungu muda pastel. Roles: Admin, Kasir, Pelayan (sales assistant). Halaman awal: pilihan Login Admin / Login Kasir / Login Pelayan.

Requirement detail:

1. Teknologi:
   - Next.js 14 (App Router)
   - Tailwind CSS (tema ungu muda pastel; warna utama #C084FC, sekunder #A78BFA)
   - Prisma ORM (database default: SQLite; migrasi: PostgreSQL / Supabase)
   - NextAuth.js (atau Auth.js Next 14) untuk autentikasi role-based
   - State simple: Context API atau Zustand
   - Upload gambar produk ke /public/uploads
   - Chart: recharts atau chart.js (opsional)
   - Styling: gunakan font Poppins atau Inter
2. Roles & akses:
   - Admin: CRUD kategori, produk, supplier, member, kasir, pelayan; lihat laporan; atur potongan harga; eksport CSV/PDF.
   - Kasir: buat transaksi, pilih produk, pilih member, cetak struk, stok berkurang otomatis.
   - Pelayan: hanya bisa melihat produk/stok/kategori, membuat daftar belanja sementara (wishlist yang bisa dikirim ke kasir), tidak boleh mengubah data atau melakukan transaksi.
3. Halaman landing:
   - Gradient background ungu muda, logo teks "Toko FashionKu", 3 tombol besar: Login Admin / Login Kasir / Login Pelayan.
4. Master data:
   - Kategori: id, nama_kategori, keterangan
   - Produk: id, kategori_id, nama_produk, kode_produk, stok, harga_beli, harga_jual, diskon_1_3 (integer, default 1000), diskon_4_6 (integer, admin input), diskon_lebih (optional), supplier_id, gambar
   - Supplier: id, nama_supplier, alamat, telepon, email
   - Member: id, nama_member, no_hp, alamat, jenis_member (silver/gold/platinum), diskon persen per jenis
   - Kasir: id, nama, username, password_hash, role='kasir'
   - Pelayan: id, nama, username, password_hash, role='pelayan'
5. Logika harga transaksi:
   - Jika qty 1–3: potongan per-item default 1000 (bisa diubah admin).
   - Jika qty 4–6: potongan per-item sesuai value diskon_4_6 yang input di produk.
   - Kalau qty >6: gunakan diskon_lebih apabila diisi admin (opsional).
   - Diskon member: persen (e.g., silver 3%, gold 5%, platinum 10%) ditumpuk setelah potongan per-item.
   - Sistem harus menghitung subtotal, potongan item, diskon member, pajak opsional, total bayar, uang tunai, kembalian.
6. Transaksi & tabel:
   - penjualan: id, kasir_id, pelayan_id (nullable, jika berasal dari daftar pelayan), member_id (nullable), tanggal, total, bayar, kembalian
   - penjualan_detail: id, penjualan_id, produk_id, qty, harga_satuan, potongan_per_item, subtotal
7. Fitur pelayan -> kasir:
   - Pelayan dapat buat "daftar belanja sementara" (temp_cart) yang bisa dikirim ke kasir (notifikasi / list view).
8. UI & UX:
   - Komponen: Sidebar/Admin dashboard, Topbar, card produk, form modal tambah produk, tabel data dengan search & pagination sederhana.
   - Mobile responsive & tablet friendly.
9. Prisma & migration:
   - Sertakan `prisma/schema.prisma` contoh sesuai model di atas (SQLite provider).
   - Sertakan sample .env vars (DATABASE_URL untuk sqlite dan contoh untuk postgresql/supabase).
10. Scripts:
    - npm run dev, build, start, prisma migrate dev, prisma generate.
11. Deliverables:
    - Struktur file (app/, prisma/, public/, styles/)
    - Contoh file `schema.prisma`
    - Contoh seed script sederhana untuk admin, kasir, pelayan, kategori contoh, produk contoh.
    - Contoh API endpoints (app/api/auth, app/api/produk, app/api/transaksi, app/api/laporan)
    - Contoh halaman: landing (pilih login), admin/dashboard, admin/produk, admin/kategori, admin/supplier, admin/member, admin/kasir, admin/pelayan, kasir/dashboard, kasir/transaksi, pelayan/dashboard, pelayan/daftar-belanja.
    - Dokumentasi singkat README.md dengan instruksi setup & migrasi ke PostgreSQL/Supabase.
    - Styling utama menggunakan Tailwind (tema ungu muda; beri variabel warna di tailwind config).
    - Pastikan autentikasi role-based: hanya role terkait dapat mengakses rute protected.
12. UX improvements (opsional, tapi sertakan saran):
    - Sistem log stock (stock in/out), notifikasi stok rendah, export/import CSV, undo transaksi dalam 5 menit.
    - Audit log untuk admin (siapa melakukan perubahan).
    - Integrasi printers (thermal) via window.print atau libs.
    - Realtime opsional via Supabase Realtime untuk multi-device.
13. Permintaan: Hasilkan proyek **skeleton** (file & kode penting). Jika alat mampu, generate file lengkap & seed data. Sertakan komentar kode agar developer bisa lanjut.

Instruksi penutup untuk AI:

- Buat struktur proyek dan file-file utama terlebih dahulu (layout, env example, schema.prisma, beberapa page stubs, API endpoint stubs, auth config).
- Sertakan contoh implementasi logika potongan harga di backend (fungsi perhitungan) dan contoh frontend transaksi yang memanggilnya.
- Jika tidak bisa membuat seluruh aplikasi sekaligus, prioritaskan: schema.prisma, autentikasi role, halaman landing, halaman kasir transaksi, admin produk CRUD, dan seed script.
- Buat README yang jelas: cara setup dev (install, prisma migrate dev, npm run dev), cara migrasi ke PostgreSQL (ubah DATABASE_URL dan prisma migrate deploy), dan cara generate seed data.

Selesaikan tugas ini sekarang dan tampilkan struktur file, file-file utama (schema.prisma, .env.example, tailwind.config.js, package.json scripts), dan contoh kode untuk: auth, product model CRUD, transaksi perhitungan potongan harga, dan seed.
