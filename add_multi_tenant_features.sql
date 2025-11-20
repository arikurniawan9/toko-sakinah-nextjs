-- Migration: add_multi_tenant_features

-- Create tables for multi-tenant system

-- Table: Store
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

-- Table: StoreUser
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

-- Table: Warehouse
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

-- Table: WarehouseProduct
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

-- Table: WarehouseDistribution
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

-- Modify existing tables to add storeId
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Category' AND column_name = 'storeId') THEN
        ALTER TABLE "Category" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'storeId') THEN
        ALTER TABLE "Product" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Supplier' AND column_name = 'storeId') THEN
        ALTER TABLE "Supplier" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Member' AND column_name = 'storeId') THEN
        ALTER TABLE "Member" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Sale' AND column_name = 'storeId') THEN
        ALTER TABLE "Sale" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receivable' AND column_name = 'storeId') THEN
        ALTER TABLE "Receivable" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SaleDetail' AND column_name = 'storeId') THEN
        ALTER TABLE "SaleDetail" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'TempCart' AND column_name = 'storeId') THEN
        ALTER TABLE "TempCart" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Purchase' AND column_name = 'storeId') THEN
        ALTER TABLE "Purchase" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PurchaseItem' AND column_name = 'storeId') THEN
        ALTER TABLE "PurchaseItem" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SuspendedSale' AND column_name = 'storeId') THEN
        ALTER TABLE "SuspendedSale" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Setting' AND column_name = 'storeId') THEN
        ALTER TABLE "Setting" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AuditLog' AND column_name = 'storeId') THEN
        ALTER TABLE "AuditLog" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ExpenseCategory' AND column_name = 'storeId') THEN
        ALTER TABLE "ExpenseCategory" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expense' AND column_name = 'storeId') THEN
        ALTER TABLE "Expense" ADD COLUMN "storeId" TEXT NOT NULL DEFAULT 'store_not_set';
    END IF;
END $$;

-- Add indexes
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

-- Add foreign key constraints
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleDetail" ADD CONSTRAINT "SaleDetail_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TempCart" ADD CONSTRAINT "TempCart_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SuspendedSale" ADD CONSTRAINT "SuspendedSale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreUser" ADD CONSTRAINT "StoreUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreUser" ADD CONSTRAINT "StoreUser_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WarehouseProduct" ADD CONSTRAINT "WarehouseProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseProduct" ADD CONSTRAINT "WarehouseProduct_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WarehouseDistribution" ADD CONSTRAINT "WarehouseDistribution_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseDistribution" ADD CONSTRAINT "WarehouseDistribution_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseDistribution" ADD CONSTRAINT "WarehouseDistribution_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseDistribution" ADD CONSTRAINT "WarehouseDistribution_distributedBy_fkey" FOREIGN KEY ("distributedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update default values after creating foreign key constraints
UPDATE "Category" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Product" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Supplier" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Member" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Sale" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Receivable" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "SaleDetail" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "TempCart" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Purchase" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "PurchaseItem" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "SuspendedSale" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Setting" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "AuditLog" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "ExpenseCategory" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';
UPDATE "Expense" SET "storeId" = (SELECT "id" FROM "Store" LIMIT 1) WHERE "storeId" = 'store_not_set';

-- Add unique constraints with storeId
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_storeId_key" ON "Category"("name", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_productCode_storeId_key" ON "Product"("productCode", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_name_storeId_key" ON "Supplier"("name", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_phone_storeId_key" ON "Member"("phone", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_invoiceNumber_storeId_key" ON "Sale"("invoiceNumber", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_storeId_key" ON "Setting"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_name_storeId_key" ON "ExpenseCategory"("name", "storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "StoreUser_userId_storeId_key" ON "StoreUser"("userId", "storeId");

-- Trigger untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_Store_updated_at BEFORE UPDATE ON "Store" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_StoreUser_updated_at BEFORE UPDATE ON "StoreUser" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_Warehouse_updated_at BEFORE UPDATE ON "Warehouse" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_WarehouseProduct_updated_at BEFORE UPDATE ON "WarehouseProduct" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_WarehouseDistribution_updated_at BEFORE UPDATE ON "WarehouseDistribution" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();