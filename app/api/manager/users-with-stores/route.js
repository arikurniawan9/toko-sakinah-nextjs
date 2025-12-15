export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// GET /api/manager/users-with-stores - Get all users with their associated stores (for MANAGER role)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    const whereConditions = [];

    // Role filtering: if a specific role is passed, use it. Otherwise, exclude WAREHOUSE.
    if (role) {
      whereConditions.push({ role: role });
    } else {
      whereConditions.push({ role: { not: ROLES.WAREHOUSE } });
    }

    // Status filtering
    if (status) {
      whereConditions.push({ status: status });
    }

    // Search filtering
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { employeeNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Get users with their associated stores
    const [users, totalCount] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          username: true,
          employeeNumber: true,
          code: true,
          address: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          storeUsers: {
            where: { status: 'AKTIF' }, // Only include active store associations
            select: {
              id: true,
              role: true, // Role in store
              store: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  status: true,
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Format the response to include store information with each user
    const usersWithStores = users.map(user => ({
      ...user,
      stores: user.storeUsers.map(storeUser => ({
        id: storeUser.store.id,
        name: storeUser.store.name,
        code: storeUser.store.code,
        status: storeUser.store.status,
        roleInStore: storeUser.role,
      })),
      storeUsers: undefined // Remove the original storeUsers field for cleaner response
    }));

    return NextResponse.json({
      users: usersWithStores,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users with stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users with stores' },
      { status: 500 }
    );
  }
}