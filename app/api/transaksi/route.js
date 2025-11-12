// app/api/transaksi/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

// Function to generate a unique 10-digit invoice number
async function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`; // YYMMDD format

  let isUnique = false;
  let invoiceNumber;

  // This loop is a safeguard against rare duplicate invoice numbers.
  // In a high-concurrency environment, a more robust solution like a dedicated sequence generator might be needed.
  while (!isUnique) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
    invoiceNumber = `${datePrefix}${randomSuffix}`;

    const existingSale = await prisma.sale.findUnique({
      where: { invoiceNumber },
    });

    if (!existingSale) {
      isUnique = true;
    }
  }
  return invoiceNumber;
}


export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    items,
    total,
    payment,
    change,
    tax,
    discount,
    additionalDiscount,
    memberId,
    attendantId,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }
  
  if (!attendantId) {
    return NextResponse.json({ error: 'Attendant must be selected' }, { status: 400 });
  }

  try {
    const newInvoiceNumber = await generateInvoiceNumber();

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create the Sale record
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber: newInvoiceNumber,
          cashierId: session.user.id,
          attendantId: attendantId,
          memberId: memberId,
          total: total,
          discount: discount,
          additionalDiscount: additionalDiscount,
          tax: tax,
          payment: payment,
          change: change,
          status: 'PAID',
          saleDetails: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          saleDetails: {
            include: {
              product: true,
            }
          }
        }
      });

      // 2. Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
      
      return newSale;
    });

    // Return the complete sale object, which now includes saleDetails and product info
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Failed to create sale:', error);
    // Check for specific Prisma error for insufficient stock
    if (error.code === 'P2025' || (error.meta && error.meta.cause === 'Record to update not found.')) {
       return NextResponse.json({ error: 'Failed to create sale: Insufficient stock for one or more items.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}