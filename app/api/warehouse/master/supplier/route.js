export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// Ini adalah endpoint untuk manajemen master supplier gudang
// Kita menggunakan toko dengan ID khusus untuk menyimpan master data gudang
const WAREHOUSE_STORE_ID = 'GM001'; // ID khusus untuk menyimpan master data
const WAREHOUSE_STORE_NAME = 'Master Data Gudang'; // Nama untuk store virtual

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Pastikan store master gudang sudah ada, jika belum maka buat
    let warehouseStore = await globalPrisma.store.findUnique({
      where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: WAREHOUSE_STORE_ID,
          name: WAREHOUSE_STORE_NAME,
          description: 'Store virtual untuk menyimpan master data gudang',
          status: 'ACTIVE'
        }
      });
    }

    // Ambil master supplier dari toko gudang
    const suppliers = await globalPrisma.supplier.findMany({
      where: {
        storeId: WAREHOUSE_STORE_ID
      },
      orderBy: {
        name: 'asc',
      },
      take: limit
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching master suppliers for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, contactPerson, address, phone, email } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json({ error: 'Kode dan nama supplier wajib diisi' }, { status: 400 });
    }

    // Pastikan store master gudang sudah ada, jika belum maka buat
    let warehouseStore = await globalPrisma.store.findUnique({
      where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: WAREHOUSE_STORE_ID,
          name: WAREHOUSE_STORE_NAME,
          description: 'Store virtual untuk menyimpan master data gudang',
          status: 'ACTIVE'
        }
      });
    }

    // Check if a supplier with the same code already exists in the warehouse master store
    const existingSupplier = await globalPrisma.supplier.findFirst({
      where: {
        code: code,
        storeId: WAREHOUSE_STORE_ID
      }
    });

    if (existingSupplier) {
      return NextResponse.json({ error: 'Supplier dengan kode yang sama sudah ada di master gudang' }, { status: 400 });
    }

    // Create the new master supplier in the warehouse store
    const newSupplier = await globalPrisma.supplier.create({
      data: {
        code,
        name,
        contactPerson: contactPerson || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        storeId: WAREHOUSE_STORE_ID
      }
    });

    return NextResponse.json({ supplier: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating master supplier for warehouse:', error);

    // Check if this is a Prisma-specific error
    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Store tidak ditemukan atau kendala lainnya' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}