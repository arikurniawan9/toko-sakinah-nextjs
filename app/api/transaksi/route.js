// app/api/transaksi/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import { logCreate } from '@/lib/auditLogger';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ambil query parameter
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Buat filter berdasarkan memberId jika disediakan
    const filter = {};
    if (memberId) {
      filter.memberId = memberId;
    }

    // Ambil transaksi dengan filter dan pagination
    const transactions = await prisma.sale.findMany({
      where: filter,
      include: {
        cashier: {
          select: {
            name: true,
            username: true,
          }
        },
        attendant: {
          select: {
            name: true,
            username: true,
          }
        },
        member: {
          select: {
            name: true,
            phone: true,
            membershipType: true,
          }
        },
        saleDetails: {
          include: {
            product: {
              select: {
                name: true,
              }
            }
          }
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Ambil total count untuk pagination
    const totalCount = await prisma.sale.count({
      where: filter,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to generate a unique invoice number with format: YYYYMMDDXXXXX (year-month-date-5digit_urut)
async function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const datePrefix = `${year}${month}${day}`; // YYYYMMDD format

  // Hitung jumlah transaksi hari ini untuk menentukan nomor urut
  const todayStart = new Date(date);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(date);
  todayEnd.setHours(23, 59, 59, 999);

  // Hitung jumlah transaksi dengan format yang sama hari ini
  const existingSalesCount = await prisma.sale.count({
    where: {
      invoiceNumber: {
        startsWith: datePrefix
      },
      createdAt: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  });

  // Nomor urut dimulai dari 1 setiap hari
  const sequenceNumber = (existingSalesCount + 1).toString().padStart(5, '0'); // 5 digit dengan leading zeros
  
  // Gabungkan format: YYYYMMDD + 5 digit urut
  const invoiceNumber = `${datePrefix}${sequenceNumber}`;

  // Pastikan nomor unik (jaga-jaga jika ada konflik)
  const existingSale = await prisma.sale.findUnique({
    where: { invoiceNumber },
  });

  if (existingSale) {
    // Jika ternyata sudah ada (kemungkinan kecil), tambahkan angka acak kecil
    const randomSuffix = Math.floor(10 + Math.random() * 89).toString(); // 2 digit acak
    const altSequence = (parseInt(sequenceNumber) + parseInt(randomSuffix)).toString().padStart(5, '0');
    return `${datePrefix}${altSequence}`;
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
    paymentMethod, // Add payment method
    status // Tambahkan status transaksi
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  if (!attendantId) {
    return NextResponse.json({ error: 'Attendant must be selected' }, { status: 400 });
  }

  // Untuk transaksi hutang, memberId wajib
  if (!memberId && status === 'UNPAID') {
    return NextResponse.json({ error: 'Member must be selected for unpaid transactions' }, { status: 400 });
  }

  // Validasi stok sebelum membuat transaksi
  try {
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      
      if (!product) {
        return NextResponse.json({ error: `Produk dengan ID ${item.productId} tidak ditemukan.` }, { status: 400 });
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stok tidak cukup untuk produk "${product.name}". Stok tersedia: ${product.stock}, permintaan: ${item.quantity}.` 
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Error validating stock:', error);
    return NextResponse.json({ error: 'Gagal memvalidasi stok produk.' }, { status: 500 });
  }

  try {
    const newInvoiceNumber = await generateInvoiceNumber();

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Validasi ulang stok sebelum membuat transaksi untuk mencegah race condition
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stok tidak cukup untuk produk "${product.name}". Stok tersedia: ${product.stock}, permintaan: ${item.quantity}.`);
        }
      }

      // 2. Create the Sale record
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber: newInvoiceNumber,
          cashierId: session.user.id,
          attendantId: attendantId,
          memberId: memberId,
          paymentMethod: paymentMethod || 'CASH', // Include payment method, default to CASH
          total: total,
          discount: discount,
          additionalDiscount: additionalDiscount,
          tax: tax,
          payment: payment,
          change: change,
          status: status || 'PAID', // Gunakan status yang dikirim, default ke 'PAID'
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

      // 3. Update product stock - dilakukan untuk semua transaksi karena produk telah diberikan ke pelanggan
      for (const item of items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Tambahkan validasi tambahan bahwa stok tidak negatif
        if (updatedProduct.stock < 0) {
          throw new Error(`Stok produk ${updatedProduct.name} menjadi negatif setelah transaksi.`);
        }
      }

      // 4. Jika status UNPAID atau PARTIALLY_PAID, buat juga entri di Receivable
      if ((status === 'UNPAID' || status === 'PARTIALLY_PAID') && memberId) {
        // Sisa hutang adalah total - jumlah yang dibayar
        const remainingAmount = total - (payment || 0);
        if (remainingAmount > 0) {
          await tx.receivable.create({
            data: {
              saleId: newSale.id,
              memberId: memberId,
              amountDue: total, // Total asli
              amountPaid: payment || 0, // Jumlah yang sudah dibayar sebagai DP
              status: payment > 0 ? 'PARTIALLY_PAID' : 'UNPAID', // Status tergantung pembayaran
            }
          });
        }
      }

      return newSale;
    });

    // Log audit untuk pembuatan transaksi penjualan
    await logCreate(session.user.id, 'Sale', sale.id, sale, request);

    // Debug log untuk melihat invoice number yang dihasilkan
    console.log("Sale object created:", {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      status: sale.status
    });

    // Return the complete sale object including invoice number, which now includes saleDetails and product info
    // Make sure invoiceNumber is explicitly included in the response
    // Extract and return only the fields we need to ensure they are included
    return NextResponse.json({
      ...sale,
      // Explicitly include important fields
      invoiceNumber: sale.invoiceNumber,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create sale:', error);
    
    // Penanganan error yang lebih spesifik
    if (error.message && error.message.includes('stok menjadi negatif')) {
      return NextResponse.json({ 
        error: 'Gagal membuat transaksi: Stok produk tidak mencukupi karena transaksi lain sedang berlangsung.' 
      }, { status: 400 });
    }
    
    // Check for specific Prisma error for insufficient stock
    if (error.code === 'P2025' || (error.meta && error.meta.cause === 'Record to update not found.')) {
       return NextResponse.json({ error: 'Gagal membuat transaksi: Stok produk tidak mencukupi.' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Gagal membuat transaksi: ' + error.message || 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}