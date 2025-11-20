-- MIGRASI DATABASE UNTUK SISTEM MULTI-TENANT TOKO SAKINAH
-- Jalankan perintah-perintah berikut satu per satu di Supabase SQL Editor

-- 1. HAPUS TABEL JIKA ADA (opsional, hanya jika perlu setup ulang)
-- DROP TABLE IF EXISTS "StoreUser" CASCADE;
-- DROP TABLE IF EXISTS "Store" CASCADE;
-- DROP TABLE IF EXISTS "WarehouseDistribution" CASCADE;
-- DROP TABLE IF EXISTS "WarehouseProduct" CASCADE;
-- DROP TABLE IF EXISTS "Warehouse" CASCADE;
-- HAPUS TABEL LAIN SESUAI URUTAN DEPENDENSI...

-- 2. BUAT TABEL-TABEL BARU

-- Tabel: Store
CREATE TABLE IF NOT EXISTS "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- Tabel: StoreUser
CREATE TABLE IF NOT EXISTS "StoreUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    CONSTRAINT "StoreUser_pkey" PRIMARY KEY ("id")
);

-- Tabel: Warehouse
CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Gudang Pusat',
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- Tabel: WarehouseProduct
CREATE TABLE IF NOT EXISTS "WarehouseProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WarehouseProduct_pkey" PRIMARY KEY ("id")
);

-- Tabel: WarehouseDistribution
CREATE TABLE IF NOT EXISTS "WarehouseDistribution" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WarehouseDistribution_pkey" PRIMARY KEY ("id")
);

-- PERBAIKAN TABEL-TABEL YANG SUDAH ADA DENGAN MENAMBAHKAN storeId

-- Tambah kolom storeId ke tabel-tabel yang ada jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Category' AND column_name = 'storeId') THEN
        ALTER TABLE "Category" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'storeId') THEN
        ALTER TABLE "Product" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Supplier' AND column_name = 'storeId') THEN
        ALTER TABLE "Supplier" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Member' AND column_name = 'storeId') THEN
        ALTER TABLE "Member" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Sale' AND column_name = 'storeId') THEN
        ALTER TABLE "Sale" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receivable' AND column_name = 'storeId') THEN
        ALTER TABLE "Receivable" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SaleDetail' AND column_name = 'storeId') THEN
        ALTER TABLE "SaleDetail" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'TempCart' AND column_name = 'storeId') THEN
        ALTER TABLE "TempCart" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'storeId') THEN
        ALTER TABLE "Purchase" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PurchaseItem' AND column_name = 'storeId') THEN
        ALTER TABLE "PurchaseItem" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SuspendedSale' AND column_name = 'storeId') THEN
        ALTER TABLE "SuspendedSale" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Setting' AND column_name = 'storeId') THEN
        ALTER TABLE "Setting" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AuditLog' AND column_name = 'storeId') THEN
        ALTER TABLE "AuditLog" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpenseCategory' AND column_name = 'storeId') THEN
        ALTER TABLE "ExpenseCategory" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expense' AND column_name = 'storeId') THEN
        ALTER TABLE "Expense" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'default_store_id';
    END IF;
END $$;

-- Tambahkan constraint dan index yang diperlukan
-- Contoh untuk Category:
CREATE INDEX IF NOT EXISTS "Category_storeId_idx" ON "Category"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_storeId_key" ON "Category"("name", "storeId");

-- Tambahkan foreign key constraints
-- Contoh:
-- ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ULANGI UNTUK SEMUA TABEL YANG BERGANTUNG PADA STORE

-- Tambahkan default value yang tepat (ini hanya placeholder, nanti bisa diupdate ke value yang benar)
UPDATE "Category" SET "storeId" = 's1' WHERE "storeId" = 'default_store_id';
UPDATE "Product" SET "storeId" = 's1' WHERE "storeId" = 'default_store_id';
UPDATE "Supplier" SET "storeId" = 's1' WHERE "storeId" = 'default_store_id';
-- dan seterusnya untuk semua tabel

-- CATATAN: KODE DI ATAS ADALAH CONTOH, ANDA HARUS MENGISI DENGAN NILAI STORE_ID REAL SESUAI KEBUTUHAN