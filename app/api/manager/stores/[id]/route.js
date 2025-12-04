// app/api/manager/stores/[id]/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logStoreUpdate, logStoreDeactivation } from '@/lib/auditLogger';

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
      return new Response(JSON.stringify({ error: 'ID toko wajib disediakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah toko ada
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return new Response(JSON.stringify({ error: 'Toko tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ store }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT endpoint untuk mengupdate toko
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const { name, description, address, phone, email, status } = await request.json();

    // Validasi ID
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID toko wajib disediakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi data
    if (!name || !address) {
      return new Response(JSON.stringify({ error: 'Nama dan alamat toko wajib disediakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah toko ada
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      return new Response(JSON.stringify({ error: 'Toko tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simpan data toko sebelum update
    const oldStoreData = { ...existingStore };

    // Update toko
    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name,
        description: description || null,
        address,
        phone: phone || null,
        email: email || null,
        status,
        updatedAt: new Date(),
      },
    });

    // Log aktivitas update toko
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logStoreUpdate(session.user.id, id, oldStoreData, updatedStore, ipAddress, userAgent);

    return new Response(JSON.stringify({ store: updatedStore }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE endpoint untuk menghapus toko (mengubah status menjadi INACTIVE)
export async function DELETE(request, { params }) {
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
      return new Response(JSON.stringify({ error: 'ID toko wajib disediakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah toko ada
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      return new Response(JSON.stringify({ error: 'Toko tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simpan data toko sebelum update
    const oldStoreData = { ...existingStore };

    // Update status toko menjadi INACTIVE
    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    // Log aktivitas deaktivasi toko
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logStoreDeactivation(session.user.id, oldStoreData, ipAddress, userAgent);

    return new Response(JSON.stringify({ store: updatedStore }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}