// app/api/member/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      const allMembers = await prisma.member.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      const filteredMembers = allMembers.filter(member => 
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.phone.toLowerCase().includes(search.toLowerCase()) ||
        (member.address && member.address.toLowerCase().includes(search.toLowerCase())) ||
        member.membershipType.toLowerCase().includes(search.toLowerCase())
      );
      
      members = filteredMembers.slice(offset, offset + limit);
      totalCount = filteredMembers.length;
      
    } else {
      members = await prisma.member.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      totalCount = await prisma.member.count();
    }
    
    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/member - Create a new member
export async function POST(request) {
  try {
    const { name, phone, address, membershipType, discount } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama member wajib diisi' }, 
        { status: 400 }
      );
    }
    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { error: 'Nomor telepon wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingMember = await prisma.member.findFirst({
      where: { phone: { equals: phone.trim(), mode: 'insensitive' } }
    });
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah digunakan' }, 
        { status: 400 }
      );
    }

    // Basic validation for membershipType and discount
    const validMembershipTypes = ['SILVER', 'GOLD', 'PLATINUM']; // Example types
    if (!membershipType || !validMembershipTypes.includes(membershipType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Tipe keanggotaan tidak valid' }, 
        { status: 400 }
      );
    }
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return NextResponse.json(
        { error: 'Diskon harus berupa angka antara 0 dan 100' }, 
        { status: 400 }
      );
    }
    
    const member = await prisma.member.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        membershipType: membershipType.toUpperCase(),
        discount: parseInt(discount),
      }
    });
    
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/member - Update a member
export async function PUT(request) {
  try {
    const { id, name, phone, address, membershipType, discount } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID member wajib disediakan' }, 
        { status: 400 }
      );
    }
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama member wajib diisi' }, 
        { status: 400 }
      );
    }
    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { error: 'Nomor telepon wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingMember = await prisma.member.findFirst({
      where: { 
        id: { not: id },
        phone: { equals: phone.trim(), mode: 'insensitive' }
      }
    });
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah digunakan' }, 
        { status: 400 }
      );
    }

    // Basic validation for membershipType and discount
    const validMembershipTypes = ['SILVER', 'GOLD', 'PLATINUM']; // Example types
    if (!membershipType || !validMembershipTypes.includes(membershipType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Tipe keanggotaan tidak valid' }, 
        { status: 400 }
      );
    }
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return NextResponse.json(
        { error: 'Diskon harus berupa angka antara 0 dan 100' }, 
        { status: 400 }
      );
    }
    
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        membershipType: membershipType.toUpperCase(),
        discount: parseInt(discount),
      }
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
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/member - Delete single or multiple members
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID member atau array ID harus disediakan' }, 
          { status: 400 }
        );
      }
      
      const salesCount = await prisma.sale.count({
        where: { memberId: id }
      });
      
      if (salesCount > 0) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus member karena masih memiliki transaksi penjualan terkait' }, 
          { status: 400 }
        );
      }
      
      await prisma.member.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Member berhasil dihapus' });
    }
    
    const membersWithSales = await prisma.sale.findMany({
      where: {
        memberId: { in: ids }
      },
      select: {
        memberId: true
      }
    });
    
    if (membersWithSales.length > 0) {
      const memberIds = membersWithSales.map(s => s.memberId);
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus member karena beberapa member masih memiliki transaksi penjualan terkait', 
          problematicIds: memberIds 
        }, 
        { status: 400 }
      );
    }
    
    const deletedMembers = await prisma.member.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedMembers.count} member`,
      deletedCount: deletedMembers.count
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
  } finally {
    await prisma.$disconnect();
  }
}
