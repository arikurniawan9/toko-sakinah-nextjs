// app/api/backup-restore/backup/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { storeId, backupType } = await request.json();

    // Validasi input
    if (!storeId) {
      return new Response(JSON.stringify({ error: 'Store ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah toko ada
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buat direktori backups jika belum ada
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Dapatkan timestamp untuk nama file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${storeId}_${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    // Ambil data dari tabel-tabel terkait dengan toko
    // Dalam sistem multi-tenant ini, kita perlu mencari data yang terkait dengan toko tertentu
    // Ini melalui tabel storeId yang ada di berbagai model

    // Dapatkan semua users yang terkait dengan toko ini
    const storeUsers = await prisma.storeUser.findMany({
      where: { storeId: storeId },
      include: { user: true }
    });

    // Dapatkan produk yang terkait dengan toko ini
    const products = await prisma.product.findMany({
      where: { storeId: storeId },
      include: {
        category: true,
        supplier: true,
        priceTiers: true
      }
    });

    // Dapatkan kategori produk
    const categories = await prisma.category.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan supplier
    const suppliers = await prisma.supplier.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan penjualan
    const sales = await prisma.sale.findMany({
      where: { storeId: storeId },
      include: {
        saleDetails: true,
        attendant: true,
        cashier: true,
        member: true
      }
    });

    // Dapatkan detail penjualan
    const saleDetails = await prisma.saleDetail.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan pembelian
    const purchases = await prisma.purchase.findMany({
      where: { storeId: storeId },
      include: {
        user: true,
        supplier: true,
        items: true
      }
    });

    // Dapatkan item pembelian
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan member
    const members = await prisma.member.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan pengeluaran
    const expenses = await prisma.expense.findMany({
      where: { storeId: storeId },
      include: {
        user: true,
        category: true
      }
    });

    // Dapatkan kategori pengeluaran
    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan keranjang sementara
    const tempCarts = await prisma.tempCart.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan log audit
    const auditLogs = await prisma.auditLog.findMany({
      where: { storeId: storeId }
    });

    // Dapatkan setting toko
    const settings = await prisma.setting.findMany({
      where: { storeId: storeId }
    });

    // Buat konten SQL untuk backup
    let sqlContent = `-- Backup data untuk toko: ${store.name} (${store.code})\n`;
    sqlContent += `-- Dibuat pada: ${new Date().toISOString()}\n`;
    sqlContent += `-- Store ID: ${storeId}\n\n`;

    // Tabel users (melalui storeUser)
    sqlContent += "-- Tabel users (via storeUser)\n";
    for (const storeUser of storeUsers) {
      const user = storeUser.user;
      sqlContent += `INSERT INTO users (id, name, username, employeeNumber, code, gender, address, phone, status, password, role, createdAt, updatedAt) VALUES ('${user.id.replace(/'/g, "''")}', '${user.name.replace(/'/g, "''")}', '${user.username.replace(/'/g, "''")}', '${user.employeeNumber ? user.employeeNumber.replace(/'/g, "''") : ''}', '${user.code ? user.code.replace(/'/g, "''") : ''}', '${user.gender ? user.gender.replace(/'/g, "''") : ''}', '${user.address ? user.address.replace(/'/g, "''") : ''}', '${user.phone ? user.phone.replace(/'/g, "''") : ''}', '${user.status.replace(/'/g, "''")}', '${user.password.replace(/'/g, "''")}', '${user.role.replace(/'/g, "''")}', '${user.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${user.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel categories
    sqlContent += "-- Tabel categories\n";
    for (const category of categories) {
      sqlContent += `INSERT INTO categories (id, storeId, name, description, createdAt, updatedAt) VALUES ('${category.id.replace(/'/g, "''")}', '${category.storeId.replace(/'/g, "''")}', '${category.name.replace(/'/g, "''")}', '${category.description ? category.description.replace(/'/g, "''") : ''}', '${category.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${category.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel suppliers
    sqlContent += "-- Tabel suppliers\n";
    for (const supplier of suppliers) {
      sqlContent += `INSERT INTO suppliers (id, storeId, name, address, phone, email, createdAt, updatedAt) VALUES ('${supplier.id.replace(/'/g, "''")}', '${supplier.storeId.replace(/'/g, "''")}', '${supplier.name.replace(/'/g, "''")}', '${supplier.address ? supplier.address.replace(/'/g, "''") : ''}', '${supplier.phone ? supplier.phone.replace(/'/g, "''") : ''}', '${supplier.email ? supplier.email.replace(/'/g, "''") : ''}', '${supplier.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${supplier.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel products
    sqlContent += "-- Tabel products\n";
    for (const product of products) {
      sqlContent += `INSERT INTO products (id, storeId, categoryId, name, productCode, stock, purchasePrice, supplierId, image, createdAt, updatedAt, description) VALUES ('${product.id.replace(/'/g, "''")}', '${product.storeId.replace(/'/g, "''")}', '${product.categoryId.replace(/'/g, "''")}', '${product.name.replace(/'/g, "''")}', '${product.productCode.replace(/'/g, "''")}', ${product.stock}, ${product.purchasePrice}, '${product.supplierId.replace(/'/g, "''")}', '${product.image ? product.image.replace(/'/g, "''") : ''}', '${product.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${product.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}', '${product.description ? product.description.replace(/'/g, "''") : ''}');\n`;
    }
    sqlContent += "\n";

    // Tabel priceTiers
    sqlContent += "-- Tabel priceTiers\n";
    for (const product of products) {
      for (const tier of product.priceTiers) {
        sqlContent += `INSERT INTO priceTiers (id, productId, minQty, maxQty, price) VALUES ('${tier.id.replace(/'/g, "''")}', '${tier.productId.replace(/'/g, "''")}', ${tier.minQty}, ${tier.maxQty ? tier.maxQty : 'NULL'}, ${tier.price});\n`;
      }
    }
    sqlContent += "\n";

    // Tabel members
    sqlContent += "-- Tabel members\n";
    for (const member of members) {
      sqlContent += `INSERT INTO members (id, storeId, code, name, phone, address, membershipType, discount, createdAt, updatedAt) VALUES ('${member.id.replace(/'/g, "''")}', '${member.storeId.replace(/'/g, "''")}', '${member.code.replace(/'/g, "''")}', '${member.name.replace(/'/g, "''")}', '${member.phone.replace(/'/g, "''")}', '${member.address ? member.address.replace(/'/g, "''") : ''}', '${member.membershipType.replace(/'/g, "''")}', ${member.discount}, '${member.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${member.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel sales
    sqlContent += "-- Tabel sales\n";
    for (const sale of sales) {
      sqlContent += `INSERT INTO sales (id, storeId, invoiceNumber, cashierId, attendantId, memberId, date, total, discount, additionalDiscount, tax, payment, change, status, createdAt, paymentMethod) VALUES ('${sale.id.replace(/'/g, "''")}', '${sale.storeId.replace(/'/g, "''")}', '${sale.invoiceNumber.replace(/'/g, "''")}', '${sale.cashierId.replace(/'/g, "''")}', '${sale.attendantId ? sale.attendantId.replace(/'/g, "''") : 'NULL'}', '${sale.memberId ? sale.memberId.replace(/'/g, "''") : 'NULL'}', '${sale.date.toISOString().replace('T', ' ').replace('Z', '')}', ${sale.total}, ${sale.discount}, ${sale.additionalDiscount}, ${sale.tax}, ${sale.payment}, ${sale.change}, '${sale.status.replace(/'/g, "''")}', '${sale.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${sale.paymentMethod.replace(/'/g, "''")}' );\n`;
    }
    sqlContent += "\n";

    // Tabel saleDetails
    sqlContent += "-- Tabel saleDetails\n";
    for (const saleDetail of saleDetails) {
      sqlContent += `INSERT INTO saleDetails (id, storeId, saleId, productId, quantity, price, discount, subtotal) VALUES ('${saleDetail.id.replace(/'/g, "''")}', '${saleDetail.storeId.replace(/'/g, "''")}', '${saleDetail.saleId.replace(/'/g, "''")}', '${saleDetail.productId.replace(/'/g, "''")}', ${saleDetail.quantity}, ${saleDetail.price}, ${saleDetail.discount}, ${saleDetail.subtotal});\n`;
    }
    sqlContent += "\n";

    // Tabel purchases
    sqlContent += "-- Tabel purchases\n";
    for (const purchase of purchases) {
      sqlContent += `INSERT INTO purchases (id, storeId, supplierId, userId, purchaseDate, totalAmount, status, createdAt, updatedAt) VALUES ('${purchase.id.replace(/'/g, "''")}', '${purchase.storeId.replace(/'/g, "''")}', '${purchase.supplierId.replace(/'/g, "''")}', '${purchase.userId.replace(/'/g, "''")}', '${purchase.purchaseDate.toISOString().replace('T', ' ').replace('Z', '')}', ${purchase.totalAmount}, '${purchase.status.replace(/'/g, "''")}', '${purchase.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${purchase.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel purchaseItems
    sqlContent += "-- Tabel purchaseItems\n";
    for (const purchaseItem of purchaseItems) {
      sqlContent += `INSERT INTO purchaseItems (id, storeId, purchaseId, productId, quantity, purchasePrice, subtotal) VALUES ('${purchaseItem.id.replace(/'/g, "''")}', '${purchaseItem.storeId.replace(/'/g, "''")}', '${purchaseItem.purchaseId.replace(/'/g, "''")}', '${purchaseItem.productId.replace(/'/g, "''")}', ${purchaseItem.quantity}, ${purchaseItem.purchasePrice}, ${purchaseItem.subtotal});\n`;
    }
    sqlContent += "\n";

    // Tabel expenseCategories
    sqlContent += "-- Tabel expenseCategories\n";
    for (const expCategory of expenseCategories) {
      sqlContent += `INSERT INTO expenseCategories (id, storeId, name, description, createdAt, updatedAt) VALUES ('${expCategory.id.replace(/'/g, "''")}', '${expCategory.storeId.replace(/'/g, "''")}', '${expCategory.name.replace(/'/g, "''")}', '${expCategory.description ? expCategory.description.replace(/'/g, "''") : ''}', '${expCategory.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${expCategory.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel expenses
    sqlContent += "-- Tabel expenses\n";
    for (const expense of expenses) {
      sqlContent += `INSERT INTO expenses (id, storeId, expenseCategoryId, amount, description, date, createdBy, createdAt, updatedAt) VALUES ('${expense.id.replace(/'/g, "''")}', '${expense.storeId.replace(/'/g, "''")}', '${expense.expenseCategoryId.replace(/'/g, "''")}', ${expense.amount}, '${expense.description ? expense.description.replace(/'/g, "''") : ''}', '${expense.date.toISOString().replace('T', ' ').replace('Z', '')}', '${expense.createdBy.replace(/'/g, "''")}', '${expense.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${expense.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel tempCarts
    sqlContent += "-- Tabel tempCarts\n";
    for (const tempCart of tempCarts) {
      sqlContent += `INSERT INTO tempCarts (id, storeId, attendantId, productId, quantity, createdAt) VALUES ('${tempCart.id.replace(/'/g, "''")}', '${tempCart.storeId.replace(/'/g, "''")}', '${tempCart.attendantId.replace(/'/g, "''")}', '${tempCart.productId.replace(/'/g, "''")}', ${tempCart.quantity}, '${tempCart.createdAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel auditLogs
    sqlContent += "-- Tabel auditLogs\n";
    for (const auditLog of auditLogs) {
      sqlContent += `INSERT INTO auditLogs (id, storeId, userId, action, entity, entityId, oldValue, newValue, ipAddress, userAgent, createdAt) VALUES ('${auditLog.id.replace(/'/g, "''")}', '${auditLog.storeId.replace(/'/g, "''")}', '${auditLog.userId ? auditLog.userId.replace(/'/g, "''") : 'NULL'}', '${auditLog.action.replace(/'/g, "''")}', '${auditLog.entity.replace(/'/g, "''")}', '${auditLog.entityId ? auditLog.entityId.replace(/'/g, "''") : 'NULL'}', '${auditLog.oldValue ? auditLog.oldValue.replace(/'/g, "''") : 'NULL'}', '${auditLog.newValue ? auditLog.newValue.replace(/'/g, "''") : 'NULL'}', '${auditLog.ipAddress ? auditLog.ipAddress.replace(/'/g, "''") : 'NULL'}', '${auditLog.userAgent ? auditLog.userAgent.replace(/'/g, "''") : 'NULL'}', '${auditLog.createdAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    // Tabel settings
    sqlContent += "-- Tabel settings\n";
    for (const setting of settings) {
      sqlContent += `INSERT INTO settings (id, storeId, shopName, address, phone, themeColor, createdAt, updatedAt) VALUES ('${setting.id.replace(/'/g, "''")}', '${setting.storeId.replace(/'/g, "''")}', '${setting.shopName ? setting.shopName.replace(/'/g, "''") : 'NULL'}', '${setting.address ? setting.address.replace(/'/g, "''") : 'NULL'}', '${setting.phone ? setting.phone.replace(/'/g, "''") : 'NULL'}', '${setting.themeColor ? setting.themeColor.replace(/'/g, "''") : 'NULL'}', '${setting.createdAt.toISOString().replace('T', ' ').replace('Z', '')}', '${setting.updatedAt.toISOString().replace('T', ' ').replace('Z', '')}');\n`;
    }
    sqlContent += "\n";

    sqlContent += "-- End of backup\n";

    // Simpan file backup
    fs.writeFileSync(filePath, sqlContent);

    return new Response(JSON.stringify({
      message: 'Backup created successfully',
      fileName: fileName,
      filePath: filePath,
      storeName: store.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}