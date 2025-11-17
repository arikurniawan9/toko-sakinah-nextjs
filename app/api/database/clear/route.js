import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const modelsToTruncate = [
    "AuditLog",
    "Expense",
    "ExpenseCategory",
    "PurchaseItem",
    "Purchase",
    "SaleDetail",
    "Receivable",
    "Sale",
    "SuspendedSale",
    "TempCart",
    "PriceTier",
    "Product",
    "Category",
    "Member",
    "Supplier",
];

export async function DELETE() {
    try {
        // We need to truncate in an order that respects foreign key constraints.
        // It's generally safer to truncate tables without foreign keys first,
        // or to use TRUNCATE ... CASCADE.
        // The order here is a best guess, but CASCADE should handle it.
        for (const model of modelsToTruncate) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${model}" RESTART IDENTITY CASCADE;`);
        }

        return NextResponse.json({ message: 'Application data cleared successfully' });

    } catch (error) {
        console.error('Failed to clear data:', error);
        return NextResponse.json({ error: 'Failed to clear data', details: error.message }, { status: 500 });
    }
}
