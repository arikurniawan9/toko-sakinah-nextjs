// app/api/receivables/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const receivableId = params.id;
    const body = await request.json();
    const { amountPaid, paymentMethod = 'CASH' } = body;

    if (amountPaid <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran harus lebih besar dari 0' }, { status: 400 });
    }

    // Ambil data hutang dengan verifikasi bahwa itu milik toko yang sesuai
    const receivable = await prisma.receivable.findUnique({
      where: {
        id: receivableId,
        storeId: session.user.storeId, // Hanya bisa mengakses receivable dari toko sendiri
      },
      include: {
        sale: {
          include: {
            saleDetails: true
          }
        }
      }
    });

    if (!receivable) {
      return NextResponse.json({ error: 'Hutang tidak ditemukan atau bukan milik toko Anda' }, { status: 404 });
    }

    // Hitung jumlah yang masih harus dibayar
    const remainingAmount = receivable.amountDue - receivable.amountPaid;

    if (amountPaid > remainingAmount) {
      return NextResponse.json({ 
        error: `Jumlah pembayaran melebihi jumlah hutang yang tersisa. Maksimal: ${remainingAmount}` 
      }, { status: 400 });
    }

    // Update jumlah yang sudah dibayar
    const newAmountPaid = receivable.amountPaid + amountPaid;
    let newStatus = receivable.status;

    // Jika jumlah yang dibayar mencapai total hutang, ubah status menjadi PAID
    if (newAmountPaid >= receivable.amountDue) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    // Update status hutang
    const updatedReceivable = await prisma.receivable.update({
      where: {
        id: receivableId,
        storeId: session.user.storeId, // Pastikan hanya mengupdate receivable dari toko sendiri
      },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
      },
      include: {
        sale: true
      }
    });

    // Jika pelunasan penuh, update status transaksi menjadi PAID
    if (newStatus === 'PAID') {
      await prisma.sale.update({
        where: {
          id: receivable.saleId,
          storeId: session.user.storeId, // Pastikan hanya mengupdate sale dari toko sendiri
        },
        data: { status: 'PAID' }
      });
    }

    return NextResponse.json({
      ...updatedReceivable,
      remainingAmount: receivable.amountDue - newAmountPaid
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating receivable:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status hutang' }, { status: 500 });
  }
}