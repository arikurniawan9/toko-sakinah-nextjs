// app/api/member/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dapatkan storeId dari session
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Periksa apakah permintaan datang dari konteks transaksi
    const url = new URL(request.url);
    const context = url.searchParams.get('context'); // Jika context=transaction, ini untuk transaksi

    let member;

    if (context === 'transaction') {
      // Untuk konteks transaksi, izinkan akses ke member dari toko manapun
      member = await prisma.member.findUnique({
        where: {
          id: params.id,
        },
      });
    } else {
      // Untuk konteks administrasi, batasi hanya member dari toko ini
      member = await prisma.member.findUnique({
        where: {
          id: params.id,
          storeId: storeId, // Tambahkan filter storeId untuk administrasi
        },
      });
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        address: member.address,
        membershipType: member.membershipType,
        discount: member.discount,
        createdAt: member.createdAt,
      }
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}