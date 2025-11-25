// app/api/pelayan/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateShortCode, generateNumericCode } from '@/lib/utils';

// GET /api/pelayan - Get all attendants with pagination and search
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const simple = searchParams.get('simple'); // Parameter untuk format sederhana

  const skip = (page - 1) * limit;

  try {
    const whereClause = {
      role: 'ATTENDANT',
      OR: search ? [
        { name: { contains: search } },
        { username: { contains: search } },
        { phone: { contains: search } },
      ] : undefined,
    };

    const [attendants, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        orderBy: {
          name: 'asc',
        },
        skip: skip,
        take: limit,
        select: {
          id: true,
          name: true,
          username: true,
          code: true, // tambahkan field code
          role: true,
          gender: true,
          phone: true,
          address: true,
          status: true,
          employeeNumber: true, // tambahkan employeeNumber jika ada
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Jika parameter simple ada, kembalikan hanya array attendants
    if (simple) {
      return NextResponse.json(attendants);
    }

    return NextResponse.json({
      users: attendants,
      pagination: {
        total: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      }
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
  try {
    const data = await request.json();
    const { name, username, password, gender, phone, address, status, role } = data;

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique 6-digit numeric code for the attendant
    let uniqueCode;
    let attempt = 0;
    const maxAttempts = 20; // Increased attempts for 6-digit numeric code

    do {
      uniqueCode = generateNumericCode();
      attempt++;

      // Check if code already exists
      const existingCode = await prisma.user.findFirst({
        where: { code: uniqueCode }
      });

      if (!existingCode) {
        break; // Found unique code
      }
    } while (attempt < maxAttempts);

    if (attempt >= maxAttempts) {
      return NextResponse.json(
        { error: 'Gagal membuat kode unik, silakan coba lagi' },
        { status: 500 }
      );
    }

    const newAttendant = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
        gender,
        phone,
        address,
        status,
        code: uniqueCode, // Add the generated code
      },
    });

    return NextResponse.json(newAttendant, { status: 201 });
  } catch (error) {
    console.error('Error creating attendant:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      // Check if it's username or code that's duplicated
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes('username')) {
        return NextResponse.json({ error: `Username '${data.username}' sudah digunakan.` }, { status: 409 });
      } else if (Array.isArray(target) && target.includes('code')) {
        return NextResponse.json({ error: `Kode pelayan '${data.code}' sudah digunakan.` }, { status: 409 });
      } else {
        return NextResponse.json({ error: 'Data sudah digunakan, silakan coba dengan data lain.' }, { status: 409 });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}

// PUT /api/pelayan - Update an attendant
export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, name, username, password, gender, phone, address, status } = data;

    if (!id) {
      return NextResponse.json({ error: 'Attendant ID is required' }, { status: 400 });
    }

    const updateData = {
      name,
      username,
      gender,
      phone,
      address,
      status,
      // code is not included here since we don't want to allow changing it
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAttendant = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedAttendant);
  } catch (error) {
    console.error('Error updating attendant:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      return NextResponse.json({ error: `Username '${error.meta.target}' sudah digunakan.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}