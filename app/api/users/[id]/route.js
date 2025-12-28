import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    // Allow access for warehouse managers or if the user is fetching their own data
    if (!session || (![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role) && session.user.id !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Do not return the password hash
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
