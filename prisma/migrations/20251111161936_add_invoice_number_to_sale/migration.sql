/*
  Warnings:

  - Added the required column `invoiceNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "attendantId" TEXT,
    "memberId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL,
    "additionalDiscount" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL,
    "payment" INTEGER NOT NULL,
    "change" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_attendantId_fkey" FOREIGN KEY ("attendantId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("additionalDiscount", "attendantId", "cashierId", "change", "createdAt", "date", "discount", "id", "memberId", "payment", "status", "tax", "total") SELECT "additionalDiscount", "attendantId", "cashierId", "change", "createdAt", "date", "discount", "id", "memberId", "payment", "status", "tax", "total" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
