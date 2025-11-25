/*
  Warnings:

  - Added the required column `code` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Supplier" ("address", "createdAt", "email", "id", "name", "phone", "storeId", "updatedAt") SELECT "address", "createdAt", "email", "id", "name", "phone", "storeId", "updatedAt" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE INDEX "Supplier_storeId_idx" ON "Supplier"("storeId");
CREATE UNIQUE INDEX "Supplier_code_storeId_key" ON "Supplier"("code", "storeId");
CREATE UNIQUE INDEX "Supplier_name_storeId_key" ON "Supplier"("name", "storeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
