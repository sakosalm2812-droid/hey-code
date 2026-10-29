import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `hey-backup-${timestamp}.sql`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  try {
    console.log(`📦 Creating backup: ${backupFile}`);
    
    const pgDumpCommand = `pg_dump "${databaseUrl}" > "${backupFile}"`;
    execSync(pgDumpCommand, { stdio: 'inherit' });

    const stats = fs.statSync(backupFile);
    console.log(`✅ Backup created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    const uploadToS3 = process.env.BACKUP_S3_BUCKET;
    if (uploadToS3) {
      console.log(`☁️ Uploading to S3: ${uploadToS3}`);
      execSync(`aws s3 cp "${backupFile}" "s3://${uploadToS3}/hey-backup-${timestamp}.sql"`, { stdio: 'inherit' });
      console.log('✅ Uploaded to S3');
    }

    const retentionDays = 30;
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('hey-backup-') && f.endsWith('.sql'))
      .map(f => ({ name: f, path: path.join(backupDir, f), time: fs.statSync(path.join(backupDir, f)).mtime }))
      .sort((a, b) => b.time.getTime() - a.time.getTime());

    for (const file of files.slice(retentionDays)) {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Deleted old backup: ${file.name}`);
    }

    console.log('✅ Backup completed successfully');
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();