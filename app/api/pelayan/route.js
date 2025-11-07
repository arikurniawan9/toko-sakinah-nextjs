// app/api/pelayan/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/pelayan - Get all attendants with pagination and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build where clause for search
    let whereClause = {
      role: 'ATTENDANT' // Only get users with ATTENDANT role
    };
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search } },
          { username: { contains: search } }
        ]
      };
    }
    
    // Get attendants with pagination and search
    const users = await prisma.user.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    // Get total count for pagination
    const totalCount = await prisma.user.count({ where: whereClause });
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendants' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/pelayan - Create a new attendant
export async function POST(request) {
  try {
    const { name, username, password, role } = await request.json();
    
    // Validation
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Nama, username, dan password wajib diisi' }, 
        { status: 400 }
      );
    }
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the attendant
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashedPassword,
        role: 'ATTENDANT', // Fixed role for attendant
      }
    });
    
    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating attendant:', error);
    return NextResponse.json(
      { error: 'Failed to create attendant' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/pelayan - Update an attendant
export async function PUT(request) {
  try {
    const { id, name, username, password } = await request.json();
    
    // Validation
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
    
    // Check if username already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: id }  // Exclude current user
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData = {
      name: name.trim(),
      username: username.trim(),
    };
    
    // Add password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update the attendant
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating attendant:', error);
    
    // Check if it's a Prisma error (e.g., record not found)
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
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/pelayan - Delete single or multiple attendants
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // If no IDs array is provided, try to delete a single attendant by ID from query
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID pelayan atau array ID harus disediakan' }, 
          { status: 400 }
        );
      }
      
      // Delete single attendant
      await prisma.user.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Pelayan berhasil dihapus' });
    }
    
    // Delete multiple attendants
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: ids },
        role: 'ATTENDANT' // Only allow deletion of attendants
      }
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedUsers.count} pelayan`,
      deletedCount: deletedUsers.count
    });
  } catch (error) {
    console.error('Error deleting attendants:', error);
    
    // Check if it's a Prisma error (e.g., record not found)
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
  } finally {
    await prisma.$disconnect();
  }
}