// app/api/purchase/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET: Fetch a specific purchase by ID
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: params.id,
        storeId: session.user.storeId  // Hanya bisa mengakses pembelian dari toko sendiri
      },
      include: {
        supplier: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Pembelian tidak ditemukan' }, { status: 404 });
    }

    // Calculate total amount from items
    const totalAmount = purchase.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

    // Return purchase with calculated total
    return NextResponse.json({
      purchase: {
        ...purchase,
        totalAmount: totalAmount
      }
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a specific purchase (for status change or other updates)
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Get the current purchase to check for status changes
    const currentPurchase = await prisma.purchase.findUnique({
      where: {
        id: params.id,
        storeId: session.user.storeId  // Hanya bisa mengupdate pembelian dari toko sendiri
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!currentPurchase) {
      return NextResponse.json({ error: 'Pembelian tidak ditemukan' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      status: data.status // Only allow status update for now
    };

    // If purchaseDate is provided and valid, update it
    if (data.purchaseDate) {
      let purchaseDate;
      if (data.purchaseDate instanceof Date) {
        purchaseDate = data.purchaseDate;
      } else {
        const parsedDate = new Date(data.purchaseDate);
        if (!isNaN(parsedDate.getTime())) {
          purchaseDate = parsedDate;
        }
      }
      if (purchaseDate && !isNaN(purchaseDate.getTime())) {
        updateData.purchaseDate = purchaseDate;
      }
    }

    let updatedPurchase;

    // Handle status change to CANCELLED
    if (data.status === 'CANCELLED' && currentPurchase.status !== 'CANCELLED') {
      // In a transaction, update purchase status and revert product stock
      updatedPurchase = await prisma.$transaction(async (tx) => {
        // First, reduce product stock for each item in the purchase (reverse the original increment)
        for (const item of currentPurchase.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }

        // Update the purchase status
        const purchase = await tx.purchase.update({
          where: {
            id: params.id,
            storeId: session.user.storeId  // Pastikan hanya mengupdate pembelian dari toko sendiri
          },
          data: updateData,
          include: {
            supplier: true,
            user: true,
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return purchase;
      });
    } else if (data.status === 'COMPLETED' && currentPurchase.status === 'CANCELLED') {
      // Handle status change from CANCELLED to COMPLETED (reverse cancellation)
      updatedPurchase = await prisma.$transaction(async (tx) => {
        // First, increment product stock for each item in the purchase
        for (const item of currentPurchase.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }

        // Update the purchase status
        const purchase = await tx.purchase.update({
          where: {
            id: params.id,
            storeId: session.user.storeId  // Pastikan hanya mengupdate pembelian dari toko sendiri
          },
          data: updateData,
          include: {
            supplier: true,
            user: true,
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return purchase;
      });
    } else {
      // Regular status update (not cancellation or reinstatement)
      updatedPurchase = await prisma.purchase.update({
        where: {
          id: params.id,
          storeId: session.user.storeId  // Pastikan hanya mengupdate pembelian dari toko sendiri
        },
        data: updateData,
        include: {
          supplier: true,
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
    }

    // Calculate updated total
    const totalAmount = updatedPurchase.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

    return NextResponse.json({
      success: true,
      message: 'Status pembelian berhasil diperbarui',
      purchase: {
        ...updatedPurchase,
        totalAmount: totalAmount
      }
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a specific purchase
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the purchase with items to revert stock changes
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: params.id,
        storeId: session.user.storeId  // Hanya bisa menghapus pembelian dari toko sendiri
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Pembelian tidak ditemukan' }, { status: 404 });
    }

    // First, reduce stock for each item in the purchase
    for (const item of purchase.items) {
      await prisma.product.update({
        where: {
          id: item.productId
        },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    // Then delete the purchase and all related items
    await prisma.purchase.delete({
      where: {
        id: params.id,
        storeId: session.user.storeId  // Pastikan hanya menghapus pembelian dari toko sendiri
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pembelian berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}