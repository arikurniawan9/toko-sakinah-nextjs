// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default categories
  const baju = await prisma.category.upsert({
    where: { name: 'Baju' },
    update: {},
    create: {
      name: 'Baju',
      description: 'Berbagai jenis baju',
    },
  });

  const celana = await prisma.category.upsert({
    where: { name: 'Celana' },
    update: {},
    create: {
      name: 'Celana',
      description: 'Berbagai jenis celana',
    },
  });

  const aksesoris = await prisma.category.upsert({
    where: { name: 'Aksesoris' },
    update: {},
    create: {
      name: 'Aksesoris',
      description: 'Aksesoris pelengkap pakaian',
    },
  });

  // Create default suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { name: 'Supplier Utama' },
    update: {},
    create: {
      name: 'Supplier Utama',
      address: 'Jl. Utama No. 1',
      phone: '081234567890',
      email: 'contact@supplierutama.com',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { name: 'Supplier Baru' },
    update: {},
    create: {
      name: 'Supplier Baru',
      address: 'Jl. Baru No. 2',
      phone: '082345678901',
      email: 'contact@supplierbaru.com',
    },
  });

  // Create default members
  const silverMember = await prisma.member.upsert({
    where: { phone: '081111111111' },
    update: {},
    create: {
      name: 'Member Silver',
      phone: '081111111111',
      address: 'Jl. Member No. 1',
      membershipType: 'SILVER',
      discount: 3, // 3% discount
    },
  });

  const goldMember = await prisma.member.upsert({
    where: { phone: '082222222222' },
    update: {},
    create: {
      name: 'Member Gold',
      phone: '082222222222',
      address: 'Jl. Member No. 2',
      membershipType: 'GOLD',
      discount: 5, // 5% discount
    },
  });

  const platinumMember = await prisma.member.upsert({
    where: { phone: '083333333333' },
    update: {},
    create: {
      name: 'Member Platinum',
      phone: '083333333333',
      address: 'Jl. Member No. 3',
      membershipType: 'PLATINUM',
      discount: 10, // 10% discount
    },
  });

  // Create default products
  const product1 = await prisma.product.upsert({
    where: { productCode: 'BAJU001' },
    update: {},
    create: {
      name: 'Kemeja Putih',
      productCode: 'BAJU001',
      stock: 50,
      purchasePrice: 85000,
      sellingPrice: 120000,
      discount1_3: 1000, // Default discount of 1000 for qty 1-3
      discount4_6: 5000, // Discount of 5000 for qty 4-6
      discountMore: 8000, // Discount of 8000 for qty >6
      categoryId: baju.id,
      supplierId: supplier1.id,
      image: '/uploads/kemeja-putih.jpg',
    },
  });

  const product2 = await prisma.product.upsert({
    where: { productCode: 'CEL001' },
    update: {},
    create: {
      name: 'Jeans Biru',
      productCode: 'CEL001',
      stock: 30,
      purchasePrice: 100000,
      sellingPrice: 150000,
      discount1_3: 1000,
      discount4_6: 7000,
      discountMore: 10000,
      categoryId: celana.id,
      supplierId: supplier1.id,
      image: '/uploads/jeans-biru.jpg',
    },
  });

  const product3 = await prisma.product.upsert({
    where: { productCode: 'AKS001' },
    update: {},
    create: {
      name: 'Topi Snapback',
      productCode: 'AKS001',
      stock: 20,
      purchasePrice: 45000,
      sellingPrice: 75000,
      discount1_3: 1000,
      discount4_6: 3000,
      categoryId: aksesoris.id,
      supplierId: supplier2.id,
      image: '/uploads/topi-snapback.jpg',
    },
  });

  // Hash passwords for users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('kasir123', 10);
  const attendantPassword = await bcrypt.hash('pelayan123', 10);

  // Create default users (admin, cashier, attendant)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin Toko',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      name: 'Kasir Utama',
      username: 'kasir',
      password: cashierPassword,
      role: 'CASHIER',
    },
  });

  const attendantUser = await prisma.user.upsert({
    where: { username: 'pelayan' },
    update: {},
    create: {
      name: 'Pelayan Toko',
      username: 'pelayan',
      password: attendantPassword,
      role: 'ATTENDANT',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });