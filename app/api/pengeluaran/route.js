// app/api/pengeluaran/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// GET: Fetch all expenses with pagination, search, and filtering
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const userId = searchParams.get('userId') || '';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Build where condition for filtering
    const whereCondition = {
      storeId: storeId, // <-- MULTI-TENANCY FIX
      AND: [
        // Search condition - search in amount, description, category name, or user name
        search ? {
          OR: [
            { description: { contains: search } },
            { amount: { equals: parseInt(search) } }, // Allow exact match for amounts
            { category: { name: { contains: search } } },
            { user: { name: { contains: search } } }
          ]
        } : {},
        
        // Date range condition
        ...(startDate && endDate ? [{
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }] : startDate ? [{
          date: { gte: new Date(startDate) }
        }] : endDate ? [{
          date: { lte: new Date(endDate) }
        }] : []),
        
        // Category filter
        categoryId ? { expenseCategoryId: categoryId } : {},
        
        // User filter
        userId ? { createdBy: userId } : {}
      ]
    };

    // Get expenses with pagination and include related data
    const expenses = await prisma.expense.findMany({
      where: whereCondition,
      skip: offset,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        category: true,
        user: true
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.expense.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      expenses,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalCount,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalCount)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new expense
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { expenseCategoryId, amount, description, date } = data;

    // Validate required fields
    if (!expenseCategoryId || !amount) {
      return NextResponse.json({ error: 'Kategori pengeluaran dan jumlah pengeluaran wajib diisi' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Jumlah pengeluaran harus lebih besar dari 0' }, { status: 400 });
    }

    // Convert date string to proper Date object if needed
    let expenseDate = new Date();
    if (date) {
      // If it's a string, try to parse it
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        expenseDate = parsedDate;
      } else {
        // If parsing fails, default to current date
        expenseDate = new Date();
      }
    }

    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Create expense
    const newExpense = await prisma.expense.create({
      data: {
        storeId: storeId, // <-- MULTI-TENANCY FIX
        expenseCategoryId,
        amount,
        description: description || null,
        date: expenseDate,
        createdBy: session.user.id
      },
      include: {
        category: true,
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil disimpan',
      expense: newExpense
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing expense
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, expenseCategoryId, amount, description, date } = data;

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'ID pengeluaran wajib diisi' }, { status: 400 });
    }

    if (!expenseCategoryId || !amount) {
      return NextResponse.json({ error: 'Kategori pengeluaran dan jumlah pengeluaran wajib diisi' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Jumlah pengeluaran harus lebih besar dari 0' }, { status: 400 });
    }

    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Check if expense exists and belongs to the store
    const existingExpense = await prisma.expense.findFirst({
      where: { 
        id: id,
        storeId: storeId // <-- MULTI-TENANCY FIX
      }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Pengeluaran tidak ditemukan atau Anda tidak memiliki akses' }, { status: 404 });
    }

    // Convert date string to proper Date object if needed
    let expenseDate = existingExpense.date;
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        expenseDate = parsedDate;
      }
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id }, // id is unique, so this is safe after the check above
      data: {
        expenseCategoryId,
        amount,
        description: description || null,
        date: expenseDate
      },
      include: {
        category: true,
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil diperbarui',
      expense: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an expense
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pengeluaran wajib diisi' }, { status: 400 });
    }

    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Check if expense exists and belongs to the store
    const existingExpense = await prisma.expense.findFirst({
      where: { 
        id: id,
        storeId: storeId // <-- MULTI-TENANCY FIX
      }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Pengeluaran tidak ditemukan atau Anda tidak memiliki akses' }, { status: 404 });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id } // id is unique, so this is safe after the check above
    });

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}