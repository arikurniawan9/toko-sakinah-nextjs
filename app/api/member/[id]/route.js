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

    const member = await prisma.member.findUnique({
      where: {
        id: params.id,
      },
    });

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