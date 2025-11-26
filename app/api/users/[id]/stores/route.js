import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET /api/users/[id]/stores - Get stores accessible by a specific user
export async function GET(request, { params }) {
  try {
    // Check if the request is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Only allow the user themselves or manager/warehouse to access this endpoint
    if (session.user.id !== userId &&
        session.user.role !== 'MANAGER' &&
        session.user.role !== 'WAREHOUSE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all stores that the user has access to
    // Using 'AKTIF' to match the database value as used in authOptions.js for StoreUser status consistency
    const storeUsers = await prisma.storeUser.findMany({
      where: {
        userId: userId,
        status: 'AKTIF',
      },
      include: {
        store: true, // Include store information
      },
    });

    // Format the response to include store details and user's role in each store
    const stores = storeUsers.map(storeUser => ({
      id: storeUser.store.id,
      name: storeUser.store.name,
      description: storeUser.store.description,
      role: storeUser.role, // The user's role in this specific store
      status: storeUser.store.status,
    }));

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching user stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stores' },
      { status: 500 }
    );
  }
}