import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
        return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Basic security check to prevent directory traversal
    if (fileName.includes('..')) {
        return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    try {
        const backupsDir = path.join(process.cwd(), 'backups');
        const filePath = path.join(backupsDir, fileName);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

        return new NextResponse(fileBuffer, { headers });

    } catch (error) {
        console.error('Download failed:', error);
        return NextResponse.json({ error: 'Download failed', details: error.message }, { status: 500 });
    }
}
