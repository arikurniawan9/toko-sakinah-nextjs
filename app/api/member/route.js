// app/api/member/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

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

    const skip = (page - 1) * limit;

    const whereClause = search 
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

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

    // Validasi input
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon wajib diisi' }, 
        { status: 400 }
      );
    }

    // Cek apakah nomor telepon sudah terdaftar
    const existingMember = await prisma.member.findUnique({
      where: { phone },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar' }, 
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

    const newMember = await prisma.member.create({
      data: {
        name,
        phone,
        address: address || null,
        membershipType: membershipType || 'SILVER', // Default to SILVER
        discount: membershipType === 'GOLD' ? 10 : membershipType === 'PLATINUM' ? 15 : 5, // Default 5% for SILVER
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}