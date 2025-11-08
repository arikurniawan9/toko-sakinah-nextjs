
// app/api/pelayan/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/pelayan - Get all attendants with pagination and search
export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let users;
    let totalCount;

    // Only get users with ATTENDANT role
    const baseWhere = `WHERE role = 'ATTENDANT'`;
    let searchQuery = '';

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      searchQuery = `AND (LOWER(name) LIKE ${searchLower} OR LOWER(username) LIKE ${searchLower})`;

      // Fetch users with raw query for case-insensitive search
      users = await prisma.$queryRaw`
        SELECT * FROM User
        ${baseWhere} ${searchQuery}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Count total users matching the search with raw query
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM User
        ${baseWhere} ${searchQuery}
      `;
      totalCount = Number(countResult[0].count);

    } else {
      // Standard Prisma findMany when no search term
      users = await prisma.user.findMany({
        where: { role: 'ATTENDANT' },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      totalCount = await prisma.user.count({ where: { role: 'ATTENDANT' } });
    }
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching attendants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendants' }, 
      { status: 500 }
    );
  }
}

// POST /api/pelayan - Create a new attendant
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, username, password } = await request.json();
    
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Nama, username, dan password wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashedPassword,
        role: 'ATTENDANT',
      },
    });
    
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating attendant:', error);
    return NextResponse.json(
      { error: 'Failed to create attendant' }, 
      { status: 500 }
    );
  }
}

// PUT /api/pelayan - Update an attendant
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, username, password } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID pelayan wajib disediakan' }, 
        { status: 400 }
      );
    }
    
    if (!name || !username) {
      return NextResponse.json(
        { error: 'Nama dan username wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: id },
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const updateData = {
      name: name.trim(),
      username: username.trim(),
    };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating attendant:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Pelayan tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update attendant' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/pelayan - Delete single or multiple attendants
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
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
        { error: 'ID pelayan atau array ID harus disediakan' }, 
        { status: 400 }
      );
    }
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: idsToDelete },
        role: 'ATTENDANT',
      },
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedUsers.count} pelayan`,
      deletedCount: deletedUsers.count,
    });
  } catch (error) {
    console.error('Error deleting attendants:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Pelayan tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete attendants' }, 
      { status: 500 }
    );
  }
}
