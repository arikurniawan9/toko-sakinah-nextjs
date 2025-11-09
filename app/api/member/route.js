// app/api/member/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// Zod Schemas for Member
const memberSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama member wajib diisi' }),
  phone: z.string().trim().min(1, { message: 'Nomor telepon wajib diisi' }),
  address: z.string().trim().optional().nullable(),
  membershipType: z.enum(['SILVER', 'GOLD', 'PLATINUM'], {
    errorMap: () => ({ message: 'Tipe keanggotaan tidak valid' }),
  }),
  discount: z.number().int().min(0, 'Diskon tidak boleh negatif').max(100, 'Diskon tidak boleh lebih dari 100'),
});

const memberUpdateSchema = memberSchema.extend({
  id: z.string().min(1, { message: 'ID member wajib disediakan' }),
});

// GET /api/member - Get all members with pagination and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { membershipType: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const members = await prisma.member.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    const totalCount = await prisma.member.count({ where });
    
    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Gagal mengambil data member' }, { status: 500 });
  }
}

// POST /api/member - Create a new member
export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = memberSchema.parse(body);
    
    const existingMember = await prisma.member.findUnique({
      where: { phone: data.phone },
    });
    
    if (existingMember) {
      return NextResponse.json({ error: 'Nomor telepon sudah digunakan' }, { status: 409 });
    }
    
    const member = await prisma.member.create({ data });
    
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat member' }, { status: 500 });
  }
}

// PUT /api/member - Update a member
export async function PUT(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = memberUpdateSchema.parse(body);
    
    const existingMember = await prisma.member.findFirst({
      where: {
        phone: data.phone,
        id: { not: id },
      },
    });
    
    if (existingMember) {
      return NextResponse.json({ error: 'Nomor telepon sudah digunakan' }, { status: 409 });
    }
    
    const updatedMember = await prisma.member.update({
      where: { id },
      data,
    });
    
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui member' }, { status: 500 });
  }
}

// DELETE /api/member - Delete single or multiple members
export async function DELETE(request) {
  const session = await getSession();
  // Note: Stricter role for deletion
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let idsToDelete = [];

    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids)) {
        idsToDelete = body.ids;
      }
    } catch (e) {
      // Ignore if body is empty
    }

    if (idsToDelete.length === 0) {
      const singleId = searchParams.get('id');
      if (singleId) idsToDelete = [singleId];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'ID member harus disediakan' }, { status: 400 });
    }

    const saleCount = await prisma.sale.count({
      where: { memberId: { in: idsToDelete } },
    });

    if (saleCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus karena member masih memiliki ${saleCount} riwayat transaksi.` },
        { status: 400 }
      );
    }
    
    const { count } = await prisma.member.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    if (count === 0) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ message: `Berhasil menghapus ${count} member.` });
  } catch (error) {
    console.error('Error deleting members:', error);
    return NextResponse.json({ error: 'Gagal menghapus member' }, { status: 500 });
  }
}