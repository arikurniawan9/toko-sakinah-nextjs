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
    const { amountPaid, paymentMethod = 'CASH', referenceNumber } = body;

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
    // Jika ada referensi baru dan sebelumnya sudah ada referensi, tambahkan ke daftar referensi
    let updatedReferenceNumber = referenceNumber;
    if (referenceNumber && receivable.referenceNumber) {
      // Gabungkan referensi yang sudah ada dengan referensi baru, dipisahkan koma
      updatedReferenceNumber = `${receivable.referenceNumber},${referenceNumber}`;
    } else if (referenceNumber && !receivable.referenceNumber) {
      // Gunakan referensi baru jika tidak ada referensi sebelumnya
      updatedReferenceNumber = referenceNumber;
    } else if (!referenceNumber && receivable.referenceNumber) {
      // Gunakan referensi lama jika tidak ada referensi baru
      updatedReferenceNumber = receivable.referenceNumber;
    }

    const updatedReceivable = await prisma.receivable.update({
      where: {
        id: receivableId,
        storeId: session.user.storeId, // Pastikan hanya mengupdate receivable dari toko sendiri
      },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        ...(updatedReferenceNumber && { referenceNumber: updatedReferenceNumber }),
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

    // Ambil informasi transaksi terkait untuk keperluan struk
    const saleInfo = await prisma.sale.findUnique({
      where: { id: receivable.saleId },
      include: {
        cashier: true,
        attendant: true,
        member: true,
        saleDetails: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({
      ...updatedReceivable,
      sale: saleInfo,
      remainingAmount: receivable.amountDue - newAmountPaid
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating receivable:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status hutang' }, { status: 500 });
  }
}