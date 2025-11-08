// app/api/produk/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

export async function POST(request) {
  return NextResponse.json(
    { 
      error: 'Fungsi impor dinonaktifkan sementara. Struktur file impor perlu didefinisikan ulang untuk mendukung model harga bertingkat yang baru.' 
    }, 
    { status: 503 } // 503 Service Unavailable
  );
}