/*
  Warnings:

  - You are about to drop the column `additionalDiscount` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `SaleDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "additionalDiscount",
DROP COLUMN "discount";

-- AlterTable
ALTER TABLE "SaleDetail" DROP COLUMN "discount";

-- AlterTable
ALTER TABLE "WarehouseDistribution" ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE INDEX "WarehouseDistribution_invoiceNumber_idx" ON "WarehouseDistribution"("invoiceNumber");
