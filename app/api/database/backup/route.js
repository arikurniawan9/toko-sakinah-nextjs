import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';

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

export async function POST() {
    try {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
        }

        const { user, password, host, port, database } = parseDatabaseUrl(dbUrl);

        const backupsDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `backup-${timestamp}.sql`;
        const backupFilePath = path.join(backupsDir, backupFileName);

        // IMPORTANT: Set the password as an environment variable for the child process
        // to avoid it being visible in the command line history.
        const env = { ...process.env, PGPASSWORD: password };

        const command = `pg_dump --host=${host} --port=${port} --username=${user} --dbname=${database} --format=c --blobs --file=${backupFilePath}`;

        await execAsync(command, { env });

        return NextResponse.json({
            message: 'Backup created successfully',
            filePath: backupFilePath,
            fileName: backupFileName,
        });
    } catch (error) {
        console.error('Backup failed:', error);
        return NextResponse.json({ error: 'Backup failed', details: error.message }, { status: 500 });
    }
}
