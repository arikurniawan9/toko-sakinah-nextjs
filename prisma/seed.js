// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai seeding database...");

  // 1. Buat User Manager (jika belum ada)
  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      name: "Admin Manager",
      username: "manager",
      employeeNumber: "MGR001",
      gender: "Laki-laki",
      phone: "081234567890",
      password: await bcrypt.hash("password123", 10),
      role: "MANAGER",
      status: "AKTIF",
    },
  });
  console.log("Akun manager dipastikan ada.");

  // 2. Buat User Gudang (jika belum ada)
  const warehouseUser = await prisma.user.upsert({
    where: { username: "gudang" },
    update: {},
    create: {
      name: "Petugas Gudang",
      username: "gudang",
      employeeNumber: "WH001",
      gender: "Laki-laki",
      phone: "081234567891",
      password: await bcrypt.hash("gudang123", 10),
      role: "WAREHOUSE",
      status: "AKTIF",
    },
  });
  console.log("Akun gudang dipastikan ada.");

  // 3. Buat Gudang Pusat (jika belum ada)
  const warehouse = await prisma.warehouse.upsert({
    where: { name: "Gudang Pusat" },
    update: {},
    create: {
      name: "Gudang Pusat",
      description: "Gudang pusat untuk distribusi ke toko-toko",
      status: "ACTIVE",
    },
  });
  console.log("Gudang Pusat dipastikan ada.");

  // 4. Buat Store Master untuk Gudang (jika belum ada)
  const masterStore = await prisma.store.upsert({
    where: { code: "GM001" },
    update: {},
    create: {
      code: "GM001",
      name: "Gudang Master",
      description: "Toko virtual untuk menyimpan data master produk gudang.",
      status: "ACTIVE",
    },
  });
  console.log("Store Master Gudang dipastikan ada.");

  console.log("Database seeding selesai!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });