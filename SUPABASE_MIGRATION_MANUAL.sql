/*
MIGRASI DATABASE UNTUK SISTEM MULTI-TENANT TOKO SAKINAH
=======================================================

File ini berisi semua perintah SQL yang diperlukan untuk membuat struktur database 
multi-tenant di Supabase. Jalankan perintah-perintah berikut di SQL Editor Supabase.

Langkah-langkah:
1. Akses SQL Editor di panel Supabase
2. Paste dan eksekusi semua perintah di bawah ini
3. Setelah selesai, tabel-tabel multi-tenant akan siap digunakan
*/

-- 1. CREATE TABLE "Store"
CREATE TABLE IF NOT EXISTS "Store" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- 2. CREATE TABLE "StoreUser"
CREATE TABLE IF NOT EXISTS "StoreUser" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    CONSTRAINT "StoreUser_pkey" PRIMARY KEY ("id")
);

-- 3. CREATE TABLE "Warehouse"
CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'Gudang Pusat',
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- 4. CREATE TABLE "WarehouseProduct"
CREATE TABLE IF NOT EXISTS "WarehouseProduct" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarehouseProduct_pkey" PRIMARY KEY ("id")
);

-- 5. CREATE TABLE "WarehouseDistribution"
CREATE TABLE IF NOT EXISTS "WarehouseDistribution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "warehouseId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "notes" TEXT,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distributedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarehouseDistribution_pkey" PRIMARY KEY ("id")
);

-- 6. Tambahkan kolom storeId ke tabel-tabel eksisting jika belum ada
-- Untuk Category
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Category' AND column_name = 'storeId') THEN
        ALTER TABLE "Category" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Product
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'storeId') THEN
        ALTER TABLE "Product" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Supplier
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Supplier' AND column_name = 'storeId') THEN
        ALTER TABLE "Supplier" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Member
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Member' AND column_name = 'storeId') THEN
        ALTER TABLE "Member" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Sale
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Sale' AND column_name = 'storeId') THEN
        ALTER TABLE "Sale" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Receivable
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receivable' AND column_name = 'storeId') THEN
        ALTER TABLE "Receivable" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk SaleDetail
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SaleDetail' AND column_name = 'storeId') THEN
        ALTER TABLE "SaleDetail" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk TempCart
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'TempCart' AND column_name = 'storeId') THEN
        ALTER TABLE "TempCart" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Purchase
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'storeId') THEN
        ALTER TABLE "Purchase" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk PurchaseItem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PurchaseItem' AND column_name = 'storeId') THEN
        ALTER TABLE "PurchaseItem" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk SuspendedSale
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SuspendedSale' AND column_name = 'storeId') THEN
        ALTER TABLE "SuspendedSale" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Setting
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Setting' AND column_name = 'storeId') THEN
        ALTER TABLE "Setting" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk AuditLog
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AuditLog' AND column_name = 'storeId') THEN
        ALTER TABLE "AuditLog" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk ExpenseCategory
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpenseCategory' AND column_name = 'storeId') THEN
        ALTER TABLE "ExpenseCategory" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- Untuk Expense
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expense' AND column_name = 'storeId') THEN
        ALTER TABLE "Expense" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 's1_temp';
    END IF;
END $$;

-- 7. Tambahkan FOREIGN KEY CONSTRAINTS
-- Tambahkan constraint untuk StoreUser
ALTER TABLE IF EXISTS "StoreUser" 
ADD CONSTRAINT "StoreUser_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "StoreUser" 
ADD CONSTRAINT "StoreUser_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tambahkan constraint untuk WarehouseProduct
ALTER TABLE IF EXISTS "WarehouseProduct" 
ADD CONSTRAINT "WarehouseProduct_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "Product"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WarehouseProduct" 
ADD CONSTRAINT "WarehouseProduct_warehouseId_fkey" 
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tambahkan constraint untuk WarehouseDistribution  
ALTER TABLE IF EXISTS "WarehouseDistribution" 
ADD CONSTRAINT "WarehouseDistribution_warehouseId_fkey" 
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WarehouseDistribution" 
ADD CONSTRAINT "WarehouseDistribution_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WarehouseDistribution" 
ADD CONSTRAINT "WarehouseDistribution_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "Product"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WarehouseDistribution" 
ADD CONSTRAINT "WarehouseDistribution_distributedBy_fkey" 
FOREIGN KEY ("distributedBy") REFERENCES "User"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tambahkan constraint untuk tabel-tabel lain
ALTER TABLE IF EXISTS "Category" 
ADD CONSTRAINT "Category_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Product" 
ADD CONSTRAINT "Product_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Supplier" 
ADD CONSTRAINT "Supplier_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Member" 
ADD CONSTRAINT "Member_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Sale" 
ADD CONSTRAINT "Sale_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Receivable" 
ADD CONSTRAINT "Receivable_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "SaleDetail" 
ADD CONSTRAINT "SaleDetail_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "TempCart" 
ADD CONSTRAINT "TempCart_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Purchase" 
ADD CONSTRAINT "Purchase_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "PurchaseItem" 
ADD CONSTRAINT "PurchaseItem_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "SuspendedSale" 
ADD CONSTRAINT "SuspendedSale_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Setting" 
ADD CONSTRAINT "Setting_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "AuditLog" 
ADD CONSTRAINT "AuditLog_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "ExpenseCategory" 
ADD CONSTRAINT "ExpenseCategory_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Expense" 
ADD CONSTRAINT "Expense_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Tambahkan INDEXES
CREATE INDEX IF NOT EXISTS "StoreUser_userId_idx" ON "StoreUser"("userId");
CREATE INDEX IF NOT EXISTS "StoreUser_storeId_idx" ON "StoreUser"("storeId");
CREATE INDEX IF NOT EXISTS "WarehouseProduct_warehouseId_idx" ON "WarehouseProduct"("warehouseId");
CREATE INDEX IF NOT EXISTS "WarehouseDistribution_storeId_idx" ON "WarehouseDistribution"("storeId");
CREATE INDEX IF NOT EXISTS "Category_storeId_idx" ON "Category"("storeId");
CREATE INDEX IF NOT EXISTS "Product_storeId_idx" ON "Product"("storeId");
CREATE INDEX IF NOT EXISTS "Supplier_storeId_idx" ON "Supplier"("storeId");
CREATE INDEX IF NOT EXISTS "Member_storeId_idx" ON "Member"("storeId");
CREATE INDEX IF NOT EXISTS "Sale_storeId_idx" ON "Sale"("storeId");
CREATE INDEX IF NOT EXISTS "Receivable_storeId_idx" ON "Receivable"("storeId");
CREATE INDEX IF NOT EXISTS "SaleDetail_storeId_idx" ON "SaleDetail"("storeId");
CREATE INDEX IF NOT EXISTS "TempCart_storeId_idx" ON "TempCart"("storeId");
CREATE INDEX IF NOT EXISTS "Purchase_storeId_idx" ON "Purchase"("storeId");
CREATE INDEX IF NOT EXISTS "PurchaseItem_storeId_idx" ON "PurchaseItem"("storeId");
CREATE INDEX IF NOT EXISTS "SuspendedSale_storeId_idx" ON "SuspendedSale"("storeId");
CREATE INDEX IF NOT EXISTS "Setting_storeId_idx" ON "Setting"("storeId");
CREATE INDEX IF NOT EXISTS "AuditLog_storeId_idx" ON "AuditLog"("storeId");
CREATE INDEX IF NOT EXISTS "ExpenseCategory_storeId_idx" ON "ExpenseCategory"("storeId");
CREATE INDEX IF NOT EXISTS "Expense_storeId_idx" ON "Expense"("storeId");

-- 9. Tambahkan UNIQUE Constraints (dengan storeId)
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_storeId_key" ON "Category"("name", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_productCode_storeId_key" ON "Product"("productCode", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_name_storeId_key" ON "Supplier"("name", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_phone_storeId_key" ON "Member"("phone", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_invoiceNumber_storeId_key" ON "Sale"("invoiceNumber", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_storeId_key" ON "Setting"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_name_storeId_key" ON "ExpenseCategory"("name", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "StoreUser_userId_storeId_key" ON "StoreUser"("userId", "storeId");

-- 10. Update sample values (ganti dari default temporary)
-- Anda bisa ubah ini sesuai kebutuhan
UPDATE "Category" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Product" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Supplier" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Member" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Sale" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Receivable" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "SaleDetail" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "TempCart" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Purchase" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "PurchaseItem" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "SuspendedSale" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Setting" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "AuditLog" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "ExpenseCategory" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';
UPDATE "Expense" SET "storeId" = 's1_default_store' WHERE "storeId" = 's1_temp';

/*
CATATAN PENTING:
Setelah migrasi selesai, Anda perlu:

1. Pastikan tabel 'User' sudah ada (biasanya dibuat oleh Auth Supabase)
2. Buat akun MANAGER pertama (bisa melalui register-manager page)
3. Test login sebagai MANAGER di http://localhost:3000/login/manager
4. Akses http://localhost:3000/manager setelah login

Sistem sekarang siap digunakan dengan fitur multi-tenant.
*/