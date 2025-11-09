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

  // Create a default general customer
  const generalCustomer = await prisma.member.upsert({
    where: { phone: '000' },
    update: {},
    create: {
      name: 'Pelanggan Umum',
      phone: '000',
      address: '-',
      membershipType: 'GENERAL',
      discount: 0,
    },
  });

  // Create default products with price tiers
  const product1 = await prisma.product.upsert({
    where: { productCode: 'BAJU001' },
    update: {},
    create: {
      name: 'Kemeja Putih',
      productCode: 'BAJU001',
      stock: 50,
      purchasePrice: 85000,
      categoryId: baju.id,
      supplierId: supplier1.id,
      description: 'Kemeja putih berkualitas',
    },
  });

  // Delete existing price tiers for the product to ensure idempotency
  await prisma.priceTier.deleteMany({
    where: { productId: product1.id },
  });

  // Create price tiers for product1
  await prisma.priceTier.createMany({
    data: [
      {
        productId: product1.id,
        minQty: 1,
        maxQty: 3,
        price: 120000,
      },
      {
        productId: product1.id,
        minQty: 4,
        maxQty: 6,
        price: 115000,
      },
      {
        productId: product1.id,
        minQty: 7,
        maxQty: null, // No upper limit
        price: 110000,
      }
    ]
  });

  const product2 = await prisma.product.upsert({
    where: { productCode: 'CEL001' },
    update: {},
    create: {
      name: 'Jeans Biru',
      productCode: 'CEL001',
      stock: 30,
      purchasePrice: 100000,
      categoryId: celana.id,
      supplierId: supplier1.id,
      description: 'Jeans biru model terbaru',
    },
  });

  // Delete existing price tiers for the product to ensure idempotency
  await prisma.priceTier.deleteMany({
    where: { productId: product2.id },
  });

  // Create price tiers for product2
  await prisma.priceTier.createMany({
    data: [
      {
        productId: product2.id,
        minQty: 1,
        maxQty: 3,
        price: 150000,
      },
      {
        productId: product2.id,
        minQty: 4,
        maxQty: 6,
        price: 145000,
      },
      {
        productId: product2.id,
        minQty: 7,
        maxQty: null, // No upper limit
        price: 140000,
      }
    ]
  });

  const product3 = await prisma.product.upsert({
    where: { productCode: 'AKS001' },
    update: {},
    create: {
      name: 'Topi Snapback',
      productCode: 'AKS001',
      stock: 20,
      purchasePrice: 45000,
      categoryId: aksesoris.id,
      supplierId: supplier2.id,
      description: 'Topi snapback fashion',
    },
  });

  // Delete existing price tiers for the product to ensure idempotency
  await prisma.priceTier.deleteMany({
    where: { productId: product3.id },
  });

  // Create price tiers for product3
  await prisma.priceTier.createMany({
    data: [
      {
        productId: product3.id,
        minQty: 1,
        maxQty: 2,
        price: 75000,
      },
      {
        productId: product3.id,
        minQty: 3,
        maxQty: 5,
        price: 70000,
      },
      {
        productId: product3.id,
        minQty: 6,
        maxQty: null, // No upper limit
        price: 65000,
      }
    ]
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