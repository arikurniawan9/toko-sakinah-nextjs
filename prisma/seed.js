// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeding database...');

  // Buat user manager (jika belum ada)
  const existingManager = await prisma.user.findUnique({
    where: { username: 'manager' }
  });

  if (!existingManager) {
    await prisma.user.create({
      data: {
        name: 'Admin Manager',
        username: 'manager',
        employeeNumber: 'MGR001',
        gender: 'Laki-laki',
        phone: '081234567890',
        password: await bcrypt.hash('password123', 10),
        role: 'MANAGER',
        status: 'AKTIF',
      },
    });
    console.log('Akun manager berhasil dibuat');
  } else {
    console.log('Akun manager sudah ada');
  }

  // Buat beberapa toko (jika belum ada)
  const existingStore = await prisma.store.findFirst();

  if (!existingStore) {
    const storesToCreate = [
      {
        name: 'Toko Pusat',
        code: 'TK001', // Tambahkan kode unik
        description: 'Toko utama perusahaan',
        address: 'Jl. Utama No. 1, Jakarta',
        phone: '021-12345678',
        email: 'tokopusat@toko.com',
        status: 'ACTIVE',
      },
      {
        name: 'Toko Cabang Barat',
        code: 'TK002', // Tambahkan kode unik
        description: 'Toko cabang di wilayah barat',
        address: 'Jl. Barat Raya No. 10, Jakarta',
        phone: '021-87654321',
        email: 'toko.barat@toko.com',
        status: 'ACTIVE',
      },
      {
        name: 'Toko Cabang Timur',
        code: 'TK003', // Tambahkan kode unik
        description: 'Toko cabang di wilayah timur',
        address: 'Jl. Timur Indah No. 5, Jakarta',
        phone: '021-11223344',
        email: 'toko.timur@toko.com',
        status: 'ACTIVE',
      }
    ];

    for (const storeData of storesToCreate) {
      await prisma.store.create({
        data: storeData,
      });
      console.log(`Toko "${storeData.name}" berhasil dibuat`);
    }
    console.log('Tokok-toko berhasil dibuat');
  } else {
    console.log('Toko sudah ada');
  }

  // Buat member "Pelanggan Umum" untuk setiap toko
  const allStores = await prisma.store.findMany();
  for (const store of allStores) {
    const existingGeneralMember = await prisma.member.findFirst({
      where: {
        storeId: store.id,
        name: 'Pelanggan Umum',
      },
    });

    if (!existingGeneralMember) {
      await prisma.member.create({
        data: {
          storeId: store.id,
          name: 'Pelanggan Umum',
          code: `UMUM-${store.code}`, // Unique code for the general member
          phone: '0000', // Default phone
          address: 'N/A',
          membershipType: 'GENERAL', // Special type for general customer
          discount: 0,
        },
      });
      console.log(`Member 'Pelanggan Umum' dibuat untuk toko ${store.name}`);
    } else {
      console.log(`Member 'Pelanggan Umum' sudah ada untuk toko ${store.name}`);
    }
  }

  console.log('Database seeding selesai!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });