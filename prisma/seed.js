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

  // Buat user warehouse (jika belum ada)
  const existingWarehouse = await prisma.user.findUnique({
    where: { username: 'warehouse' }
  });

  if (!existingWarehouse) {
    await prisma.user.create({
      data: {
        name: 'Admin Gudang',
        username: 'warehouse',
        employeeNumber: 'WH001',
        gender: 'Laki-laki',
        phone: '081234567891',
        password: await bcrypt.hash('password123', 10),
        role: 'WAREHOUSE',
        status: 'AKTIF',
      },
    });
    console.log('Akun warehouse berhasil dibuat');
  } else {
    console.log('Akun warehouse sudah ada');
  }

  // Buat beberapa toko (jika belum ada)
  const existingStore = await prisma.store.findFirst();

  if (!existingStore) {
    await prisma.store.create({
      data: {
        name: 'Toko Pusat',
        code: 'TK001', // Tambahkan kode unik
        description: 'Toko utama perusahaan',
        address: 'Jl. Utama No. 1, Jakarta',
        phone: '021-12345678',
        email: 'tokopusat@toko.com',
        status: 'ACTIVE',
      },
    });

    await prisma.store.create({
      data: {
        name: 'Toko Cabang Barat',
        code: 'TK002', // Tambahkan kode unik
        description: 'Toko cabang di wilayah barat',
        address: 'Jl. Barat Raya No. 10, Jakarta',
        phone: '021-87654321',
        email: 'toko.barat@toko.com',
        status: 'ACTIVE',
      },
    });

    await prisma.store.create({
      data: {
        name: 'Toko Cabang Timur',
        code: 'TK003', // Tambahkan kode unik
        description: 'Toko cabang di wilayah timur',
        address: 'Jl. Timur Indah No. 5, Jakarta',
        phone: '021-11223344',
        email: 'toko.timur@toko.com',
        status: 'ACTIVE',
      },
    });
    console.log('Toko-toko berhasil dibuat');
  } else {
    console.log('Toko sudah ada');
  }

  // Buat user admin toko (jika belum ada)
  const existingAdminToko = await prisma.user.findUnique({
    where: { username: 'admintoko' }
  });

  if (!existingAdminToko) {
    const adminToko = await prisma.user.create({
      data: {
        name: 'Admin Toko',
        username: 'admintoko',
        employeeNumber: 'ADM001',
        gender: 'Perempuan',
        phone: '081234567892',
        password: await bcrypt.hash('password123', 10),
        role: 'ADMIN',
        status: 'AKTIF',
      },
    });

    // Ambil toko pertama untuk assign user
    const firstStore = await prisma.store.findFirst();
    if (firstStore) {
      await prisma.storeUser.create({
        data: {
          userId: adminToko.id,
          storeId: firstStore.id,
          role: 'ADMIN',
          status: 'AKTIF',
          assignedBy: (await prisma.user.findUnique({ where: { username: 'manager' } })).id,
        },
      });
    }
    console.log('Akun admin toko berhasil dibuat');
  } else {
    console.log('Akun admin toko sudah ada');
  }

  // Buat warehouse (jika belum ada)
  const existingWarehouseRecord = await prisma.warehouse.findFirst();
  if (!existingWarehouseRecord) {
    await prisma.warehouse.create({
      data: {
        name: 'Gudang Pusat',
        description: 'Gudang pusat untuk seluruh toko',
        address: 'Jl. Gudang No. 1, Jakarta',
        phone: '021-55566677',
      },
    });
    console.log('Gudang berhasil dibuat');
  } else {
    console.log('Gudang sudah ada');
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