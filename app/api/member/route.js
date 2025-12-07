// app/api/member/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { generateShortCode } from '@/lib/utils';

// GET: Mengambil semua member
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    // Determine the storeId from the user's session
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const baseWhereClause = {
      storeId: storeId,
    };

    const whereClause = search
      ? {
          ...baseWhereClause,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : baseWhereClause;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    // Periksa apakah permintaan datang dari komponen pemilihan member
    const url = new URL(request.url);
    const isSimple = url.searchParams.get('simple'); // Jika ada parameter simple, kembalikan hanya array members

    if (isSimple) {
      return NextResponse.json(members);
    }

    return NextResponse.json({
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST: Membuat member baru
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, address, membershipType } = body;

    // 1. Validasi input dasar
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon wajib diisi' }, 
        { status: 400 }
      );
    }
    
    // 2. Validasi format nomor telepon
    if (!/^\d{10,15}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Format nomor telepon tidak valid' }, 
        { status: 400 }
      );
    }

    // 3. Tentukan storeId dari sesi pengguna
    let storeId;
    if (session.user.role === 'MANAGER' || session.user.role === 'WAREHOUSE') {
      if (session.user.storeId) {
        storeId = session.user.storeId;
      } else {
        return NextResponse.json(
          { error: 'Silakan pilih toko terlebih dahulu' },
          { status: 400 }
        );
      }
    } else {
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          userId: session.user.id,
          status: 'AKTIF',
        },
        select: {
          storeId: true
        }
      });

      if (!storeUser) {
        return NextResponse.json(
          { error: 'User tidak memiliki akses ke toko manapun' },
          { status: 400 }
        );
      }
      storeId = storeUser.storeId;
    }
    
    // Jika tidak ada storeId, hentikan proses
    if (!storeId) {
        return NextResponse.json(
            { error: 'Tidak dapat menentukan toko untuk pengguna ini.' },
            { status: 403 }
        );
    }

    // 4. Cek apakah nomor telepon sudah terdaftar DI TOKO YANG SAMA
    const existingMember = await prisma.member.findUnique({
      where: { 
        phone_storeId: {
          phone: phone,
          storeId: storeId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar di toko ini' }, 
        { status: 400 }
      );
    }

    // 5. Generate kode unik untuk member
    let uniqueCode;
    let attempt = 0;
    const maxAttempts = 10; // Maximum attempts to generate unique code

    do {
      uniqueCode = generateShortCode('MEM');
      attempt++;

      // Check if code already exists for this store
      const existingCode = await prisma.member.findFirst({
        where: {
          code: uniqueCode,
          storeId: storeId
        }
      });

      if (!existingCode) {
        break; // Found unique code
      }
    } while (attempt < maxAttempts);

    if (attempt >= maxAttempts) {
      return NextResponse.json(
        { error: 'Gagal membuat kode unik, silakan coba lagi' },
        { status: 500 }
      );
    }

    const newMember = await prisma.member.create({
      data: {
        name,
        phone,
        address: address || null,
        membershipType: membershipType || 'SILVER', // Default to SILVER
        discount: membershipType === 'GOLD' ? 10 : membershipType === 'PLATINUM' ? 15 : 5, // Default 5% for SILVER
        code: uniqueCode,
        storeId: storeId // Assign to the appropriate store
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

// DELETE: Menghapus member
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Hapus satu member
      const member = await prisma.member.findUnique({
        where: { id },
      });

      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      await prisma.member.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Member deleted successfully' });
    } else {
      // Hapus multiple members
      const body = await request.json();
      const { ids } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'No member IDs provided' }, { status: 400 });
      }

      // Hapus multiple members sekaligus
      const deletedMembers = await prisma.member.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return NextResponse.json({
        message: `${deletedMembers.count} member(s) deleted successfully`,
      });
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}

// PUT: Mengupdate member
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, phone, address, membershipType, discount } = body;

    if (!id || !name || !phone) {
      return NextResponse.json(
        { error: 'ID, nama, dan nomor telepon wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi format nomor telepon
    if (!/^\d{10,15}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Format nomor telepon tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah member ada
    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cek apakah nomor telepon yang baru sudah digunakan oleh member lain di toko yang sama (kecuali member itu sendiri)
    const phoneConflict = await prisma.member.findFirst({
      where: {
        phone: phone,
        storeId: existingMember.storeId,
        id: { not: id }, // Tidak termasuk member yang sedang diupdate
      },
    });

    if (phoneConflict) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar di toko ini' },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name,
        phone,
        address: address || null,
        membershipType: membershipType || 'SILVER',
        discount: discount || 5,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}