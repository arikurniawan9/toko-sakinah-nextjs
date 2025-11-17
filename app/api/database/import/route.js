import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';
import { pipeline } from 'stream';
import { Writable } from 'stream';

const execAsync = promisify(exec);

// Function to parse the database URL
const parseDatabaseUrl = (url) => {
    const dbUrl = new URL(url);
    return {
        user: dbUrl.username,
        password: dbUrl.password,
        host: dbUrl.hostname,
        port: dbUrl.port,
        database: dbUrl.pathname.split('/')[1],
    };
};

// Helper to write the uploaded file to disk
async function saveFile(file) {
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }
    const filePath = path.join(backupsDir, file.name);
    const fileStream = fs.createWriteStream(filePath);
    const readableStream = file.stream();

    await new Promise((resolve, reject) => {
        readableStream.pipe(fileStream).on('finish', resolve).on('error', reject);
    });

    return filePath;
}


export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filePath = await saveFile(file);

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
        }

        const { user, password, host, port, database } = parseDatabaseUrl(dbUrl);

        const env = { ...process.env, PGPASSWORD: password };

        // The command to restore the database.
        // --clean: drops database objects before recreating them.
        // --if-exists: avoids errors if objects don't exist.
        const command = `pg_restore --host=${host} --port=${port} --username=${user} --dbname=${database} --clean --if-exists ${filePath}`;

        await execAsync(command, { env });

        // Clean up the uploaded file after restore
        fs.unlinkSync(filePath);

        return NextResponse.json({ message: 'Import successful' });

    } catch (error) {
        console.error('Import failed:', error);
        return NextResponse.json({ error: 'Import failed', details: error.message }, { status: 500 });
    }
}
