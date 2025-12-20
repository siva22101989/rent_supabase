#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates automated backups of the Supabase database
 * 
 * Usage:
 *   node scripts/backup-database.js
 *   node scripts/backup-database.js --restore backup_20251220.sql
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7; // Keep last 7 backups

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Get database connection string from environment
 */
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!url) {
    console.error('❌ DATABASE_URL or SUPABASE_DB_URL not found in environment');
    console.error('   Set it in .env.local or pass as environment variable');
    process.exit(1);
  }
  
  return url;
}

/**
 * Create a database backup
 */
function createBackup() {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);
  
  console.log('📦 Creating database backup...');
  console.log(`   File: ${backupFile}`);
  
  try {
    const dbUrl = getDatabaseUrl();
    
    // Use pg_dump to create backup
    execSync(`pg_dump "${dbUrl}" > "${backupFile}"`, {
      stdio: 'inherit',
    });
    
    console.log('✅ Backup created successfully!');
    
    // Clean up old backups
    cleanupOldBackups();
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Restore from a backup file
 */
function restoreBackup(backupFile) {
  const fullPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Backup file not found: ${fullPath}`);
    process.exit(1);
  }
  
  console.log('⚠️  WARNING: This will restore the database from backup');
  console.log(`   File: ${fullPath}`);
  console.log('   All current data will be replaced!');
  console.log('');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // Wait 5 seconds
  execSync('sleep 5', { stdio: 'inherit' });
  
  console.log('🔄 Restoring database...');
  
  try {
    const dbUrl = getDatabaseUrl();
    
    // Use psql to restore backup
    execSync(`psql "${dbUrl}" < "${fullPath}"`, {
      stdio: 'inherit',
    });
    
    console.log('✅ Database restored successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

/**
 * List available backups
 */
function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log('📦 No backups found');
    return;
  }
  
  console.log('📦 Available backups:');
  files.forEach((file, index) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    const date = stats.mtime.toISOString().split('T')[0];
    
    console.log(`   ${index + 1}. ${file} (${size} MB, ${date})`);
  });
}

/**
 * Clean up old backups, keeping only MAX_BACKUPS
 */
function cleanupOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length > MAX_BACKUPS) {
    console.log(`🧹 Cleaning up old backups (keeping ${MAX_BACKUPS})...`);
    
    files.slice(MAX_BACKUPS).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`   Deleted: ${file.name}`);
    });
  }
}

/**
 * Verify backup integrity
 */
function verifyBackup(backupFile) {
  const fullPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Backup file not found: ${fullPath}`);
    return false;
  }
  
  console.log('🔍 Verifying backup integrity...');
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Basic checks
    const hasHeader = content.includes('PostgreSQL database dump');
    const hasData = content.length > 1000;
    const hasFooter = content.includes('PostgreSQL database dump complete');
    
    if (hasHeader && hasData && hasFooter) {
      console.log('✅ Backup appears to be valid');
      return true;
    } else {
      console.log('⚠️  Backup may be incomplete or corrupted');
      return false;
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case '--restore':
    if (!args[1]) {
      console.error('❌ Please specify backup file to restore');
      console.error('   Usage: node scripts/backup-database.js --restore backup_20251220.sql');
      process.exit(1);
    }
    restoreBackup(args[1]);
    break;
  
  case '--list':
    listBackups();
    break;
  
  case '--verify':
    if (!args[1]) {
      console.error('❌ Please specify backup file to verify');
      process.exit(1);
    }
    verifyBackup(args[1]);
    break;
  
  case '--help':
    console.log('Database Backup Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/backup-database.js           Create a new backup');
    console.log('  node scripts/backup-database.js --list    List available backups');
    console.log('  node scripts/backup-database.js --restore <file>  Restore from backup');
    console.log('  node scripts/backup-database.js --verify <file>   Verify backup integrity');
    console.log('');
    console.log('Environment Variables:');
    console.log('  DATABASE_URL or SUPABASE_DB_URL - PostgreSQL connection string');
    break;
  
  default:
    createBackup();
}
