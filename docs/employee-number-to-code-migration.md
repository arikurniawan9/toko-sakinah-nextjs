# Migrasi dari employeeNumber ke code

Dokumen ini menjelaskan perubahan struktural yang direkomendasikan untuk menyederhanakan sistem pengelolaan kode pengguna dalam aplikasi Toko Sakinah.

## Latar Belakang

Sebelumnya, sistem memiliki dua field untuk mengidentifikasi pengguna:
- `employeeNumber`: Kode karyawan unik secara global
- `code`: Kode pengguna unik per toko

Field ini menyebabkan kebingungan karena fungsinya sebenarnya serupa dan hanya menambah kompleksitas.

## Perubahan yang Telah Dilakukan di Sisi Aplikasi

1. Menghapus field `employeeNumber` dari form UserModal
2. Mengganti label "Kode Pengguna" menjadi "Kode Karyawan" untuk field `code`
3. Mengganti referensi `employeeNumber` menjadi `code` dalam komponen UI
4. Memperbarui mobileColumns di DataTable
5. Memperbarui fungsi-fungsi dalam useUserForm agar hanya bekerja dengan field `code`

## Perubahan yang Diperlukan di Sisi Database

Untuk implementasi penuh, lakukan migrasi database berikut:

1. Update schema.prisma:
   ```prisma
   model User {
     // ... field lain
     code           String    @unique // Ubah menjadi required dan unique global
     employeeNumber String?   // Hapus field ini
     // atau, jika ingin tetap unik per toko:
     // Tambahkan constraint di StoreUser yang menghubungkan dengan User
   }
   ```

2. Buat migrasi Prisma:
   ```bash
   npx prisma migrate dev --name remove-employee-number-field
   ```

## Catatan Implementasi

Jika ingin field `code` tetap unik per toko (bukan global), maka:
- Field `code` tetap opsional di model User
- Validasi unik dilakukan di level StoreUser melalui relasi
- Ini memungkinkan penggunaan kode yang sama di toko yang berbeda

## Referensi

Field `code` tetap digunakan dengan logika unik per toko seperti yang telah diimplementasikan di endpoint API `/api/store-users`.