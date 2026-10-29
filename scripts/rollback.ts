import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function rollback() {
  const args = process.argv.slice(2);
  const migrationName = args[0];
  const backupFile = args[1];

  if (!migrationName && !backupFile) {
    console.log('Usage:');
    console.log('  npm run rollback <migration-name>     # Rollback to specific migration');
    console.log('  npm run rollback -- --backup <file>   # Restore from backup file');
    process.exit(1);
  }

  try {
    if (backupFile) {
      await restoreFromBackup(backupFile);
    } else if (migrationName) {
      await rollbackMigration(migrationName);
    }
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function rollbackMigration(migrationName: string) {
  console.log(`🔄 Rolling back to migration: ${migrationName}`);
  
  execSync(`npx prisma migrate resolve --rolled-back "${migrationName}"`, { stdio: 'inherit' });
  execSync('npx prisma db pull', { stdio: 'inherit' });
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Migration rollback completed');
}

async function restoreFromBackup(backupPath: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const fullPath = path.isAbsolute(backupPath) ? backupPath : path.join(process.cwd(), backupPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Backup file not found: ${fullPath}`);
  }

  console.log(`🔄 Restoring from backup: ${fullPath}`);
  
  execSync(`psql "${databaseUrl}" < "${fullPath}"`, { stdio: 'inherit' });
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Database restored from backup');
}

rollback();