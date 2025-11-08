/*
  Warnings:

  - You are about to drop the column `discount1_3` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discount4_6` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discountMore` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sellingPrice` on the `Product` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" INTEGER NOT NULL DEFAULT 0,
    "price_1_to_3" INTEGER NOT NULL DEFAULT 0,
    "price_4_to_9" INTEGER NOT NULL DEFAULT 0,
    "price_10_plus" INTEGER NOT NULL DEFAULT 0,
    "supplierId" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "id", "image", "name", "productCode", "purchasePrice", "stock", "supplierId", "updatedAt") SELECT "categoryId", "createdAt", "id", "image", "name", "productCode", "purchasePrice", "stock", "supplierId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
