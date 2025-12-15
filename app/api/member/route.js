// app/api/member/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { generateShortCode } from '@/lib/utils';

// GET: Mengambil semua member
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    const globalSearch = searchParams.get('global') === 'true';

    let baseWhereClause = {};
    if (!globalSearch) {
      // Ambil storeId dari session
      let storeId = session.user.storeId;

      // Untuk role ATTENDANT, jika tidak ada storeId, coba dapatkan dari storeUser
      if (!storeId && session.user.role === 'ATTENDANT') {
        const storeUser = await prisma.storeUser.findFirst({
          where: {
            userId: session.user.id,
            role: 'ATTENDANT',
            status: { in: ['AKTIF', 'ACTIVE'] }
          },
          select: {
            storeId: true
          }
        });

        if (storeUser && storeUser.storeId) {
          storeId = storeUser.storeId;
        } else {
          return NextResponse.json({ error: 'Pelayan tidak dikaitkan dengan toko manapun' }, { status: 400 });
        }
      } else if (!storeId) {
        return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
      }
      baseWhereClause.storeId = storeId;
    }

    const skip = (page - 1) * limit;

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
    const requestUrl = new URL(request.url);
    const isSimple = requestUrl.searchParams.get('simple'); // Jika ada parameter simple, kembalikan hanya array members

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

  if (!session || !['CASHIER', 'ADMIN', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, address, membershipType, discount } = body;

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

    // 3. Tentukan storeId dari sesi pengguna (untuk mencatat toko pembuatan member)
    let storeId;

    // Cek dulu apakah storeId langsung tersedia di session (untuk beberapa role seperti MANAGER)
    if (session.user.storeId) {
      storeId = session.user.storeId;
    } else {
      // Jika tidak langsung tersedia, cari relasi user dengan toko
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ['AKTIF', 'ACTIVE'] },
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

    // Konversi membershipType ke huruf kapital untuk konsistensi internal
    const normalizedMembershipType = (membershipType || 'SILVER').toUpperCase();

    // Jika discount tidak disediakan, hitung berdasarkan membershipType
    const calculatedDiscount = discount !== undefined && discount !== null
      ? Number(discount)
      : (normalizedMembershipType === 'GOLD' ? 4 : normalizedMembershipType === 'PLATINUM' ? 5 : 3);

    const newMember = await prisma.member.create({
      data: {
        name,
        phone,
        address: address || null,
        membershipType: normalizedMembershipType, // Gunakan format kapital untuk menyimpan
        discount: calculatedDiscount,
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
      // Dapatkan storeId dari sesi
      let storeId = session.user.storeId;

      // Untuk role ATTENDANT, jika tidak ada storeId, coba dapatkan dari storeUser
      if (!storeId && session.user.role === 'ATTENDANT') {
        const storeUser = await prisma.storeUser.findFirst({
          where: {
            userId: session.user.id,
            role: 'ATTENDANT',
            status: { in: ['AKTIF', 'ACTIVE'] }
          },
          select: {
            storeId: true
          }
        });

        if (storeUser && storeUser.storeId) {
          storeId = storeUser.storeId;
        } else {
          return NextResponse.json({ error: 'Pelayan tidak dikaitkan dengan toko manapun' }, { status: 400 });
        }
      } else if (!storeId) {
        return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
      }

      // Hapus satu member dari toko yang sesuai
      const member = await prisma.member.findUnique({
        where: {
          id,
          storeId: storeId, // Pastikan hanya menghapus member dari toko yang sesuai
        },
      });

      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      await prisma.member.delete({
        where: {
          id,
          storeId: storeId, // Pastikan hanya menghapus member dari toko yang sesuai
        },
      });

      return NextResponse.json({ message: 'Member deleted successfully' });
    } else {
      // Hapus multiple members
      const body = await request.json();
      const { ids } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'No member IDs provided' }, { status: 400 });
      }

      // Dapatkan storeId dari sesi
      let storeId = session.user.storeId;

      // Untuk role ATTENDANT, jika tidak ada storeId, coba dapatkan dari storeUser
      if (!storeId && session.user.role === 'ATTENDANT') {
        const storeUser = await prisma.storeUser.findFirst({
          where: {
            userId: session.user.id,
            role: 'ATTENDANT',
            status: { in: ['AKTIF', 'ACTIVE'] }
          },
          select: {
            storeId: true
          }
        });

        if (storeUser && storeUser.storeId) {
          storeId = storeUser.storeId;
        } else {
          return NextResponse.json({ error: 'Pelayan tidak dikaitkan dengan toko manapun' }, { status: 400 });
        }
      } else if (!storeId) {
        return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
      }

      // Hapus multiple members sekaligus hanya dari toko yang sesuai
      const deletedMembers = await prisma.member.deleteMany({
        where: {
          id: {
            in: ids,
          },
          storeId: storeId, // Pastikan hanya menghapus member dari toko yang sesuai
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

    // Dapatkan storeId dari session
    let storeId = session.user.storeId;

    // Untuk role ADMIN, jika tidak ada storeId, coba dapatkan dari storeUser
    if (!storeId && session.user.role === 'ADMIN') {
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          userId: session.user.id,
          role: 'ADMIN',
          status: { in: ['AKTIF', 'ACTIVE'] }
        },
        select: {
          storeId: true
        }
      });

      if (storeUser && storeUser.storeId) {
        storeId = storeUser.storeId;
      } else {
        return NextResponse.json({ error: 'Admin tidak dikaitkan dengan toko manapun' }, { status: 400 });
      }
    } else if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Cek apakah member ada di toko yang sesuai
    const existingMember = await prisma.member.findUnique({
      where: {
        id,
        storeId: storeId, // Hanya cari member di toko yang sesuai
      },
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

    // Konversi membershipType ke huruf kapital untuk konsistensi internal
    const normalizedMembershipType = (membershipType || 'SILVER').toUpperCase();

    // Jika discount tidak disediakan, hitung berdasarkan membershipType
    const calculatedDiscount = discount !== undefined && discount !== null
      ? Number(discount)
      : (normalizedMembershipType === 'GOLD' ? 4 : normalizedMembershipType === 'PLATINUM' ? 5 : 3);

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name,
        phone,
        address: address || null,
        membershipType: normalizedMembershipType, // Gunakan format kapital untuk menyimpan
        discount: calculatedDiscount,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}