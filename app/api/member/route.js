// app/api/member/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/member - Get all members with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let members;
    let totalCount;

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      
      // Fetch members with raw query for case-insensitive search
      members = await prisma.$queryRaw`
        SELECT * FROM Member
        WHERE LOWER(name) LIKE ${searchLower} 
           OR LOWER(phone) LIKE ${searchLower}
           OR LOWER(address) LIKE ${searchLower}
           OR LOWER(membershipType) LIKE ${searchLower}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Count total members matching the search with raw query
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Member
        WHERE LOWER(name) LIKE ${searchLower} 
           OR LOWER(phone) LIKE ${searchLower}
           OR LOWER(address) LIKE ${searchLower}
           OR LOWER(membershipType) LIKE ${searchLower}
      `;
      totalCount = Number(countResult[0].count);

    } else {
      // Standard Prisma findMany when no search term
      members = await prisma.member.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      totalCount = await prisma.member.count();
    }
    
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
    return NextResponse.json(
      { error: 'Failed to fetch members' }, 
      { status: 500 }
    );
  }
}

// POST /api/member - Create a new member
export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || data.name.trim() === '' || !data.phone || data.phone.trim() === '') {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingMember = await prisma.$queryRaw`
      SELECT * FROM Member WHERE LOWER(phone) = LOWER(${data.phone.trim()})
    `;
    
    if (existingMember && existingMember.length > 0) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah digunakan' }, 
        { status: 400 }
      );
    }

    const validMembershipTypes = ['SILVER', 'GOLD', 'PLATINUM'];
    if (!data.membershipType || !validMembershipTypes.includes(data.membershipType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Tipe keanggotaan tidak valid' }, 
        { status: 400 }
      );
    }
    if (typeof data.discount !== 'number' || data.discount < 0 || data.discount > 100) {
      return NextResponse.json(
        { error: 'Diskon harus berupa angka antara 0 dan 100' }, 
        { status: 400 }
      );
    }
    
    const member = await prisma.member.create({
      data: {
        ...data,
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: data.address?.trim() || null,
        membershipType: data.membershipType.toUpperCase(),
        discount: parseInt(data.discount),
      },
    });
    
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' }, 
      { status: 500 }
    );
  }
}

// PUT /api/member - Update a member
export async function PUT(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID member wajib disediakan' }, 
        { status: 400 }
      );
    }
    if (!data.name || data.name.trim() === '' || !data.phone || data.phone.trim() === '') {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingMember = await prisma.$queryRaw`
      SELECT * FROM Member WHERE LOWER(phone) = LOWER(${data.phone.trim()}) AND id != ${data.id}
    `;
    
    if (existingMember && existingMember.length > 0) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah digunakan' }, 
        { status: 400 }
      );
    }

    const validMembershipTypes = ['SILVER', 'GOLD', 'PLATINUM'];
    if (!data.membershipType || !validMembershipTypes.includes(data.membershipType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Tipe keanggotaan tidak valid' }, 
        { status: 400 }
      );
    }
    if (typeof data.discount !== 'number' || data.discount < 0 || data.discount > 100) {
      return NextResponse.json(
        { error: 'Diskon harus berupa angka antara 0 dan 100' }, 
        { status: 400 }
      );
    }
    
    const updatedMember = await prisma.member.update({
      where: { id: data.id },
      data: {
        ...data,
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: data.address?.trim() || null,
        membershipType: data.membershipType.toUpperCase(),
        discount: parseInt(data.discount),
      },
    });
    
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Member tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update member' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/member - Delete single or multiple members
export async function DELETE(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let idsToDelete = [];

    // Try to get IDs from request body (for multiple deletions)
    const requestBody = await request.json().catch(() => ({})); // Handle case where body is empty or not JSON
    if (requestBody.ids && Array.isArray(requestBody.ids) && requestBody.ids.length > 0) {
      idsToDelete = requestBody.ids;
    } else {
      // If not in body, try to get a single ID from query params (for single deletion)
      const singleId = searchParams.get('id');
      if (singleId) {
        idsToDelete = [singleId];
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'ID member atau array ID harus disediakan' }, 
        { status: 400 }
      );
    }

    const membersWithSales = await prisma.sale.findMany({
      where: {
        memberId: { in: idsToDelete },
      },
      select: {
        memberId: true,
      },
    });

    if (membersWithSales.length > 0) {
      const memberIds = [...new Set(membersWithSales.map((s) => s.memberId))];
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus member karena beberapa member masih memiliki transaksi penjualan terkait', 
          problematicIds: memberIds,
        }, 
        { status: 400 }
      );
    }
    
    const deletedMembers = await prisma.member.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedMembers.count} member`,
      deletedCount: deletedMembers.count,
    });
  } catch (error) {
    console.error('Error deleting members:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Member tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete members' }, 
      { status: 500 }
    );
  }
}