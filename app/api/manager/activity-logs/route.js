// app/api/manager/activity-logs/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortKey = searchParams.get('sortKey') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const action = searchParams.get('action') || '';
    const entity = searchParams.get('entity') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const userId = searchParams.get('userId') || '';
    const exportParam = searchParams.get('export') || '';

    const skip = (page - 1) * limit;

    // Konstruksi where clause
    const whereClause = {
      AND: [
        search ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { entity: { contains: search, mode: 'insensitive' } },
            { entityId: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
          ],
        } : {},
        action ? { action } : {},
        entity ? { entity } : {},
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo + 'T23:59:59.999Z') } } : {},
        userId ? { userId } : {},
      ],
    };

    // Jika parameter export=true, kembalikan semua data tanpa pagination
    if (exportParam === 'true') {
      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              username: true,
            }
          }
        },
        orderBy: {
          [sortKey]: sortDirection,
        },
      });

      return new Response(JSON.stringify({ logs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil log dengan pagination
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            username: true,
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        [sortKey]: sortDirection,
      },
    });

    // Hitung total item
    const totalItems = await prisma.auditLog.count({
      where: whereClause,
    });

    return new Response(JSON.stringify({
      logs,
      pagination: {
        total: totalItems,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}