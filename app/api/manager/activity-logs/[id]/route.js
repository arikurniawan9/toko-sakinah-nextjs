// app/api/manager/activity-logs/[id]/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    // Validasi ID
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID aktivitas wajib disediakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah log aktivitas ada
    const activity = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          }
        },
        store: true
      },
    });

    if (!activity) {
      return new Response(JSON.stringify({ error: 'Aktivitas tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ activity }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching activity detail:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}